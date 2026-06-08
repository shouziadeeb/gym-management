export const en = {
  common: {
    cancel: 'Cancel',
    continue: 'Continue',
    tryAgain: 'Try again',
    notSet: 'Not set',
    noGymYet: 'No gym yet',
    minutes: '{{count}} minutes',
    minShort: '{{count}} min',
    hoursNotice: '{{count}}h notice',
    loading: 'Loading…',
  },
  tabs: {
    home: 'Home',
    explore: 'Explore',
    scan: 'Scan',
    gymQr: 'Gym QR',
    memberships: 'Memberships',
    profile: 'Profile',
  },
  menu: {
    settings: 'Settings',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    login: 'Login',
    logout: 'Logout',
    confirmLogout: 'Confirm logout',
    confirmLogoutMessage: 'Are you sure you want to logout?',
    yesLogout: 'Yes, Logout',
  },
  auth: {
    chooseHow: 'CHOOSE HOW YOU WANT TO CONTINUE',
    continuePhone: 'Continue with Phone',
    continueEmail: 'Continue with Email',
    continueGoogle: 'Continue with Google',
    or: 'or',
    disclaimer:
      'Phone accounts receive an SMS code. Email accounts receive a one-time code in their inbox. Google uses your Google account securely via Supabase.',
    useOtherInstead: 'Use {{method}} instead',
    phone: 'phone',
    email: 'email',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account, gym, and app preferences.',
    loading: 'Loading settings…',
    loadErrorTitle: 'Could not load settings',
    loadProfileError: 'Could not load your profile.',
    reloadRequiredTitle: 'Restart required',
    reloadRequiredMessage:
      'Please restart the app to apply the new text direction for this language.',
    reload: 'Restart app',
    getStarted: {
      title: 'Get started',
      description: 'Sign in to manage your gym and account.',
      login: 'Login or create account',
      loginSubtitle: 'Access profile, gym tools, and billing',
    },
    account: {
      title: 'Account',
      description: 'Your personal profile and sign-in.',
      profile: 'Profile information',
      contact: 'Email & phone number',
      logout: 'Logout',
    },
    gym: {
      title: 'Gym',
      description: 'Settings for {{gymName}}. Most-used owner tools are listed first.',
      details: 'Gym details',
      detailsSubtitle: 'Name, address, contact info',
      timings: 'Gym timings',
      timingsSubtitle: 'Opening hours & working days',
      plans: 'Membership plans',
      plansSubtitle: 'Monthly, quarterly, yearly fees',
      trainers: 'Trainer management',
      trainersSubtitle: 'Assign and manage trainers',
    },
    notifications: {
      title: 'Notifications',
      description: 'Choose what you want to be notified about.',
      push: 'Push notifications',
      pushSubtitle: 'Alerts on this device',
      membershipExpiry: 'Membership expiry alerts',
      paymentAlerts: 'Payment alerts',
      newMemberAlerts: 'New member alerts',
    },
    bookings: {
      title: 'Bookings & classes',
      description: 'Scheduling defaults for your gym.',
      scheduling: 'Class scheduling',
      schedulingSubtitle: 'Manage sessions and bookings',
      slotDuration: 'Slot duration',
      cancellation: 'Cancellation policy',
    },
    appPreferences: {
      title: 'App preferences',
      description: 'Appearance and regional formats.',
      theme: 'Theme',
      themeSubtitle: 'Light, dark, or match system',
      language: 'Language',
      dateFormat: 'Date format',
      timeFormat: 'Time format',
    },
    billing: {
      title: 'Billing & subscription',
      description: 'Your GYM OS plan and payments.',
      currentPlan: 'Current plan',
      currentPlanSubtitle: 'Starter — free during beta',
      history: 'Billing history',
      paymentMethods: 'Payment methods',
    },
    support: {
      title: 'Support & security',
      description: 'Help, policies, and account safety.',
      privacy: 'Privacy policy',
      help: 'Help & support',
      faqs: 'FAQs',
      deleteAccount: 'Delete account',
      deleteAccountSubtitle: 'Permanently remove your data',
      about: 'About GYM OS',
    },
    pickers: {
      theme: 'Theme',
      language: 'Language',
      dateFormat: 'Date format',
      timeFormat: 'Time format',
      slotDuration: 'Slot duration',
      cancellation: 'Cancellation policy',
    },
    themes: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    dateFormats: {
      dmy: 'DD / MM / YYYY',
      mdy: 'MM / DD / YYYY',
    },
    timeFormats: {
      h12: '12-hour',
      h24: '24-hour',
    },
    cancellation: {
      h12: '12 hours before',
      h24: '24 hours before',
      h48: '48 hours before',
    },
    modals: {
      logoutTitle: 'Log out?',
      logoutMessage: 'You will need to sign in again to access your gym dashboard.',
      logoutConfirm: 'Log out',
      deleteTitle: 'Delete account?',
      deleteMessage:
        'This action cannot be undone. Your memberships, attendance, and gym data may be removed.',
      deleteContactTitle: 'Contact support',
      deleteContactMessage:
        'Account deletion is handled by our support team to protect your data. Email support@gym.local to continue.',
    },
  },
} as const;

type DeepStringify<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: DeepStringify<T[K]> }
    : string;

export type TranslationSchema = DeepStringify<typeof en>;
