import React, { useLayoutEffect } from "react";
import { 
  View, 
  ScrollView, 
  Image, 
  Alert, 
  StyleSheet, 
  Text, 
  Platform, 
  TouchableOpacity 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ButtonSetting from "../components/ButtonSetting";
import BaseContainer from "../components/BaseContainer";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { logout, user, updateRole } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { 
        backgroundColor: colors.background,
        elevation: 0, // Remove shadow on Android
        shadowOpacity: 0, // Remove shadow on iOS
        borderBottomWidth: 0,
      },
      headerTintColor: colors.text,
      headerTitle: "Settings",
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
      }
    });
  }, [navigation, colors]);

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      // Web-specific logout
      if (window.confirm("Are you sure you want to logout?")) {
        logout();
      }
    } else {
      // Native logout with Alert
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Logout", 
            onPress: () => logout(),
            style: "destructive" 
          },
        ],
        { cancelable: false }
      );
    }
  };

  const handleDowngrade = () => {
    updateRole("buyer");
    navigation.navigate("Home");
  };

  // Custom setting item with modern design
  const SettingItem = ({ icon, title, subtitle, onPress, isDanger, disabled, showDivider = true }) => (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        showDivider && styles.settingItemWithBorder,
        disabled && styles.settingItemDisabled
      ]}
      onPress={disabled ? null : onPress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={styles.settingItemIcon}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isDanger ? '#FF3B30' : colors.text} 
        />
      </View>
      <View style={styles.settingItemContent}>
        <Text style={[
          styles.settingItemTitle, 
          isDanger && styles.settingItemDangerText
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={18} 
        color={isDanger ? '#FF3B30' : colors.subtitle} 
      />
    </TouchableOpacity>
  );

  // Custom section component
  const SettingsSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Summary Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: user?.avatar || "https://ui-avatars.com/api/?name=" + user?.name?.replace(/\s+/g, '+'),
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileBadge}>
            <Ionicons 
              name={user?.role === "seller" ? "briefcase" : (user?.role === "influencer" ? "star" : "person")} 
              size={12} 
              color="#FFF" 
            />
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || "User"}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.profileRole}>
            <Text style={styles.profileRoleText}>
              {user?.role === "seller" ? "Seller Account" : 
               user?.role === "influencer" ? "Influencer" : "Buyer"}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={16} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <SettingsSection title="ACCOUNT">
        <SettingItem
          icon="shield-checkmark-outline"
          title="Security & Privacy"
          onPress={() => navigation.navigate("Security & Privacy")}
        />
        <SettingItem
          icon="card-outline"
          title="Payment Methods"
          subtitle="Manage your payment options"
          onPress={() => navigation.navigate("Payment Methods")}
        />
        <SettingItem
          icon="star-outline"
          title="Influencer Program"
          onPress={() => navigation.navigate("Influencer Program")}
        />

        {user.role === "influencer" && (
          <SettingItem
            icon="people-outline"
            title="Collaboration"
            onPress={() => navigation.navigate("Collaboration")}
          />
        )}

        <SettingItem
          icon="layers-outline"
          title="Sellers Plans"
          // subtitle={user.role !== "buyer" ? "You are already a seller" : "Upgrade your account"}
          onPress={() => navigation.navigate("Sellers Plans")}
          // disabled={user.role !== "buyer"}
          showDivider={false}
        />
      </SettingsSection>

      {/* Preferences Section */}
      <SettingsSection title="PREFERENCES">
        <SettingItem
          icon="notifications-outline"
          title="Notifications"
          onPress={() => navigation.navigate("Notifications")}
        />
        <SettingItem
          icon="globe-outline"
          title="Language & Region"
          subtitle="English (US)"
          onPress={() => navigation.navigate("Language")}
        />
        <SettingItem
          icon="moon-outline"
          title="Appearance"
          subtitle="System Default"
          onPress={() => navigation.navigate("Appearance")}
          showDivider={false}
        />
      </SettingsSection>

      {/* Support & Account Actions */}
      <SettingsSection title="SUPPORT & ACCOUNT">
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => navigation.navigate("Support")}
        />
        
        {user.role !== "buyer" && (
          <SettingItem
            icon="arrow-down-circle-outline"
            title="Downgrade to Buyer"
            onPress={handleDowngrade}
            isDanger={true}
          />
        )}
        
        <SettingItem
          icon="log-out-outline"
          title="Logout"
          onPress={confirmLogout}
          isDanger={true}
          showDivider={false}
        />
      </SettingsSection>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.appLogo} 
          resizeMode="contain"
        />
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appCopyright}>© 2025 Your Company</Text>
      </View>
    </ScrollView>
  );
}

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingBottom: 40,
    },
    headerButton: {
      padding: 8,
    },
    // Profile Card styles
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.background === '#000000' ? '#1A1A1A' : '#FFFFFF',
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    profileImageContainer: {
      position: 'relative',
    },
    profileImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#E1E1E1',
    },
    profileBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#007AFF',
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background === '#000000' ? '#1A1A1A' : '#FFFFFF',
    },
    profileInfo: {
      flex: 1,
      marginLeft: 16,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 6,
    },
    profileRole: {
      backgroundColor: colors.background === '#000000' ? '#333333' : '#F0F0F0',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    profileRoleText: {
      fontSize: 12,
      color: colors.subtitle,
      fontWeight: '500',
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background === '#000000' ? '#333333' : '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Section styles
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtitle,
      marginLeft: 16,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    sectionContent: {
      backgroundColor: colors.background === '#000000' ? '#1A1A1A' : '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      marginHorizontal: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    // Setting item styles
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    settingItemWithBorder: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.background === '#000000' ? '#333333' : '#E0E0E0',
    },
    settingItemDisabled: {
      opacity: 0.5,
    },
    settingItemIcon: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    settingItemContent: {
      flex: 1,
    },
    settingItemTitle: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    settingItemSubtitle: {
      fontSize: 13,
      color: colors.subtitle,
      marginTop: 2,
    },
    settingItemDangerText: {
      color: '#FF3B30',
    },
    // App info styles
    appInfo: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    appLogo: {
      width: 60,
      height: 60,
      marginBottom: 8,
    },
    appVersion: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 4,
    },
    appCopyright: {
      fontSize: 12,
      color: colors.subtitle,
      opacity: 0.7,
    },
  });