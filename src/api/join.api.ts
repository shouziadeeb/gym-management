import { supabase } from '@/lib/supabase';

export type GymJoinMode = 'instant' | 'approval' | 'invite_only';

export type GymJoinContext = {
  ok: true;
  gym_id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  join_mode: GymJoinMode;
  is_member: boolean;
  join_request_status: 'pending' | 'approved' | 'rejected' | 'cancelled' | null;
};

export type GymJoinContextError = {
  ok: false;
  error:
    | 'INVALID_SLUG'
    | 'GYM_NOT_FOUND'
    | 'GYM_INACTIVE'
    | 'JOIN_DISABLED'
    | 'JOIN_LINK_EXPIRED'
    | 'UNKNOWN';
};

export type CreateJoinRequestResult =
  | { ok: true; status: 'active' | 'pending'; mode: GymJoinMode; request_id?: string }
  | {
      ok: false;
      error: 'UNAUTHORIZED' | 'GYM_INACTIVE' | 'INVITE_ONLY' | 'ALREADY_MEMBER' | 'UNKNOWN';
    };

function normalizeJoinContext(payload: unknown): GymJoinContext | GymJoinContextError {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'UNKNOWN' };
  }

  const row = payload as Record<string, unknown>;
  if (row.ok === false) {
    const code = String(row.error ?? 'UNKNOWN') as GymJoinContextError['error'];
    return { ok: false, error: code };
  }

  return {
    ok: true,
    gym_id: String(row.gym_id ?? ''),
    slug: String(row.slug ?? ''),
    name: String(row.name ?? 'Gym'),
    description: typeof row.description === 'string' ? row.description : null,
    logo_url: typeof row.logo_url === 'string' ? row.logo_url : null,
    address: typeof row.address === 'string' ? row.address : null,
    join_mode: (row.join_mode as GymJoinMode) ?? 'approval',
    is_member: Boolean(row.is_member),
    join_request_status: (row.join_request_status as GymJoinContext['join_request_status']) ?? null,
  };
}

/** Public gym preview for join landing (works for anon + auth). */
export async function resolveGymJoinContext(slug: string): Promise<GymJoinContext | GymJoinContextError> {
  const { data, error } = await supabase.rpc('resolve_gym_join_context', { p_slug: slug });
  if (error) {
    return { ok: false, error: 'UNKNOWN' };
  }
  return normalizeJoinContext(data);
}

/** Member-initiated join via QR / deep link / web. */
export async function createGymJoinRequest(
  gymId: string,
  source: 'qr_scan' | 'deep_link' | 'web' | 'app' = 'deep_link',
): Promise<CreateJoinRequestResult> {
  const { data, error } = await supabase.rpc('create_gym_join_request', {
    p_gym_id: gymId,
    p_source: source,
  });

  if (error) {
    return { ok: false, error: 'UNKNOWN' };
  }

  const row = data as Record<string, unknown>;
  if (row.ok === false) {
    const errorCode = String(row.error ?? 'UNKNOWN');
    return { ok: false, error: errorCode as Extract<CreateJoinRequestResult, { ok: false }>['error'] };
  }

  return {
    ok: true,
    status: row.status === 'active' ? 'active' : 'pending',
    mode: (row.mode as GymJoinMode) ?? 'approval',
    request_id: typeof row.request_id === 'string' ? row.request_id : undefined,
  };
}

export function mapJoinContextError(code: GymJoinContextError['error']): string {
  switch (code) {
    case 'GYM_NOT_FOUND':
      return 'This gym could not be found.';
    case 'GYM_INACTIVE':
      return 'This gym is not accepting new members right now.';
    case 'JOIN_DISABLED':
      return 'QR joining is disabled for this gym.';
    case 'JOIN_LINK_EXPIRED':
      return 'This join link has expired. Ask the gym for a new QR code.';
    case 'INVALID_SLUG':
      return 'Invalid gym link.';
    default:
      return 'Could not load gym information.';
  }
}

export function mapJoinRequestError(code: string): string {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Please sign in to join this gym.';
    case 'ALREADY_MEMBER':
      return 'You are already a member of this gym.';
    case 'INVITE_ONLY':
      return 'This gym only accepts owner invitations.';
    default:
      return 'Could not submit your join request.';
  }
}

export type UserGymJoinStatus = {
  isMember: boolean;
  joinRequestStatus: GymJoinContext['join_request_status'];
  requestId: string | null;
};

export async function fetchUserGymJoinStatus(
  gymId: string,
  userId: string,
): Promise<UserGymJoinStatus> {
  const [{ data: membership }, { data: request }] = await Promise.all([
    supabase
      .from('gym_memberships')
      .select('id')
      .eq('gym_id', gymId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('left_at', null)
      .maybeSingle(),
    supabase
      .from('gym_join_requests')
      .select('id, status')
      .eq('gym_id', gymId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const isMember = Boolean(membership);
  const rawStatus = request?.status as UserGymJoinStatus['joinRequestStatus'] | undefined;

  // Stale row: approved in DB but membership was removed — user may connect again.
  const joinRequestStatus =
    !isMember && rawStatus === 'approved' ? null : (rawStatus ?? null);

  return {
    isMember,
    joinRequestStatus,
    requestId: typeof request?.id === 'string' ? request.id : null,
  };
}

export type OwnerJoinRequestDetail = {
  id: string;
  gymId: string;
  gymName: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  source: string;
  createdAt: string;
  requester: {
    fullName: string | null;
    phone: string | null;
    email: string | null;
    avatarUrl: string | null;
    accountType: string | null;
  };
};

export async function fetchGymJoinRequestForOwner(
  requestId: string,
): Promise<OwnerJoinRequestDetail | null> {
  const { data, error } = await supabase
    .from('gym_join_requests')
    .select(
      'id, gym_id, user_id, status, source, created_at, requester:profiles!user_id(full_name, phone, email, avatar_url, account_type), gym:gyms!gym_id(name)',
    )
    .eq('id', requestId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const requester = data.requester as {
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    account_type?: string | null;
  } | null;
  const gym = data.gym as { name?: string | null } | null;

  return {
    id: data.id as string,
    gymId: data.gym_id as string,
    gymName: gym?.name ?? 'Gym',
    userId: data.user_id as string,
    status: data.status as OwnerJoinRequestDetail['status'],
    source: String(data.source ?? 'app'),
    createdAt: data.created_at as string,
    requester: {
      fullName: requester?.full_name ?? null,
      phone: requester?.phone ?? null,
      email: requester?.email ?? null,
      avatarUrl: requester?.avatar_url ?? null,
      accountType: requester?.account_type ?? null,
    },
  };
}

export type OwnerRespondJoinResult =
  | { ok: true; status: 'approved' | 'rejected' }
  | { ok: false; error: string };

export async function ownerRespondJoinRequest(
  requestId: string,
  decision: 'approve' | 'reject',
): Promise<OwnerRespondJoinResult> {
  const { data, error } = await supabase.rpc('owner_respond_join_request', {
    p_request_id: requestId,
    p_decision: decision,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = data as Record<string, unknown>;
  if (row.ok === false) {
    return { ok: false, error: String(row.error ?? 'UNKNOWN') };
  }

  return { ok: true, status: row.status === 'rejected' ? 'rejected' : 'approved' };
}
