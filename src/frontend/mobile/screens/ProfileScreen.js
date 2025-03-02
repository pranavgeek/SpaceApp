import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import ButtonSettings from "../components/ButtonSettings";
import ButtonMain from "../components/ButtonMain";
import ButtonIcon from "../components/ButtonIcon";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext"; // Import useTheme hook

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme(); // Access theme colors
  const styles = getDynamicStyles(colors); // Generate dynamic styles

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileWrapper}>
        {/* Profile Info Section */}
        <View style={styles.profileLeft}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>John Doe</Text>
          <Text style={styles.profileSubtitle}>Software Engineer</Text>

          <View style={styles.buttonContainer}>
            <ButtonMain
              style={styles.editBtnText}
              onPress={() => navigation.navigate("Edit Profile")}
              buttonColor={colors.text}
            >
              Edit Profile
            </ButtonMain>
            <ButtonIcon iconName={"share-social"} iconColor={colors.text} />
          </View>

          {/* Social Media Icons */}
          <View style={styles.socialMediaContainer}>
            <ButtonIcon iconName={"logo-twitter"} iconColor={colors.text} />
            <ButtonIcon iconName={"logo-instagram"} iconColor={colors.text} />
            <ButtonIcon iconName={"logo-tiktok"} iconColor={colors.text} />
            <ButtonIcon iconName={"logo-linkedin"} iconColor={colors.text} />
          </View>

          {/* Location & Languages */}
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={colors.subtitle}
                style={{ padding: 5 }}
              />
              <Text style={styles.profileText}>Toronto, Canada</Text>
            </View>
            <View style={styles.profileRow}>
              <Ionicons
                name="language"
                size={20}
                color={colors.subtitle}
                style={{ padding: 5 }}
              />
              <Text style={styles.profileText}>English, French</Text>
            </View>
          </View>

          {/* Stats Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <View style={styles.profileColumn}>
                <Text style={styles.profileSubtitle}>24</Text>
                <Text style={styles.profileText}>Campaigns</Text>
              </View>
              <View style={styles.profileColumn}>
                <Text style={styles.profileSubtitle}>52.0K</Text>
                <Text style={styles.profileText}>Followers</Text>
              </View>
              <View style={styles.profileColumn}>
                <Text style={styles.profileSubtitle}>125.0K</Text>
                <Text style={styles.profileText}>Earnings</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.profileRight}>
          {/* Buttons Grid */}
          <View style={styles.buttonContainerWeb}>
            <ButtonSettings
              iconName={"grid-outline"}
              onPress={() => navigation.navigate("My Products")}
              title={"My Products"}
              buttonColor={colors.primary}
              iconColor={colors.text}
            />
            <ButtonSettings
              iconName={"card-outline"}
              onPress={() => navigation.navigate("Payment History")}
              title={"Payment"}
              buttonColor={colors.primary}
              iconColor={colors.text}
            />
            <ButtonSettings
              iconName={"cube-outline"}
              onPress={() => {}}
              title={"Orders"}
              buttonColor={colors.primary}
              iconColor={colors.text}
            />
            <ButtonSettings
              iconName={"heart-outline"}
              onPress={() => {}}
              title={"Favourites"}
              buttonColor={colors.primary}
              iconColor={colors.text}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const getDynamicStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.background,
  },
  profileWrapper: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    justifyContent: Platform.OS === "web" ? "space-between" : "center",
    alignItems: "flex-start",
    alignSelf: "center",
    width: Platform.OS === "web" ? "auto" : "100%",
  },
  profileLeft: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  profileRight: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  profileSubtitle: {
    fontSize: 14,
    color: colors.subtitle,
  },
  socialMediaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: 400,
    height: 60,
  },
  buttonContainerWeb: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    flexWrap: "wrap",
    width: "100%",
  },
  profileSection: {
    marginTop: 10,
    alignItems: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  profileText: {
    fontSize: 14,
    color: colors.subtitle,
  },
  profileColumn: {
    alignItems: "center",
    marginHorizontal: 10,
  },
});