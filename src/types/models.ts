export type UserRole = 'owner' | 'member' | 'trainer' | 'staff' | 'admin';
export type AccountType = 'normal_user' | 'gym_owner';
export type AuthMethod = 'phone' | 'email' | 'oauth';
export type AuthProvider =
  | 'phone'
  | 'phone_email_bridge'
  | 'email'
  | 'google'
  | 'apple'
  | 'whatsapp';

export type MembershipStatus = 'active' | 'expiring_soon' | 'expired' | 'cancelled';
export type MembershipPlanType = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
export type MembershipPaymentStatus = 'paid' | 'pending' | 'failed' | 'waived';

export type Profile = {
  id: string;
  phone: string | null;
  email: string | null;
  auth_provider: AuthProvider;
  auth_type: AuthMethod;
  email_verified: boolean;
  phone_verified: boolean;
  provider_metadata: Record<string, unknown>;
  full_name: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  age: number | null;
  date_of_birth: string | null;
  fitness_goal: string | null;
  city: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  home_location_label?: string | null;
  onboarding_completed: boolean;
  role: UserRole;
  account_type: AccountType;
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
  latitude?: number | null;
  longitude?: number | null;
  rating_avg?: number | null;
  review_count?: number | null;
  active_member_count?: number | null;
  popularity_score?: number | null;
  trending_score?: number | null;
  categories?: string[] | null;
  is_active?: boolean | null;
  attendance_token?: string | null;
  attendance_enabled?: boolean | null;
  qr_generated_at?: string | null;
};

export type Attendance = {
  id: string;
  gym_id: string;
  user_id: string;
  member_id: string;
  scanned_token: string | null;
  attendance_date: string;
  attendance_time: string;
  checked_in_at: string;
  checked_out_at: string | null;
  source: string | null;
  created_at: string;
};

export type GymSettings = {
  gymType?: string | null;
  timings?: {
    openingTime?: string | null;
    closingTime?: string | null;
    workingDays?: string[] | null;
  } | null;
  facilities?: string[] | null;
  ownerProfile?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  membershipPlans?: {
    monthlyFeeCents?: number | null;
    quarterlyFeeCents?: number | null;
    yearlyFeeCents?: number | null;
  } | null;
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
  member_id: string;
  plan_id: string | null;
  plan_type: MembershipPlanType;
  status: MembershipStatus;
  payment_status: MembershipPaymentStatus;
  start_date: string;
  expiry_date: string;
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