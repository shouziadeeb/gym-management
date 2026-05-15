export type UserRole = 'owner' | 'member' | 'trainer' | 'staff' | 'admin';

export type MembershipStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled';

export type Profile = {
  id: string;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Gym = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GymMembership = {
  id: string;
  gym_id: string;
  user_id: string;
  role_in_gym: UserRole;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
};

export type Membership = {
  id: string;
  gym_id: string;
  user_id: string;
  plan_id: string | null;
  status: MembershipStatus;
  starts_at: string;
  ends_at: string;
  renewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  gym_id: string;
  membership_id: string | null;
  user_id: string | null;
  amount_cents: number;
  currency: string;
  provider: string | null;
  external_id: string | null;
  paid_at: string;
  metadata: Record<string, unknown>;
};