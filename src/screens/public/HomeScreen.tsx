import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { GymDiscoverCard } from "@/components/discovery/GymDiscoverCard";
import { GymDiscoverCardSkeleton } from "@/components/discovery/GymDiscoverCardSkeleton";
import { PromoBannerCarousel } from "@/components/discovery/PromoBannerCarousel";
import { QuickSearchField } from "@/components/discovery/QuickSearchField";
import { SectionHeader } from "@/components/discovery/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useHomeDiscovery } from "@/hooks/useHomeDiscovery";
import { layout, text } from "@/theme/classes";

export function HomeScreen() {
  const { gyms, loading, error, refresh, isRefetching, geo } =
    useHomeDiscovery();
  const [homeQuery, setHomeQuery] = useState("");

  const locationCaption = useMemo(() => {
    if (geo.coords) {
      return "Location on — gyms are ranked with your live position. Use Explore for filters and sorts.";
    }

    return "Location off — enable access for distance labels. Use Explore for filters and sorts.";
  }, [geo.coords]);

  const navigateExplore = (payload: Record<string, string>) => {
    router.push({ pathname: "/(tabs)/explore", params: payload });
  };

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={refresh}>
      <View className={layout.screenTop}>
        <Text className={text.screenTitleLg}>Training dashboard</Text>

        <Text className={`${layout.stackSm} ${text.caption}`}>
          {locationCaption}
        </Text>
      </View>

      <View className={layout.sectionXl}>
        <SectionHeader title="Seasonal spotlight" />
        <PromoBannerCarousel />
      </View>

      {loading ? (
        <View className={layout.sectionLg}>
          {Array.from({ length: 4 }).map((_, slot) => (
            <GymDiscoverCardSkeleton key={`home-skel-${slot}`} />
          ))}
        </View>
      ) : null}

      {error ? (
        <Card>
          <Text className={text.error}>
            We couldn&apos;t load gyms. Apply the newest Supabase migration (gym
            discovery columns), then pull to refresh.
          </Text>
        </Card>
      ) : null}

      {!loading && !error ? (
        <View className={layout.sectionXl}>
          <SectionHeader
            title="All gyms"
            subtitle={
              gyms.length > 0
                ? `${gyms.length} venue${gyms.length === 1 ? "" : "s"} — personalized order. Open Explore to filter or sort.`
                : "No gyms in the catalog yet."
            }
          />
          {gyms.map((gym) => (
            <GymDiscoverCard
              key={gym.id}
              gym={gym}
              onPress={() => router.push(`/gym/${gym.id}`)}
            />
          ))}
        </View>
      ) : null}

      {!loading && !error && gyms.length === 0 ? (
        <Card>
          <Text className={text.caption}>
            Seed gyms with latitude, longitude, ratings, categories, and
            membership plans — they will appear here automatically.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}
