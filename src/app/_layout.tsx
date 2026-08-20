import {Stack} from "expo-router";
import {Appearance, useColorScheme, View} from "react-native";

import {CombinedDarkTheme, CombinedDefaultTheme, ThemeContext,} from "@/components/ThemeContext";
import {PaperProvider} from "react-native-paper";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {
    appPages,
    authPages,
    dashboard,
    index,
    login,
    register,
    taskForm,
    THEME_STORAGE_KEY,
} from "@/constants/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useEffect, useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import {initializeDatabase} from "@/database/sqlite/db";

import Constants from "expo-constants";
import {store} from "@/store/store";
import {Provider} from "react-redux";

const extra = Constants.expoConfig?.extra;

export const CURRENT_ENV = extra?.environment;

console.log(`Running app in [${CURRENT_ENV}] mode`);

//SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");

  // Optional: Load saved user theme preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      }
    });
  }, []);

  useEffect(() => {
    // Initialize the SQLite tables on app boot
    initializeDatabase();
  }, []);

  // Toggle function that updates state and saves to storage
  const toggleTheme = async () => {
    const newThemeState = !isDark;
    setIsDark(newThemeState);
    try {
      const theme: "dark" | "light" = newThemeState ? "dark" : "light";

      if (Appearance.getColorScheme() === theme) {
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch (e) {
      console.error("Failed to save theme preference", e);
    }
  };

  const theme = isDark ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={!isDark ? "dark" : "light"} />
      <ThemeContext.Provider
        value={{
          isDark,
          theme,
          toggleTheme,
        }}
      >
        <Provider store={store}>
          <PaperProvider theme={theme}>
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: theme.colors.background,
              }}
            >
              <SafeAreaView style={{ width: "100%", height: "100%" }}>
                <Stack
                  initialRouteName={index}
                  screenOptions={{ headerShown: false }}
                >
                  <Stack.Screen name={index} />
                  <Stack.Screen name={`${authPages}/${login}`} />
                  <Stack.Screen name={`${authPages}/${register}`} />
                  <Stack.Screen name={`${appPages}/${dashboard}`} />
                  <Stack.Screen name={`${appPages}/${taskForm}`} />
                </Stack>
              </SafeAreaView>
            </View>
          </PaperProvider>
        </Provider>
      </ThemeContext.Provider>
    </GestureHandlerRootView>
  );
}
