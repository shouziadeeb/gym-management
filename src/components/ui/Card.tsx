import { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, children, className }: Props) {
  return (
    <View
      className={`mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className ?? ''}`}
    >
      {title ? <Text className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</Text> : null}
      {children}
    </View>
  );
}
