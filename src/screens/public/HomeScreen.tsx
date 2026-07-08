import { useMemo } from "react";
import { router } from "expo-router";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { GymDiscoverCard } from "@/components/discovery/GymDiscoverCard";
import { GymDiscoverCardSkeleton } from "@/components/discovery/GymDiscoverCardSkeleton";
import { PromoBannerCarousel } from "@/components/discovery/PromoBannerCarousel";
import { SectionHeader } from "@/components/discovery/SectionHeader";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useHomeDiscovery } from "@/hooks/useHomeDiscovery";
import { layout, text } from "@/theme/classes";

export function HomeScreen() {
  const { gyms, loading, error, refresh, isRefetching, geo } =
    useHomeDiscovery();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1024;
  const desktopColumns = width >= 1500 ? 3 : 2;

  const locationCaption = useMemo(() => {
    if (geo.coords) {
      return "Location on — gyms are ranked with your live position. Use Explore for filters and sorts.";
    }

    return "Location off — enable access for distance labels. Use Explore for filters and sorts.";
  }, [geo.coords]);

  return (
    <Screen scroll refreshing={isRefetching} onRefresh={refresh}>
      <View style={isDesktopWeb ? styles.desktopShell : null}>
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
      </View>

      {loading ? (
        <View className={layout.sectionLg} style={isDesktopWeb ? styles.desktopShell : null}>
          <View style={isDesktopWeb ? styles.desktopGrid : null}>
            {Array.from({ length: 4 }).map((_, slot) => (
              <View
                key={`home-skel-${slot}`}
                style={isDesktopWeb ? [styles.desktopGridItem, { width: `${100 / desktopColumns}%` }] : null}
              >
                <GymDiscoverCardSkeleton />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {error ? (
        <View style={isDesktopWeb ? styles.desktopShell : null}>
          <Card>
            <Text className={text.error}>
              We couldn&apos;t load gyms. Apply the newest Supabase migration (gym
              discovery columns), then pull to refresh.
            </Text>
          </Card>
        </View>
      ) : null}

      {!loading && !error ? (
        <View className={layout.sectionXl} style={isDesktopWeb ? styles.desktopShell : null}>
          <SectionHeader
            title="All gyms"
            subtitle={
              gyms.length > 0
                ? `${gyms.length} venue${gyms.length === 1 ? "" : "s"} — personalized order. Open Explore to filter or sort.`
                : "No gyms in the catalog yet."
            }
          />
          <View style={isDesktopWeb ? styles.desktopGrid : null}>
            {gyms.map((gym) => (
              <View
                key={gym.id}
                style={isDesktopWeb ? [styles.desktopGridItem, { width: `${100 / desktopColumns}%` }] : null}
              >
                <GymDiscoverCard
                  gym={gym}
                  onPress={() => router.push(`/gym/${gym.id}`)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {!loading && !error && gyms.length === 0 ? (
        <View style={isDesktopWeb ? styles.desktopShell : null}>
          <Card>
            <Text className={text.caption}>
              Seed gyms with latitude, longitude, ratings, categories, and
              membership plans — they will appear here automatically.
            </Text>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  desktopShell: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  desktopGridItem: {
    paddingHorizontal: 8,
  },
});
