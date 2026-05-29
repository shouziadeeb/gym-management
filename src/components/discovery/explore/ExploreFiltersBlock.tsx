import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryFilterRow } from '@/components/discovery/CategoryFilterRow';
import { ChipToggleRow } from '@/components/discovery/ChipToggleRow';
import { ExploreSearchBar } from '@/components/discovery/explore/ExploreSearchBar';
import { SelectField } from '@/components/ui/SelectField';
import {
  EXPLORE_SORT_LABELS,
  EXPLORE_SORT_VALUES,
  PRICE_PRESETS_INR_MONTHLY_MIN,
  RATING_FILTERS,
  type ExploreSortMode,
} from '@/constants/gym-discovery';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: ExploreSortMode;
  onSortChange: (value: ExploreSortMode) => void;
  categoryOptions: string[];
  categories: string[];
  onToggleCategory: (slug: string) => void;
  ratingPresetId: string;
  onRatingSelect: (id: string) => void;
  pricePresetId: string;
  onPriceSelect: (id: string) => void;
  onReset: () => void;
};

export function ExploreFiltersBlock({
  search,
  onSearchChange,
  sort,
  onSortChange,
  categoryOptions,
  categories,
  onToggleCategory,
  ratingPresetId,
  onRatingSelect,
  pricePresetId,
  onPriceSelect,
  onReset,
}: Props) {
  const { colors } = useTheme();

  const sortOptions = EXPLORE_SORT_VALUES.map((value) => ({
    value,
    label: EXPLORE_SORT_LABELS[value],
  }));

  return (
    <View style={styles.block}>
      <ExploreSearchBar value={search} onChangeText={onSearchChange} />

      <SelectField label="Sort gyms" options={sortOptions} value={sort} onChange={onSortChange} />

      <Text style={[styles.label, { color: colors.muted }]}>Categories</Text>
      <CategoryFilterRow options={categoryOptions} selected={categories} onToggle={onToggleCategory} />

      <Text style={[styles.label, { color: colors.muted }]}>Minimum rating</Text>
      <ChipToggleRow
        options={RATING_FILTERS}
        selectedId={ratingPresetId}
        onSelect={(next) => onRatingSelect(next === ratingPresetId ? 'any' : next)}
      />

      <Text style={[styles.label, { color: colors.muted }]}>Monthly budget</Text>
      <ChipToggleRow
        options={PRICE_PRESETS_INR_MONTHLY_MIN}
        selectedId={pricePresetId}
        onSelect={(next) => onPriceSelect(next === pricePresetId ? 'any' : next)}
      />

      <Pressable onPress={onReset} accessibilityRole="button" style={styles.resetWrap}>
        <Text style={[styles.reset, { color: colors.primary }]}>Reset filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: spacing[2],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  resetWrap: {
    alignSelf: 'flex-start',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  reset: {
    fontSize: 14,
    fontWeight: '600',
  },
});
