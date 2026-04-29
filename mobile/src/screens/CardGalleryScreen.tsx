// Screen 4 — Gallery. 2-column grid of 7 thumbnails: 3 active (Diamond,
// OG, Recap) tappable to open at the right card; 4 coming-soon (Top
// Tokens, Top Genre, Personality, Achievements) rendered grayscale with
// a "v2" badge.
//
// Tapping an active thumbnail navigates back to CardReveal — the
// CardReveal carousel doesn't support deep-link to index from another
// screen (it's a fresh mount), so we just pop back; future polish can
// wire `initialPage` through nav params.

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import PixelIcon, { type IconName } from '../components/PixelIcon';
import { colors, gradients, spacing } from '../theme/tokens';
import type { CardType, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Gallery'>;

type Thumb = {
  id: CardType;
  label: string;
  icon: IconName;
  stat: string;
  statUnit: string;
  accent: string;
  active: boolean;
  gradient: readonly [string, string, string];
};

function buildThumbs(): Thumb[] {
  return [
    {
      id: 'diamond',
      label: 'Diamond Hand',
      icon: 'diamond',
      stat: '847',
      statUnit: 'DAYS',
      accent: '#FFFFFF',
      active: true,
      gradient: gradients.card.diamond,
    },
    {
      id: 'og',
      label: 'OG Status',
      icon: 'crown',
      stat: 'TOP 1%',
      statUnit: '',
      accent: '#0A0A0F',
      active: true,
      gradient: gradients.card.og,
    },
    {
      id: 'recap',
      label: 'Year Recap',
      icon: 'spiral',
      stat: '2026',
      statUnit: '',
      accent: '#FFFFFF',
      active: true,
      gradient: gradients.card.recap,
    },
    // v2 placeholders — keep the gradient but render grayscale via overlay.
    {
      id: 'swaps',
      label: 'Top Tokens',
      icon: 'fire',
      stat: '142',
      statUnit: 'SWAPS',
      accent: '#FFD93B',
      active: false,
      gradient: gradients.card.swaps,
    },
    {
      id: 'genre',
      label: 'Top Genre',
      icon: 'spiral',
      stat: 'DEFI',
      statUnit: 'MAXI',
      accent: '#0A0A0F',
      active: false,
      gradient: gradients.card.genre,
    },
    {
      id: 'personality',
      label: 'Personality',
      icon: 'fire',
      stat: 'THE',
      statUnit: 'SCOUT',
      accent: '#FFD93B',
      active: false,
      gradient: gradients.card.personality,
    },
    {
      id: 'achievement',
      label: 'Achievements',
      icon: 'crown',
      stat: '12 / 20',
      statUnit: '',
      accent: '#0A0A0F',
      active: false,
      gradient: gradients.card.achievement,
    },
  ];
}

export default function CardGalleryScreen({ navigation }: Props) {
  const thumbs = buildThumbs();

  const onPress = (t: Thumb) => {
    if (!t.active) return;
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.topLabel}>GALLERY</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.h1}>All your</Text>
            <Text style={[styles.h1, styles.h1Accent]}>stories.</Text>
            <Text style={styles.headerSub}>
              {thumbs.filter((t) => t.active).length} active · {thumbs.filter((t) => !t.active).length} coming in v2
            </Text>
          </View>

          <View style={styles.grid}>
            {thumbs.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => onPress(t)}
                style={({ pressed }) => [styles.cell, pressed && t.active && styles.cellPressed]}
              >
                <View style={styles.thumbShell}>
                  <LinearGradient
                    colors={t.gradient as unknown as readonly [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.thumb}
                  >
                    <View style={styles.thumbTop}>
                      <Text
                        style={[
                          styles.thumbLabel,
                          { color: t.accent, opacity: t.active ? 0.95 : 0.55 },
                        ]}
                        numberOfLines={2}
                      >
                        {t.label.toUpperCase()}
                      </Text>
                      <PixelIcon name={t.icon} size={28} color={t.accent} />
                    </View>
                    <View>
                      <Text
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        style={[styles.thumbStat, { opacity: t.active ? 1 : 0.55 }]}
                      >
                        {t.stat}
                      </Text>
                      {t.statUnit ? (
                        <Text
                          style={[
                            styles.thumbStatUnit,
                            { color: t.accent, opacity: t.active ? 1 : 0.55 },
                          ]}
                        >
                          {t.statUnit}
                        </Text>
                      ) : null}
                    </View>
                  </LinearGradient>
                  {/* Grayscale-ish overlay for v2 cards */}
                  {!t.active ? (
                    <>
                      <View pointerEvents="none" style={styles.dimOverlay} />
                      <View style={styles.v2Badge}>
                        <Text style={styles.v2Text}>v2</Text>
                      </View>
                    </>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { color: colors.white, fontSize: 22, fontWeight: '700', marginTop: -2 },
  topLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 4 },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  h1: {
    color: colors.white,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 46,
  },
  h1Accent: {
    color: colors.solanaRed,
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 0.2,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '48%',
    aspectRatio: 9 / 12,
  },
  cellPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  thumbShell: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  thumb: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  thumbTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  thumbLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    flex: 1,
    paddingRight: 4,
  },
  thumbStat: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -2,
  },
  thumbStatUnit: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.55)',
  },
  v2Badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  v2Text: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
