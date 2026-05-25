import type { CreateGymInput } from '@/api/gyms.api';

export const createGymApiPayloadExample: CreateGymInput = {
  name: 'Iron Temple Fitness',
  description: 'Premium strength and conditioning facility for beginners and athletes.',
  logoUrl: 'https://cdn.example.com/gym-logos/iron-temple.png',
  gymType: 'Strength Training',
  address: {
    country: 'India',
    state: 'Maharashtra',
    city: 'Pune',
    fullAddress: '12 MG Road, Camp Area',
    pincode: '411001',
  },
  timings: {
    openingTime: '06:00',
    closingTime: '22:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  membershipPlans: {
    monthlyFeeCents: 250000,
    quarterlyFeeCents: 650000,
    yearlyFeeCents: 2200000,
  },
  facilities: ['Cardio', 'Weight Training', 'AC', 'Parking', 'WiFi', 'Personal Trainer'],
  ownerProfile: {
    name: 'Shozab Khan',
    email: 'owner@irontemple.com',
    phone: '+919876543210',
  },
};

