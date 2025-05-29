import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === 'dark');

  // Listen for device theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Enhanced color palettes with much better contrast and visual hierarchy
  const theme = {
    isDarkMode,
    colors: isDarkMode
      ? {
          // Dark mode - Premium dark theme with excellent contrast
          
          // Base backgrounds with proper depth and contrast
          background: '#0A0A0F',           // Very dark navy for main background
          surface: '#161622',             // Elevated surface color
          surfaceVariant: '#1E1E2E',      // Card/container backgrounds
          
          // Text colors with high contrast ratios
          text: '#FFFFFF',                // Pure white for primary text
          textSecondary: '#E4E4E7',       // Light gray for secondary text (zinc-200)
          subtitle: '#A1A1AA',            // Medium gray for subtitles (zinc-400)
          textTertiary: '#71717A',        // Darker gray for tertiary text (zinc-500)
          
          // Container hierarchy for better visual organization
          baseContainerHeader: '#1A1A2E', // Deep purple-navy for headers
          baseContainerBody: '#16162A',   // Slightly lighter for content areas
          baseContainerFooter: '#202040', // Elevated footer areas
          
          // Sophisticated gradient combinations
          gradientColors: ['#0F0F23', '#1A1A2E', '#252547'], // Deep navy to purple gradient
          gradientPrimary: ['#3B82F6', '#6366F1', '#8B5CF6'], // Blue to purple
          gradientAccent: ['#F59E0B', '#F97316', '#EF4444'],  // Warm gradient
          
          // Primary brand colors - vibrant but not harsh
          primary: '#60A5FA',             // Sky blue 400 - softer than pure blue
          primaryDark: '#3B82F6',         // Sky blue 500 for pressed states
          primaryLight: '#93C5FD',        // Sky blue 300 for hover states
          
          // Secondary and accent colors
          secondary: '#FBBF24',           // Amber 400 - warm and inviting
          secondaryDark: '#F59E0B',       // Amber 500
          accent: '#F472B6',              // Pink 400 - playful accent
          accentDark: '#EC4899',          // Pink 500
          
          // Semantic colors with proper contrast
          success: '#34D399',             // Emerald 400
          successDark: '#10B981',         // Emerald 500
          successBg: '#064E3B',           // Dark emerald background
          
          warning: '#FBBF24',             // Amber 400
          warningDark: '#F59E0B',         // Amber 500  
          warningBg: '#451A03',           // Dark amber background
          
          error: '#F87171',               // Red 400
          errorDark: '#EF4444',           // Red 500
          errorBg: '#7F1D1D',             // Dark red background
          errorLight: '#FEE2E2',          // Light red for backgrounds
          
          info: '#60A5FA',                // Sky 400
          infoDark: '#3B82F6',            // Sky 500
          infoBg: '#1E3A8A',              // Dark blue background
          
          // Interactive elements
          buttonBackground: '#3B82F6',    // Primary button background
          buttonText: '#FFFFFF',          // Button text
          buttonSecondary: '#374151',     // Secondary button background
          buttonSecondaryText: '#F9FAFB', // Secondary button text
          
          // Card and surface elements
          card: '#1E1E2E',                // Card background
          cardElevated: '#252547',        // Elevated card background
          modal: '#1A1A2E',               // Modal backgrounds
          
          // Borders and dividers
          border: '#374151',              // Primary border color (gray-700)
          borderLight: '#4B5563',         // Lighter borders (gray-600)
          borderDark: '#1F2937',          // Darker borders (gray-800)
          divider: '#374151',             // Divider lines
          
          // Input and form elements
          input: '#1F2937',               // Input background (gray-800)
          inputBorder: '#4B5563',         // Input border (gray-600)
          inputFocus: '#60A5FA',          // Focused input border
          inputText: '#FFFFFF',           // Input text color
          inputPlaceholder: '#9CA3AF',    // Placeholder text (gray-400)
          
          // Status and notification colors
          highlight: '#34D399',           // Emerald for highlights
          notification: '#F472B6',        // Pink for notifications
          badge: '#DC2626',               // Red for badges
          
          // Special elements
          shadowColor: '#000000',         // Shadow color
          overlay: 'rgba(0, 0, 0, 0.7)',  // Modal overlay
          backdrop: 'rgba(15, 15, 35, 0.9)', // Backdrop color
          
          // Commerce specific
          bestSeller: '#FCD34D',          // Amber 300 for badges
          price: '#34D399',               // Emerald for prices
          discount: '#F87171',            // Red for discounts
          
          // Tab and navigation
          tabActive: '#60A5FA',           // Active tab color
          tabInactive: '#6B7280',         // Inactive tab color
          tabBackground: '#1F2937',       // Tab background
          
          // Admin specific colors
          adminPrimary: '#8B5CF6',        // Violet for admin sections
          adminSecondary: '#06B6D4',      // Cyan for admin highlights
          adminDanger: '#F87171',         // Red for admin warnings
        }
      : {
          // Light mode - Clean and modern with excellent readability
          
          // Base backgrounds
          background: '#FFFFFF',          // Pure white
          surface: '#F8FAFC',             // Slate 50
          surfaceVariant: '#F1F5F9',      // Slate 100
          
          // Text colors with proper contrast
          text: '#0F172A',                // Slate 900
          textSecondary: '#1E293B',       // Slate 800
          subtitle: '#475569',            // Slate 600
          textTertiary: '#64748B',        // Slate 500
          
          // Container hierarchy
          baseContainerHeader: '#F8FAFC', // Slate 50
          baseContainerBody: '#F1F5F9',   // Slate 100
          baseContainerFooter: '#E2E8F0', // Slate 200
          
          // Gradients
          gradientColors: ['#EBF4FF', '#DBEAFE', '#BFDBFE'], // Light blue gradient
          gradientPrimary: ['#3B82F6', '#2563EB', '#1D4ED8'], // Blue gradient
          gradientAccent: ['#F59E0B', '#D97706', '#B45309'],  // Amber gradient
          
          // Primary colors
          primary: '#2563EB',             // Blue 600
          primaryDark: '#1D4ED8',         // Blue 700
          primaryLight: '#3B82F6',        // Blue 500
          
          // Secondary and accent
          secondary: '#D97706',           // Amber 600
          secondaryDark: '#B45309',       // Amber 700
          accent: '#DC2626',              // Red 600
          accentDark: '#B91C1C',          // Red 700
          
          // Semantic colors
          success: '#059669',             // Emerald 600
          successDark: '#047857',         // Emerald 700
          successBg: '#D1FAE5',           // Light emerald background
          
          warning: '#D97706',             // Amber 600
          warningDark: '#B45309',         // Amber 700
          warningBg: '#FEF3C7',           // Light amber background
          
          error: '#DC2626',               // Red 600
          errorDark: '#B91C1C',           // Red 700
          errorBg: '#FEE2E2',             // Light red background
          errorLight: '#FEE2E2',          // Light red
          
          info: '#2563EB',                // Blue 600
          infoDark: '#1D4ED8',            // Blue 700
          infoBg: '#DBEAFE',              // Light blue background
          
          // Interactive elements
          buttonBackground: '#2563EB',    // Primary button
          buttonText: '#FFFFFF',          // Button text
          buttonSecondary: '#F1F5F9',     // Secondary button
          buttonSecondaryText: '#374151', // Secondary button text
          
          // Cards and surfaces
          card: '#FFFFFF',                // Card background
          cardElevated: '#F8FAFC',        // Elevated card
          modal: '#FFFFFF',               // Modal background
          
          // Borders
          border: '#E2E8F0',              // Slate 200
          borderLight: '#F1F5F9',         // Slate 100
          borderDark: '#CBD5E1',          // Slate 300
          divider: '#E2E8F0',             // Divider color
          
          // Inputs
          input: '#FFFFFF',               // Input background
          inputBorder: '#D1D5DB',         // Input border
          inputFocus: '#2563EB',          // Focused border
          inputText: '#111827',           // Input text
          inputPlaceholder: '#6B7280',    // Placeholder text
          
          // Status colors
          highlight: '#059669',           // Emerald highlight
          notification: '#DC2626',        // Red notification
          badge: '#DC2626',               // Red badge
          
          // Special elements
          shadowColor: '#64748B',         // Shadow color
          overlay: 'rgba(0, 0, 0, 0.5)',  // Modal overlay
          backdrop: 'rgba(248, 250, 252, 0.95)', // Light backdrop
          
          // Commerce
          bestSeller: '#F59E0B',          // Amber for badges
          price: '#059669',               // Emerald for prices
          discount: '#DC2626',            // Red for discounts
          
          // Navigation
          tabActive: '#2563EB',           // Active tab
          tabInactive: '#64748B',         // Inactive tab
          tabBackground: '#F8FAFC',       // Tab background
          
          // Admin colors
          adminPrimary: '#7C3AED',        // Violet 600
          adminSecondary: '#0891B2',      // Cyan 600
          adminDanger: '#DC2626',         // Red 600
        },
    toggleTheme,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);