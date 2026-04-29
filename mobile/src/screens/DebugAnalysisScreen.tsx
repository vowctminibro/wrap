import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types';
import { colors, fontSizes, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Debug'>;

// Internal-only screen. Not on the main flow — reachable via direct
// navigation for verifying the Helius pipeline produces sane output.
export default function DebugAnalysisScreen({ route }: Props) {
  const { analysis } = route.params;
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.label}>WALLETANALYSIS — DEBUG</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.json}>{JSON.stringify(analysis, null, 2)}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, padding: spacing.md },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  scroll: { flex: 1 },
  json: {
    color: colors.white,
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 16,
  },
});
