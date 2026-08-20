import * as React from 'react';

import { MD3DarkTheme as DefaultDarkTheme, MD3LightTheme as DefaultLightTheme } from 'react-native-paper';

// Optional: Merge with system themes for robustness if using Expo/RN navigation containers
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from 'expo-router/react-navigation';
import merge from 'deepmerge';

// Merge RNP theme with React Navigation themes if using a navigator (highly recommended)
const CombinedDefaultTheme = merge(DefaultLightTheme, NavigationDefaultTheme);
const CombinedDarkTheme = merge(DefaultDarkTheme, NavigationDarkTheme);


// Define the shape of our context value
interface ThemeContextType {
  isDark: boolean;
  theme: typeof CombinedDefaultTheme | typeof CombinedDarkTheme;
  toggleTheme: () => void;
}

// Create the context
const ThemeContext = React.createContext<ThemeContextType>({
  isDark: false,
  theme: CombinedDefaultTheme,
  toggleTheme: () => {},
});

// A hook to easily consume the context
const useThemeContext = () => React.useContext(ThemeContext);

export { CombinedDarkTheme, CombinedDefaultTheme, ThemeContext, useThemeContext };

