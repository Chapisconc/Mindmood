import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { LogBox } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import NewEntryScreen from './screens/NewEntryScreen';
import HistoryScreen from './screens/HistoryScreen';
import StatsScreen from './screens/StatsScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import InboxScreen from './screens/InboxScreen';

import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { I18nProvider } from './i18n/I18nContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import * as Notifications from 'expo-notifications';

LogBox.ignoreLogs(['expo-notifications']);

enableScreens();

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppNavigator() {
  const { themeStyles } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: themeStyles.header,
          },
          headerTintColor: themeStyles.text,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 18,
            letterSpacing: -0.3,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: themeStyles.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />

        <Stack.Screen name="NewEntry" component={NewEntryScreen} options={{ title: '✦ Escribir Diario' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: '📖 Historial' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: '📈 Estadísticas' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '⚙️ Perfil' }} />
        <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: '📩 Mensajes' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppNavigator />
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
