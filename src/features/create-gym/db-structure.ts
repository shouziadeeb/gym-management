/**
 * Suggested database structure for production Gym onboarding.
 * Keep this close to feature code as living documentation.
 */
export const suggestedGymDbStructure = {
  gyms: {
    id: 'uuid primary key',
    owner_id: 'uuid references profiles.id',
    name: 'text not null',
    slug: 'text unique not null',
    description: 'text',
    logo_url: 'text',
    address: 'jsonb',
    timezone: 'text',
    settings: 'jsonb',
    created_at: 'timestamptz',
    updated_at: 'timestamptz',
  },
  gym_membership_plans: {
    id: 'uuid primary key',
    gym_id: 'uuid references gyms.id',
    billing_cycle: "text check (billing_cycle in ('monthly','quarterly','yearly'))",
    amount_cents: 'int not null',
    currency: "text default 'USD'",
    is_active: 'boolean',
    created_at: 'timestamptz',
    updated_at: 'timestamptz',
  },
  gym_facilities: {
    id: 'uuid primary key',
    gym_id: 'uuid references gyms.id',
    name: 'text not null',
    created_at: 'timestamptz',
  },
  gym_working_hours: {
    id: 'uuid primary key',
    gym_id: 'uuid references gyms.id',
    day_of_week: 'int (0-6)',
    opens_at: 'time',
    closes_at: 'time',
    is_open: 'boolean',
    created_at: 'timestamptz',
    updated_at: 'timestamptz',
  },
} as const;

