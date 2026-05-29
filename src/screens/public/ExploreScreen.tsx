import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { ExploreFeaturedGymCard } from "@/components/discovery/explore/ExploreFeaturedGymCard";
import { ExploreFiltersBlock } from "@/components/discovery/explore/ExploreFiltersBlock";
import { ExploreGymListRow } from "@/components/discovery/explore/ExploreGymListRow";
import { GymDiscoverCardSkeleton } from "@/components/discovery/GymDiscoverCardSkeleton";
import { Screen, useScreenScrollBottomPadding } from "@/components/ui/Screen";
import {
  DEFAULT_EXPLORE_SORT,
  EXPLORE_SEARCH_DEBOUNCE_MS,
  PRICE_PRESETS_INR_MONTHLY_MIN,
  RATING_FILTERS,
  parseExploreSortMode,
  type ExploreSortMode,
} from "@/constants/gym-discovery";
import type { GymCardPresentation } from "@/domain/discovery/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useExploreMarketplace } from "@/hooks/useExploreMarketplace";
import { useTheme } from "@/hooks/useTheme";
import { webScrollContainerStyle } from "@/lib/web-layout";
import { appendSearchHistoryTerm } from "@/services/discovery/preferences.storage";
import { spacing } from "@/theme/spacing";

function firstParam(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === "string") return raw.trim() || undefined;
  if (Array.isArray(raw) && typeof raw[0] === "string")
    return raw[0].trim() || undefined;
  return undefined;
}

type RouteParams = {
  q?: string | string[];
  sort?: string | string[];
  category?: string | string[];
  price?: string | string[];
};

function pickFeaturedGym(
  cards: GymCardPresentation[],
): GymCardPresentation | null {
  if (!cards.length) return null;
  const withImage = cards.find(
    (gym) => (gym.imageUrls[0] ?? gym.imageUrl) != null,
  );
  return withImage ?? cards[0];
}

export function ExploreScreen() {
  const { colors } = useTheme();
  const scrollBottomPadding = useScreenScrollBottomPadding();
  const params = useLocalSearchParams<RouteParams>();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [ratingPresetId, setRatingPresetId] = useState("any");
  const [pricePresetId, setPricePresetId] = useState("any");
  const [sort, setSort] = useState<ExploreSortMode>(DEFAULT_EXPLORE_SORT);

  useEffect(() => {
    const nextQuery = firstParam(params.q);
    if (nextQuery) setSearch(nextQuery);

    setSort(parseExploreSortMode(firstParam(params.sort)));

    const incomingCategory = firstParam(params.category);
    setCategories(incomingCategory ? [incomingCategory] : []);

    const priceTag = firstParam(params.price);
    if (
      priceTag &&
      PRICE_PRESETS_INR_MONTHLY_MIN.some((tier) => tier.id === priceTag)
    ) {
      setPricePresetId(priceTag);
    } else if (!priceTag) {
      setPricePresetId("any");
    }
  }, [params.q, params.sort, params.category, params.price]);

  const debouncedSearch = useDebouncedValue(search, EXPLORE_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const term = debouncedSearch.trim();
    if (term.length < 3) return;
    void appendSearchHistoryTerm(term);
  }, [debouncedSearch]);

  const ratingMin = useMemo(
    () => RATING_FILTERS.find((tier) => tier.id === ratingPresetId)?.min ?? 0,
    [ratingPresetId],
  );

  const monthlyFeeMax = useMemo(() => {
    return (
      PRICE_PRESETS_INR_MONTHLY_MIN.find((tier) => tier.id === pricePresetId)
        ?.maxCents ?? null
    );
  }, [pricePresetId]);

  const explore = useExploreMarketplace({
    search,
    debouncedSearch,
    categories,
    ratingMin,
    monthlyFeeMaxCents: monthlyFeeMax,
    sort,
  });

  const priceHintLabel = useMemo(
    () =>
      PRICE_PRESETS_INR_MONTHLY_MIN.find((tier) => tier.id === pricePresetId)
        ?.label ?? null,
    [pricePresetId],
  );

  const featuredGym = useMemo(
    () => pickFeaturedGym(explore.cards),
    [explore.cards],
  );

  const listGyms = useMemo(() => {
    if (!featuredGym) return explore.cards;
    return explore.cards.filter((gym) => gym.id !== featuredGym.id);
  }, [explore.cards, featuredGym]);

  const toggleCategory = useCallback((slug: string) => {
    setCategories((existing) =>
      existing.includes(slug)
        ? existing.filter((entry) => entry !== slug)
        : [...existing, slug],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategories([]);
    setRatingPresetId("any");
    setPricePresetId("any");
    setSort(DEFAULT_EXPLORE_SORT);
    router.replace("/(tabs)/explore");
  }, []);

  const openGym = useCallback((id: string) => {
    router.push(`/gym/${id}`);
  }, []);

  const renderListItem = useCallback(
    ({ item }: { item: GymCardPresentation }) => (
      <ExploreGymListRow
        gym={item}
        priceHint={pricePresetId !== "any" ? priceHintLabel : null}
        onPress={() => openGym(item.id)}
      />
    ),
    [openGym, priceHintLabel, pricePresetId],
  );

  const listHeader = (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Explore gyms
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Search with filters and performance metrics.
      </Text>
      <Text style={[styles.count, { color: colors.primary }]}>
        {explore.totalMatched} GYMS NEARBY
      </Text>

      {explore.distanceFallbackActive ? (
        <Text style={[styles.hint, { color: colors.muted }]}>
          Enable location for nearest sorting.
        </Text>
      ) : null}

      <ExploreFiltersBlock
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        categoryOptions={explore.categoryOptions}
        categories={categories}
        onToggleCategory={toggleCategory}
        ratingPresetId={ratingPresetId}
        onRatingSelect={setRatingPresetId}
        pricePresetId={pricePresetId}
        onPriceSelect={setPricePresetId}
        onReset={clearFilters}
      />

      {explore.isInitialLoading && !explore.cards.length ? (
        <View style={styles.loadingBlock}>
          <GymDiscoverCardSkeleton />
          <GymDiscoverCardSkeleton variant="rail" />
        </View>
      ) : null}

      {featuredGym && !explore.isInitialLoading ? (
        <ExploreFeaturedGymCard
          gym={featuredGym}
          onPress={() => openGym(featuredGym.id)}
        />
      ) : null}
    </View>
  );

  if (explore.error && !explore.cards.length) {
    return (
      <Screen scroll>
        {listHeader}
        <DiscoveryEmptyState
          title="We could not load gyms"
          subtitle="Check your connection and try again."
          actionLabel="Try again"
          onActionPress={() => explore.refetch()}
        />
      </Screen>
    );
  }

  const listScrollStyle =
    Platform.OS === "web"
      ? ({ flex: 1, ...webScrollContainerStyle } as const)
      : { flex: 1 };

  return (
    <Screen>
      <FlatList<GymCardPresentation>
        data={listGyms}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        nativeID={
          Platform.OS === "web" ? "exploreMarketplaceFlatListScroll" : undefined
        }
        style={listScrollStyle}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshControl={
          <RefreshControl
            refreshing={explore.isRefetching}
            onRefresh={explore.refetch}
          />
        }
        onEndReachedThreshold={0.45}
        onEndReached={() => explore.fetchNext()}
        ListEmptyComponent={
          explore.isInitialLoading ? null : (
            <DiscoveryEmptyState
              title="No gyms match"
              subtitle="Try adjusting filters or reset to see more results."
              actionLabel="Clear filters"
              onActionPress={clearFilters}
            />
          )
        }
        ListFooterComponent={
          explore.fetchNextBusy ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator accessibilityLabel="Loading more gyms" />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing[2],
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing[1],
    lineHeight: 20,
  },
  count: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  hint: {
    fontSize: 12,
    marginBottom: spacing[2],
  },
  loadingBlock: {
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  footerLoader: {
    paddingVertical: spacing[6],
  },
});
