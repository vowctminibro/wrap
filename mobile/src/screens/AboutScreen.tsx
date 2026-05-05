// About / credits screen — opens modally from the (i) icon on
// CardReveal and Gallery. Tap X or swipe-down to dismiss.

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import SolanaBadge from '../components/SolanaBadge';
import { colors, gradients, radius, spacing } from '../theme/tokens';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

type Credit = { label: string; sub: string; href: string };

const CREDITS: Credit[] = [
  {
    label: 'Solana',
    sub: 'Blockchain — high-throughput Layer 1',
    href: 'https://solana.com',
  },
  {
    label: 'Helius',
    sub: 'RPC + Enhanced Transactions API',
    href: 'https://helius.dev',
  },
  {
    label: 'Pinata',
    sub: 'IPFS pinning for cNFT image hosting',
    href: 'https://pinata.cloud',
  },
  {
    label: 'Gemini 2.5 Flash',
    sub: 'AI insight generation (Groq fallback)',
    href: 'https://ai.google.dev',
  },
  {
    label: 'Metaplex Bubblegum',
    sub: 'Compressed NFT (cNFT) program',
    href: 'https://developers.metaplex.com/bubblegum',
  },
  {
    label: 'Solana Attestation Service',
    sub: 'On-chain identity attestations (sas-lib)',
    href: 'https://attest.solana.com',
  },
];

const open = (url: string) => Linking.openURL(url).catch(() => {});

export default function AboutScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <Text style={styles.topLabel}>ABOUT</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeBtnText}>×</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.h1}>WRAP</Text>
          <Text style={styles.tagline}>
            Spotify Wrapped for your Solana wallet. AI-written stories from
            real on-chain history, mintable as cNFTs.
          </Text>

          <Section title="TECH STACK">
            {CREDITS.map((c) => (
              <Pressable
                key={c.label}
                onPress={() => open(c.href)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{c.label}</Text>
                  <Text style={styles.rowSub}>{c.sub}</Text>
                </View>
                <Text style={styles.rowArrow}>↗</Text>
              </Pressable>
            ))}
          </Section>

          <Section title="SOURCE">
            <Pressable
              onPress={() => open('https://github.com/vowctminibro/wrap')}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>github.com/vowctminibro/wrap</Text>
                <Text style={styles.rowSub}>Open source · license TBD</Text>
              </View>
              <Text style={styles.rowArrow}>↗</Text>
            </Pressable>
          </Section>

          <Section title="BUILT BY">
            <Pressable
              onPress={() => open('https://github.com/vowctminibro')}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Vow</Text>
                <Text style={styles.rowSub}>Solo, AI-native, Bangkok</Text>
              </View>
              <Text style={styles.rowArrow}>↗</Text>
            </Pressable>
          </Section>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              WRAP is not affiliated with, endorsed by, or sponsored by the
              Solana Foundation. Solana is a trademark of Solana Foundation.
            </Text>
          </View>

          <View style={styles.badgeWrap}>
            <SolanaBadge size="sm" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
  topLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '500',
    marginTop: -3,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  h1: {
    color: colors.white,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -3,
    marginTop: spacing.md,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowSub: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  rowArrow: {
    color: colors.solanaPurple,
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  disclaimerText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  badgeWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
