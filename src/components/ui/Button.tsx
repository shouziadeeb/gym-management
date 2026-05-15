import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const base = 'rounded-xl px-4 py-3.5 items-center justify-center';
  const styles =
    variant === 'primary'
      ? 'bg-emerald-600 active:bg-emerald-700'
      : variant === 'danger'
        ? 'bg-red-600 active:bg-red-700'
        : 'bg-transparent border border-slate-300 dark:border-slate-600';

  return (
    <Pressable
      className={`${base} ${styles} ${disabled || loading ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#64748b' : '#fff'} />
      ) : (
        <Text
          className={
            variant === 'ghost'
              ? 'font-semibold text-slate-800 dark:text-slate-100'
              : 'font-semibold text-white'
          }
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
