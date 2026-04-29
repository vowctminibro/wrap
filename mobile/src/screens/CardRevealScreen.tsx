import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Card from '../components/Card';
import AffiliateButton from '../components/AffiliateButton';
import { generateAllInsights } from '../lib/insight-engine';
import { buildShareText, shareCardImage } from '../lib/share-card';
import { mintCardAsCNFT } from '../services/cnft-mint';
import { colors, gradients, radius, spacing } from '../theme/tokens';
import type { CardData, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CardReveal'>;

const SCREEN_W = Dimensions.get('window').width;
const CARD_HORIZONTAL_PAD = spacing.lg;
const CARD_TRACK_W = SCREEN_W; // each page snap == screen width

export default function CardRevealScreen({ navigation, route }: Props) {
  const { publicKey, analysis } = route.params;
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const listRef = useRef<FlatList<CardData>>(null);
  // One ref per rendered card. Populated via callback ref so we can
  // capture the currently-visible card with view-shot at Share time.
  const cardRefs = useRef<Array<View | null>>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const insights = await generateAllInsights(analysis);
        if (alive) setCards(insights);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [analysis]);

  const onShare = async () => {
    const card = cards?.[page];
    if (!card) return;
    const text = buildShareText(analysis.personality, card.line);
    const view = cardRefs.current[page];
    const result = await shareCardImage(view ?? null, text);
    if (!result.shared) {
      Alert.alert('Share', 'Could not open share sheet.');
    }
  };

  const onMint = async () => {
    const card = cards?.[page];
    if (!card) return;
    setMinting(true);
    try {
      const view = cardRefs.current[page];
      const result = await mintCardAsCNFT({
        cardData: card,
        walletAddress: publicKey,
        cardView: view ?? null,
      });
      navigation.navigate('MintConfirm', {
        signature: result.signature,
        cardData: card,
      });
    } catch (e) {
      Alert.alert('Mint', (e as Error).message);
    } finally {
      setMinting(false);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first && typeof first.index === 'number') setPage(first.index);
    }
  ).current;

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 60 }),
    []
  );

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / CARD_TRACK_W);
    setPage(i);
  };

  if (error) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.errorTitle}>Something stopped working.</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.errorBack}>
            <Text style={styles.errorBackText}>Go back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (!cards) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered}>
          <View style={styles.loadingPulse} />
          <ActivityIndicator color={colors.solanaRed} size="large" />
          <Text style={styles.loadingTitle}>Analyzing your wallet…</Text>
          <Text style={styles.loadingSub}>
            Reading {analysis.totalTransactions.toLocaleString()} transactions.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.topLabel}>YOUR WRAPPED</Text>
          <Pressable
            onPress={() => navigation.navigate('Gallery', { publicKey, analysis })}
            style={styles.galleryBtn}
          >
            <Text style={styles.galleryBtnText}>≡</Text>
          </Pressable>
        </View>

        {/* Card carousel */}
        <FlatList
          ref={listRef}
          data={cards}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c.id}
          snapToInterval={CARD_TRACK_W}
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumScrollEnd}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => (
            <View
              collapsable={false}
              ref={(r) => {
                cardRefs.current[index] = r;
              }}
              style={styles.cardSlot}
            >
              <Card data={item} />
            </View>
          )}
        />

        {/* Dot indicator */}
        <View style={styles.dots}>
          {cards.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => listRef.current?.scrollToIndex({ index: i, animated: true })}
              hitSlop={8}
            >
              {i === page ? (
                <LinearGradient
                  colors={gradients.primaryDuo as unknown as readonly [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dotActive}
                />
              ) : (
                <View style={styles.dot} />
              )}
            </Pressable>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Pressable onPress={onShare} style={styles.ctaShare}>
            <LinearGradient
              colors={gradients.primaryDuo as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaShareGrad}
            >
              <Text style={styles.ctaText}>Share to 𝕏</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={onMint}
            disabled={minting}
            style={[styles.ctaMint, minting && styles.ctaMintDisabled]}
          >
            {minting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Mint as NFT</Text>
            )}
          </Pressable>
        </View>

        {/* Tertiary affiliate CTA, scoped to current card type */}
        <View style={styles.affiliateRow}>
          {cards[page] ? (
            <AffiliateButton card={cards[page]} analysis={analysis} />
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingPulse: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.solanaRed,
    opacity: 0.15,
  },
  loadingTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: spacing.lg,
  },
  loadingSub: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  errorTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  errorBody: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorBack: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  errorBackText: {
    color: colors.white,
    fontWeight: '700',
  },
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
  backBtnText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  topLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
  },
  cardSlot: {
    width: CARD_TRACK_W,
    paddingHorizontal: CARD_HORIZONTAL_PAD,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.hairline,
  },
  dotActive: {
    width: 26,
    height: 10,
    borderRadius: 5,
  },
  ctas: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ctaShare: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  ctaShareGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaMint: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaMintDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  galleryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryBtnText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2,
  },
  affiliateRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
});
