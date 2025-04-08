import React, { useLayoutEffect } from "react";
import { View, ScrollView, Image, Alert, StyleSheet, Text, Platform } from "react-native";
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
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
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
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: () => logout() },
        ],
        { cancelable: false }
      );
    }
  };

  const handleDowngrade = () => {
    updateRole("buyer");
    navigation.navigate("Home");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      {/* <View style={styles.profileSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileSubtitle}>Software Engineer</Text>
      </View> */}

      <BaseContainer title={"Account"}>
        <View>
          {/* <ButtonSetting
            iconName={"person-outline"}
            title={"Profile Information"}
            onPress={() => navigation.navigate("Edit Profile")}
            rightIcon={"chevron-forward"}
          /> */}
          <ButtonSetting
            iconName={"lock-closed-outline"}
            title={"Security & Privacy"}
            onPress={() => navigation.navigate("Security & Privacy")}
            rightIcon={"chevron-forward"}
          />
          <ButtonSetting
            iconName={"card-outline"}
            title={"Payment Options"}
            onPress={() => navigation.navigate("Payment Methods")}
            rightIcon={"chevron-forward"}
          />
          <ButtonSetting
            iconName={"star-outline"}
            title={"Influencer Program"}
            onPress={() => navigation.navigate("Influencer Program")}
            rightIcon={"chevron-forward"}
          />

          {user.role === "influencer" && (
            <ButtonSetting
              iconName={"people-outline"}
              title={"Collaboration"}
              onPress={() => navigation.navigate("Collaboration")}
              rightIcon={"chevron-forward"}
            />
          )}

          {/* Sellers Plans button always rendered.
              If user is not a buyer, it appears faded and disabled. */}
          <ButtonSetting
            iconName={"layers-outline"}
            title={"Sellers Plans"}
            onPress={
              user.role === "buyer"
                ? () => navigation.navigate("Sellers Plans")
                : null
            }
            rightIcon={"chevron-forward"}
            style={user.role === "buyer" ? {} : { opacity: 0.1 }}
            disabled={user.role !== "buyer"}
          />
        </View>
      </BaseContainer>

      <BaseContainer title={"Preferences"}>
        <View>
          <ButtonSetting
            iconName={"notifications-outline"}
            title={"Notifications"}
            onPress={() => navigation.navigate("Notifications")}
            rightIcon={"chevron-forward"}
          />
          <ButtonSetting
            iconName={"globe-outline"}
            title={"Language & Region"}
            onPress={() => navigation.navigate("Language")}
            rightIcon={"chevron-forward"}
          />
          <ButtonSetting
            iconName={"moon"}
            title={"Appearance"}
            onPress={() => navigation.navigate("Appearance")}
            rightIcon={"chevron-forward"}
          />
        </View>
      </BaseContainer>

      <BaseContainer title={"Support & Logout"}>
        <View>
          <ButtonSetting
            iconName={"help-circle-outline"}
            title={"Help & Support"}
            onPress={() => navigation.navigate("Support")}
            rightIcon={"chevron-forward"}
          />
          {/* Downgrade button shown for seller and influencer */}
          {user.role !== "buyer" && (
            <ButtonSetting
              iconName={"arrow-down-outline"}
              title={"Downgrade to Buyer"}
              onPress={handleDowngrade}
              rightIcon={"chevron-forward"}
              isDanger={true}
            />
          )}
          <ButtonSetting
            iconName={"log-out-outline"}
            title={"Logout"}
            onPress={confirmLogout}
            rightIcon={"chevron-forward"}
            isDanger={true}
          />
        </View>
      </BaseContainer>
    </ScrollView>
  );
}

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 10,
      color: colors.text,
    },
    profileSection: {
      alignItems: "center",
      marginBottom: 20,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
    },
    profileName: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    profileSubtitle: {
      fontSize: 14,
      color: colors.text,
    },
  });
