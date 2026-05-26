import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { CategoryFilterRow } from '@/components/discovery/CategoryFilterRow';
import { ChipToggleRow } from '@/components/discovery/ChipToggleRow';
import { DiscoveryEmptyState } from '@/components/discovery/DiscoveryEmptyState';
import { GymDiscoverCard } from '@/components/discovery/GymDiscoverCard';
import { GymDiscoverCardSkeleton } from '@/components/discovery/GymDiscoverCardSkeleton';
import { SelectField } from '@/components/ui/SelectField';
import { Card } from '@/components/ui/Card';
import { Screen, useScreenScrollBottomPadding } from '@/components/ui/Screen';
import { webScrollContainerStyle } from '@/lib/web-layout';
import {
  DEFAULT_EXPLORE_SORT,
  EXPLORE_SEARCH_DEBOUNCE_MS,
  EXPLORE_SORT_LABELS,
  EXPLORE_SORT_VALUES,
  PRICE_PRESETS_INR_MONTHLY_MIN,
  RATING_FILTERS,
  parseExploreSortMode,
  type ExploreSortMode,
} from '@/constants/gym-discovery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useExploreMarketplace } from '@/hooks/useExploreMarketplace';
import { appendSearchHistoryTerm } from '@/services/discovery/preferences.storage';
import { layout, surfaces, text } from '@/theme/classes';
import { inputSurface } from '@/theme/styles';
import { useTheme } from '@/hooks/useTheme';
import type { GymCardPresentation } from '@/domain/discovery/types';

function firstParam(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === 'string') return raw.trim() || undefined;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0].trim() || undefined;
  return undefined;
}

type RouteParams = {
  q?: string | string[];
  sort?: string | string[];
  category?: string | string[];
  price?: string | string[];
};

export function ExploreScreen() {
  const { colors } = useTheme();
  const scrollBottomPadding = useScreenScrollBottomPadding();
  const params = useLocalSearchParams<RouteParams>();

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [ratingPresetId, setRatingPresetId] = useState('any');
  const [pricePresetId, setPricePresetId] = useState('any');
  const [sort, setSort] = useState<ExploreSortMode>(DEFAULT_EXPLORE_SORT);

  useEffect(() => {
    const nextQuery = firstParam(params.q);
    if (nextQuery) setSearch(nextQuery);

    setSort(parseExploreSortMode(firstParam(params.sort)));

    const incomingCategory = firstParam(params.category);
    setCategories(incomingCategory ? [incomingCategory] : []);

    const priceTag = firstParam(params.price);
    if (priceTag && PRICE_PRESETS_INR_MONTHLY_MIN.some((tier) => tier.id === priceTag)) {
      setPricePresetId(priceTag);
    } else if (!priceTag) {
      setPricePresetId('any');
    }
  }, [params.q, params.sort, params.category, params.price]);

  const debouncedSearch = useDebouncedValue(search, EXPLORE_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term.length < 3) return;
    void appendSearchHistoryTerm(term);
  }, [debouncedSearch]);

  const ratingMin = useMemo(() => RATING_FILTERS.find((tier) => tier.id === ratingPresetId)?.min ?? 0, [ratingPresetId]);

  const monthlyFeeMax = useMemo(() => {
    return PRICE_PRESETS_INR_MONTHLY_MIN.find((tier) => tier.id === pricePresetId)?.maxCents ?? null;
  }, [pricePresetId]);

  const explore = useExploreMarketplace({
    search,
    debouncedSearch,
    categories,
    ratingMin,
    monthlyFeeMaxCents: monthlyFeeMax,
    sort,
  });

  const sortOptions = useMemo(
    () => EXPLORE_SORT_VALUES.map((value) => ({ value, label: EXPLORE_SORT_LABELS[value] })),
    [],
  );

  const toggleCategory = useCallback((slug: string) => {
    setCategories((existing) =>
      existing.includes(slug) ? existing.filter((entry) => entry !== slug) : [...existing, slug],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategories([]);
    setRatingPresetId('any');
    setPricePresetId('any');
    setSort(DEFAULT_EXPLORE_SORT);
    router.replace('/(tabs)/explore');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GymCardPresentation }) => (
      <GymDiscoverCard gym={item} onPress={() => router.push(`/gym/${item.id}`)} />
    ),
    [],
  );

  const header = (
    <View className={layout.screenTop}>
      <Text className={text.screenTitle}>Explore gyms</Text>
      <Text className={`${layout.stack} ${text.screenSubtitle}`}>
        Deep marketplace search with layered filters, deterministic sorts, and scalable Supabase queries.
      </Text>
      <Text className={`${layout.stackMd} ${text.caption}`}>{`${explore.totalMatched} gyms after local filters`}</Text>

      {explore.distanceFallbackActive ? (
        <View className={layout.stackMd}>
          <Card>
            <Text className={text.bodySm}>
              Enable device location to unlock true nearest sorting. Right now we approximate with popularity.
            </Text>
          </Card>
        </View>
      ) : null}

      <Text className={`${layout.stack} ${text.label}`}>Search</Text>
      <TextInput
        placeholder="Search name, category, or keyword"
        placeholderTextColor={colors.placeholder}
        className={surfaces.input}
        style={inputSurface(colors)}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <View className={layout.stackMd}>
        <SelectField label="Sort gyms" options={sortOptions} value={sort} onChange={setSort} />
      </View>

      <Text className={`${layout.stackMd} ${text.label}`}>Categories</Text>
      <CategoryFilterRow options={explore.categoryOptions} selected={categories} onToggle={toggleCategory} />

      <Text className={`${layout.stackMd} ${text.label}`}>Minimum rating</Text>
      <ChipToggleRow
        options={RATING_FILTERS}
        selectedId={ratingPresetId}
        onSelect={(next) => setRatingPresetId(next === ratingPresetId ? 'any' : next)}
      />

      <Text className={`${layout.stackMd} ${text.label}`}>Monthly budget</Text>
      <ChipToggleRow
        options={PRICE_PRESETS_INR_MONTHLY_MIN}
        selectedId={pricePresetId}
        onSelect={(next) => setPricePresetId(next === pricePresetId ? 'any' : next)}
      />

      <Pressable onPress={clearFilters} accessibilityRole="button">
        <Text className={`${layout.stackLg} ${text.link}`}>Reset filters</Text>
      </Pressable>
    </View>
  );

  if (explore.isInitialLoading && !explore.cards.length) {
    return (
      <Screen scroll>
        {header}
        <View>
          <GymDiscoverCardSkeleton />
          <GymDiscoverCardSkeleton />
        </View>
      </Screen>
    );
  }

  if (explore.error && !explore.cards.length) {
    return (
      <Screen scroll>
        {header}
        <DiscoveryEmptyState
          title="We could not load gyms"
          subtitle="Validate Supabase migrations, RLS policies, and network connectivity."
          actionLabel="Try again"
          onActionPress={() => explore.refetch()}
        />
      </Screen>
    );
  }

  const listScrollStyle = Platform.OS === 'web' ? ({ flex: 1, ...webScrollContainerStyle } as const) : { flex: 1 };

  return (
    <Screen>
      <FlatList<GymCardPresentation>
        data={explore.cards}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        nativeID={Platform.OS === 'web' ? 'exploreMarketplaceFlatListScroll' : undefined}
        style={listScrollStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        ItemSeparatorComponent={() => <View className={layout.section} />}
        refreshControl={<RefreshControl refreshing={explore.isRefetching} onRefresh={explore.refetch} />}
        onEndReachedThreshold={0.45}
        onEndReached={() => explore.fetchNext()}
        ListEmptyComponent={
          explore.isInitialLoading ? null : (
            <DiscoveryEmptyState
              title="No gyms match"
              subtitle="Adjust filters — especially categories or budget — then try again."
              actionLabel="Clear filters"
              onActionPress={clearFilters}
            />
          )
        }
        ListFooterComponent={
          explore.fetchNextBusy ? (
            <View className="py-10">
              <ActivityIndicator accessibilityLabel="Loading more gyms" />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

