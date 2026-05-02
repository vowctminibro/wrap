import './src/lib/polyfills';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import OnboardingScreen from './src/screens/OnboardingScreen';
import CardRevealScreen from './src/screens/CardRevealScreen';
import MintConfirmScreen from './src/screens/MintConfirmScreen';
import CardGalleryScreen from './src/screens/CardGalleryScreen';
import AboutScreen from './src/screens/AboutScreen';
import DebugAnalysisScreen from './src/screens/DebugAnalysisScreen';
import BattleInputScreen from './src/screens/BattleInputScreen';
import BattleResultScreen from './src/screens/BattleResultScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import type { RootStackParamList } from './src/types';
import { colors } from './src/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.white,
    border: colors.hairlineSoft,
    primary: colors.solanaPurple,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="CardReveal" component={CardRevealScreen} />
          <Stack.Screen name="MintConfirm" component={MintConfirmScreen} />
          <Stack.Screen name="Gallery" component={CardGalleryScreen} />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="Debug" component={DebugAnalysisScreen} />
          <Stack.Screen name="BattleInput" component={BattleInputScreen} />
          <Stack.Screen name="BattleResult" component={BattleResultScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
