import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import {
  Bell,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  Mail,
  Moon,
  Phone,
  Receipt,
  Shield,
  Trash2,
  User,
  Users,
  Wallet,
} from 'lucide-react-native';

import { SettingGroup, SettingItem, SettingSection } from '@/components/settings';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ModalCard } from '@/components/ui/ModalCard';
import { Screen } from '@/components/ui/Screen';
import {
  CANCELLATION_POLICY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  SLOT_DURATION_OPTIONS,
  TIME_FORMAT_OPTIONS,
  type DateFormatPreference,
  type LanguageCode,
  type TimeFormatPreference,
} from '@/features/settings/settings-preferences';
import { LANGUAGE_OPTIONS } from '@/i18n/config';
import { changeAppLanguage, reloadAppForLayoutChange } from '@/i18n/language';
import { useSettingsPreferences } from '@/features/settings/useSettingsPreferences';
import {
  isEmailAuthUser,
  resolveDisplayName,
  resolveProfileEmail,
} from '@/domain/profiles';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useTheme } from '@/hooks/useTheme';
import { useUserGyms } from '@/hooks/useUserGyms';
import { routes } from '@/routing/constants';
import { signOut } from '@/services/auth/auth.service';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import type { ThemePreference } from '@/store/theme.store';
import { layout, text } from '@/theme/classes';

type PickerKind = 'theme' | 'language' | 'dateFormat' | 'timeFormat' | 'slotDuration' | 'cancellation' | null;

export function SettingsScreen() {
  const { t } = useTranslation();
  const session = useAuthStore((state) => state.session);
  const { preference, setPreference } = useTheme();
  const resetGymContext = useAppStore((state) => state.resetGymContext);
  const appMode = useAppStore((state) => state.appMode);

  const profileQuery = useMyProfile();
  const { ownedGyms } = useUserGyms();
  const {
    preferences,
    loading: prefsLoading,
    error: prefsError,
    reload: reloadPrefs,
    updatePreferences,
    updateNotifications,
    updateBookings,
  } = useSettingsPreferences();

  const [picker, setPicker] = useState<PickerKind>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAuthenticated = Boolean(session);
  const isOwner = ownedGyms.length > 0 || appMode === 'owner';
  const profile = profileQuery.data;
  const isEmailUser = isEmailAuthUser(profile, session?.user ?? null);
  const contactValue = isEmailUser
    ? (resolveProfileEmail(profile, session?.user ?? null) ?? t('common.notSet'))
    : (profile?.phone ?? session?.user?.phone ?? t('common.notSet'));

  const displayName = resolveDisplayName(
    profile?.full_name,
    contactValue,
    session?.user?.id ?? null,
  );

  const activeGymName = useMemo(() => {
    const gym = ownedGyms[0];
    return gym?.name ?? t('common.noGymYet');
  }, [ownedGyms, t]);

  const languageLabel =
    LANGUAGE_OPTIONS.find((o) => o.value === preferences.language)?.label ?? LANGUAGE_OPTIONS[0].label;
  const dateFormatLabel = t(`settings.dateFormats.${preferences.dateFormat}`);
  const timeFormatLabel = t(`settings.timeFormats.${preferences.timeFormat === '12h' ? 'h12' : 'h24'}`);
  const themeLabel = t(`settings.themes.${preference}`);

  const isLoading = prefsLoading || (isAuthenticated && profileQuery.isLoading);
  const loadError = prefsError ?? (profileQuery.isError ? t('settings.loadProfileError') : null);

  async function handleLanguageChange(language: LanguageCode) {
    await updatePreferences({ language });
    const { needsReload } = await changeAppLanguage(language);
    if (needsReload) {
      Alert.alert(t('settings.reloadRequiredTitle'), t('settings.reloadRequiredMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reload'),
          onPress: () => {
            void reloadAppForLayoutChange();
          },
        },
      ]);
    }
  }

  async function handleSignOut() {
    await signOut();
    resetGymContext();
    setShowLogoutConfirm(false);
    router.replace(routes.profileHub as never);
  }

  function handleDeleteAccount() {
    setShowDeleteConfirm(false);
    Alert.alert(t('settings.modals.deleteContactTitle'), t('settings.modals.deleteContactMessage'));
  }

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/settings' as never);
      return;
    }
    action();
  }

  if (isLoading) {
    return <LoadingScreen label={t('settings.loading')} />;
  }

  if (loadError) {
    return (
      <Screen>
        <EmptyState
          title={t('settings.loadErrorTitle')}
          description={loadError}
          actionLabel={t('common.tryAgain')}
          onAction={() => {
            void reloadPrefs();
            void profileQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className={layout.screenTop}>
        <Text className={text.screenTitle}>{t('settings.title')}</Text>
        <Text className={`${layout.stack} ${text.screenSubtitle}`}>{t('settings.subtitle')}</Text>
      </View>

      {!isAuthenticated ? (
        <SettingSection
          title={t('settings.getStarted.title')}
          description={t('settings.getStarted.description')}
        >
          <SettingGroup>
            <SettingItem
              label={t('settings.getStarted.login')}
              subtitle={t('settings.getStarted.loginSubtitle')}
              icon={User}
              onPress={() => router.push('/auth/login?redirect=/settings' as never)}
              isLast
            />
          </SettingGroup>
        </SettingSection>
      ) : null}

      {isAuthenticated ? (
        <SettingSection
          title={t('settings.account.title')}
          description={t('settings.account.description')}
        >
          <SettingGroup>
            <SettingItem
              label={t('settings.account.profile')}
              subtitle={displayName}
              icon={User}
              onPress={() => router.push(routes.profile as never)}
            />
            <SettingItem
              label={t('settings.account.contact')}
              subtitle={contactValue}
              icon={isEmailUser ? Mail : Phone}
              onPress={() => router.push(routes.profile as never)}
            />
            <SettingItem
              label={t('settings.account.logout')}
              icon={LogOut}
              destructive
              onPress={() => setShowLogoutConfirm(true)}
              isLast
            />
          </SettingGroup>
        </SettingSection>
      ) : null}

      {isAuthenticated && isOwner ? (
        <SettingSection
          title={t('settings.gym.title')}
          description={t('settings.gym.description', { gymName: activeGymName })}
        >
          <SettingGroup>
            <SettingItem
              label={t('settings.gym.details')}
              subtitle={t('settings.gym.detailsSubtitle')}
              icon={Building2}
              onPress={() => router.push(routes.profileHub as never)}
            />
            <SettingItem
              label={t('settings.gym.timings')}
              subtitle={t('settings.gym.timingsSubtitle')}
              icon={Clock}
              onPress={() => router.push(routes.profileHub as never)}
            />
            <SettingItem
              label={t('settings.gym.plans')}
              subtitle={t('settings.gym.plansSubtitle')}
              icon={Wallet}
              onPress={() => router.push(routes.membershipLifecycle as never)}
            />
            <SettingItem
              label={t('settings.gym.trainers')}
              subtitle={t('settings.gym.trainersSubtitle')}
              icon={Users}
              onPress={() => router.push('/trainers' as never)}
              isLast
            />
          </SettingGroup>
        </SettingSection>
      ) : null}

      {isAuthenticated ? (
        <SettingSection
          title={t('settings.notifications.title')}
          description={t('settings.notifications.description')}
        >
          <SettingGroup>
            <SettingItem
              label={t('settings.notifications.push')}
              subtitle={t('settings.notifications.pushSubtitle')}
              icon={Bell}
              toggle={{
                value: preferences.notifications.pushEnabled,
                onValueChange: (pushEnabled) => updateNotifications({ pushEnabled }),
              }}
            />
            <SettingItem
              label={t('settings.notifications.membershipExpiry')}
              icon={Bell}
              disabled={!preferences.notifications.pushEnabled}
              toggle={{
                value: preferences.notifications.membershipExpiry,
                onValueChange: (membershipExpiry) => updateNotifications({ membershipExpiry }),
              }}
            />
            <SettingItem
              label={t('settings.notifications.paymentAlerts')}
              icon={Receipt}
              disabled={!preferences.notifications.pushEnabled}
              toggle={{
                value: preferences.notifications.paymentAlerts,
                onValueChange: (paymentAlerts) => updateNotifications({ paymentAlerts }),
              }}
            />
            <SettingItem
              label={t('settings.notifications.newMemberAlerts')}
              icon={Users}
              disabled={!preferences.notifications.pushEnabled}
              toggle={{
                value: preferences.notifications.newMemberAlerts,
                onValueChange: (newMemberAlerts) => updateNotifications({ newMemberAlerts }),
              }}
              isLast
            />
          </SettingGroup>
        </SettingSection>
      ) : null}

      {isAuthenticated && isOwner ? (
        <SettingSection
          title={t('settings.bookings.title')}
          description={t('settings.bookings.description')}
        >
          <SettingGroup>
            <SettingItem
              label={t('settings.bookings.scheduling')}
              subtitle={t('settings.bookings.schedulingSubtitle')}
              icon={Calendar}
              onPress={() => router.push(routes.bookings as never)}
            />
            <SettingItem
              label={t('settings.bookings.slotDuration')}
              value={t('common.minShort', { count: preferences.bookings.slotDurationMinutes })}
              icon={Clock}
              onPress={() => setPicker('slotDuration')}
            />
            <SettingItem
              label={t('settings.bookings.cancellation')}
              value={t('common.hoursNotice', { count: preferences.bookings.cancellationHours })}
              icon={Shield}
              onPress={() => setPicker('cancellation')}
              isLast
            />
          </SettingGroup>
        </SettingSection>
      ) : null}

      <SettingSection
        title={t('settings.appPreferences.title')}
        description={t('settings.appPreferences.description')}
      >
        <SettingGroup>
          <SettingItem
            label={t('settings.appPreferences.theme')}
            subtitle={t('settings.appPreferences.themeSubtitle')}
            icon={Moon}
            value={themeLabel}
            onPress={() => setPicker('theme')}
          />
          <SettingItem
            label={t('settings.appPreferences.language')}
            icon={Globe}
            value={languageLabel}
            onPress={() => setPicker('language')}
          />
          <SettingItem
            label={t('settings.appPreferences.dateFormat')}
            icon={Calendar}
            value={dateFormatLabel}
            onPress={() => setPicker('dateFormat')}
          />
          <SettingItem
            label={t('settings.appPreferences.timeFormat')}
            icon={Clock}
            value={timeFormatLabel}
            onPress={() => setPicker('timeFormat')}
            isLast
          />
        </SettingGroup>
      </SettingSection>

      {isAuthenticated && isOwner ? (
        <SettingSection
          title={t('settings.billing.title')}
          description={t('settings.billing.description')}
        >
          <SettingGroup>
            <SettingItem
              label={t('settings.billing.currentPlan')}
              subtitle={t('settings.billing.currentPlanSubtitle')}
              icon={CreditCard}
              onPress={() => router.push('/pricing' as never)}
            />
            <SettingItem
              label={t('settings.billing.history')}
              icon={Receipt}
              onPress={() => router.push('/pricing' as never)}
            />
            <SettingItem
              label={t('settings.billing.paymentMethods')}
              icon={Wallet}
              onPress={() => router.push('/pricing' as never)}
              isLast
            />
          </SettingGroup>
        </SettingSection>
      ) : null}

      <SettingSection
        title={t('settings.support.title')}
        description={t('settings.support.description')}
      >
        <SettingGroup>
          <SettingItem
            label={t('settings.support.privacy')}
            icon={Shield}
            onPress={() => router.push('/about' as never)}
          />
          <SettingItem
            label={t('settings.support.help')}
            icon={HelpCircle}
            onPress={() => router.push('/about' as never)}
          />
          <SettingItem
            label={t('settings.support.faqs')}
            icon={HelpCircle}
            onPress={() => router.push('/about' as never)}
          />
          {isAuthenticated ? (
            <SettingItem
              label={t('settings.support.deleteAccount')}
              subtitle={t('settings.support.deleteAccountSubtitle')}
              icon={Trash2}
              destructive
              onPress={() => requireAuth(() => setShowDeleteConfirm(true))}
              isLast
            />
          ) : (
            <SettingItem
              label={t('settings.support.about')}
              icon={HelpCircle}
              onPress={() => router.push('/about' as never)}
              isLast
            />
          )}
        </SettingGroup>
      </SettingSection>

      <PickerModal
        kind={picker}
        onClose={() => setPicker(null)}
        preference={preference}
        onThemeChange={setPreference}
        language={preferences.language}
        dateFormat={preferences.dateFormat}
        timeFormat={preferences.timeFormat}
        slotDuration={preferences.bookings.slotDurationMinutes}
        cancellationHours={preferences.bookings.cancellationHours}
        onLanguageChange={(language) => void handleLanguageChange(language)}
        onDateFormatChange={(dateFormat) => void updatePreferences({ dateFormat })}
        onTimeFormatChange={(timeFormat) => void updatePreferences({ timeFormat })}
        onSlotDurationChange={(slotDurationMinutes) => void updateBookings({ slotDurationMinutes })}
        onCancellationChange={(cancellationHours) => void updateBookings({ cancellationHours })}
      />

      <ModalCard visible={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}>
        <Text className={`mb-2 ${text.cardTitle}`}>{t('settings.modals.logoutTitle')}</Text>
        <Text className={`mb-4 ${text.bodySm}`}>{t('settings.modals.logoutMessage')}</Text>
        <View className={layout.vstackSm}>
          <Button
            title={t('settings.modals.logoutConfirm')}
            variant="danger"
            onPress={() => void handleSignOut()}
          />
          <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowLogoutConfirm(false)} />
        </View>
      </ModalCard>

      <ModalCard visible={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <Text className={`mb-2 ${text.cardTitle}`}>{t('settings.modals.deleteTitle')}</Text>
        <Text className={`mb-4 ${text.bodySm}`}>{t('settings.modals.deleteMessage')}</Text>
        <View className={layout.vstackSm}>
          <Button title={t('common.continue')} variant="danger" onPress={handleDeleteAccount} />
          <Button title={t('common.cancel')} variant="ghost" onPress={() => setShowDeleteConfirm(false)} />
        </View>
      </ModalCard>
    </Screen>
  );
}

type PickerModalProps = {
  kind: PickerKind;
  onClose: () => void;
  preference: ThemePreference;
  onThemeChange: (value: ThemePreference) => void;
  language: LanguageCode;
  dateFormat: DateFormatPreference;
  timeFormat: TimeFormatPreference;
  slotDuration: number;
  cancellationHours: number;
  onLanguageChange: (value: LanguageCode) => void;
  onDateFormatChange: (value: DateFormatPreference) => void;
  onTimeFormatChange: (value: TimeFormatPreference) => void;
  onSlotDurationChange: (value: number) => void;
  onCancellationChange: (value: number) => void;
};

function PickerModal({
  kind,
  onClose,
  preference,
  onThemeChange,
  language,
  dateFormat,
  timeFormat,
  slotDuration,
  cancellationHours,
  onLanguageChange,
  onDateFormatChange,
  onTimeFormatChange,
  onSlotDurationChange,
  onCancellationChange,
}: PickerModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!kind) return null;

  const themeOptions: { value: ThemePreference; labelKey: `settings.themes.${ThemePreference}` }[] = [
    { value: 'light', labelKey: 'settings.themes.light' },
    { value: 'dark', labelKey: 'settings.themes.dark' },
    { value: 'system', labelKey: 'settings.themes.system' },
  ];

  type Option = { value: string; label: string; selected: boolean; onSelect: () => void };

  let options: Option[] = [];

  switch (kind) {
    case 'theme':
      options = themeOptions.map((o) => ({
        value: o.value,
        label: t(o.labelKey),
        selected: preference === o.value,
        onSelect: () => {
          onThemeChange(o.value);
          onClose();
        },
      }));
      break;
    case 'language':
      options = LANGUAGE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
        selected: language === o.value,
        onSelect: () => {
          onLanguageChange(o.value);
          onClose();
        },
      }));
      break;
    case 'dateFormat':
      options = DATE_FORMAT_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`settings.dateFormats.${o.value}`),
        selected: dateFormat === o.value,
        onSelect: () => {
          onDateFormatChange(o.value);
          onClose();
        },
      }));
      break;
    case 'timeFormat':
      options = TIME_FORMAT_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`settings.timeFormats.${o.value === '12h' ? 'h12' : 'h24'}`),
        selected: timeFormat === o.value,
        onSelect: () => {
          onTimeFormatChange(o.value);
          onClose();
        },
      }));
      break;
    case 'slotDuration':
      options = SLOT_DURATION_OPTIONS.map((minutes) => ({
        value: String(minutes),
        label: t('common.minutes', { count: minutes }),
        selected: slotDuration === minutes,
        onSelect: () => {
          onSlotDurationChange(minutes);
          onClose();
        },
      }));
      break;
    case 'cancellation':
      options = CANCELLATION_POLICY_OPTIONS.map((o) => ({
        value: String(o.hours),
        label: t(`settings.cancellation.h${o.hours}` as 'settings.cancellation.h12'),
        selected: cancellationHours === o.hours,
        onSelect: () => {
          onCancellationChange(o.hours);
          onClose();
        },
      }));
      break;
  }

  return (
    <ModalCard visible onClose={onClose}>
      <Text className={`mb-3 ${text.cardTitle}`}>{t(`settings.pickers.${kind}`)}</Text>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={option.onSelect}
          className="mb-2 rounded-xl px-3 py-3"
          style={{
            backgroundColor: option.selected ? colors.primary : colors.chipInactive,
          }}
        >
          <Text
            style={{
              color: option.selected ? colors.primaryForeground : colors.foreground,
              fontWeight: option.selected ? '600' : '500',
            }}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </ModalCard>
  );
}
