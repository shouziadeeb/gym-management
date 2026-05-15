import { Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string | undefined;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry,
  autoCapitalize = 'none',
}: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</Text>
      <TextInput
        className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value ?? ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}
