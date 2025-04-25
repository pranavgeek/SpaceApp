import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { createUser, createAdminAction } from "../backend/db/API";

const InfluencerFormScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { tier } = route.params || { tier: "Starter Tier" };

  const [pendingSignup, setPendingSignup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupFlow, setIsSignupFlow] = useState(false);

  // Animation for header hide-on-scroll
  // const scrollY = useRef(new Animated.Value(0)).current;
  // const headerTranslateY = scrollY.interpolate({
  //   inputRange: [0, 50],
  //   outputRange: [0, -50],
  //   extrapolate: "clamp",
  // });
  const insets = useSafeAreaInsets();


  // Show custom header only in signup flow, hide default nav header then
  useEffect(() => {
    navigation.setOptions({ headerShown: !isSignupFlow });
  }, [navigation, isSignupFlow]);

  // Load pending signup info to detect signup vs settings flow
  useEffect(() => {
    const loadPendingSignup = async () => {
      try {
        const signupData = await AsyncStorage.getItem(
          "pendingInfluencerSignup"
        );
        if (signupData) {
          const parsedData = JSON.parse(signupData);
          setPendingSignup(parsedData);
          setIsSignupFlow(true);
          // Pre-fill form
          setFormData((prev) => ({
            ...prev,
            fullName: parsedData.name || "",
            email: parsedData.email || "",
          }));
        } else if (user) {
          setIsSignupFlow(false);
          setFormData((prev) => ({
            ...prev,
            fullName: user.name || "",
            email: user.email || "",
          }));
        }
      } catch (error) {
        console.error("Error loading pending signup data:", error);
      }
    };
    loadPendingSignup();
  }, [user]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    socialMediaHandles: "",
    followers: "",
    whyCollaborate: "",
    priorExperience: "",
    preferredContact: "email",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});

  // Validate fields
  const validateForm = () => {
    let tempErrors = {};
    if (!formData.fullName) tempErrors.fullName = "Full Name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    if (formData.email && !formData.email.includes("@"))
      tempErrors.email = "Valid email is required";
    if (!formData.phone) tempErrors.phone = "Phone Number is required";
    if (!formData.socialMediaHandles)
      tempErrors.socialMediaHandles = "Social Media Handles are required";
    if (!formData.followers)
      tempErrors.followers = "Follower count is required";
    if (!formData.whyCollaborate)
      tempErrors.whyCollaborate = "Please tell us why you want to collaborate";
    if (!formData.agreeTerms)
      tempErrors.agreeTerms = "You must agree to the terms";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Update single field
  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Submit admin request helper
  const submitInfluencerRequest = async (userId) => {
    const adminActionData = {
      user_id: userId,
      action: `Request to become an influencer`,
      details: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        socialMediaHandles: formData.socialMediaHandles,
        followers: formData.followers,
        whyCollaborate: formData.whyCollaborate,
        priorExperience: formData.priorExperience || "None",
        preferredContact: formData.preferredContact,
        selectedTier: tier,
        submittedAt: new Date().toISOString(),
      }),
      status: "pending",
      created_at: new Date().toISOString(),
    };
    const result = await createAdminAction(adminActionData);
    return result;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fill all required fields correctly.");
      return;
    }
    setIsLoading(true);
    try {
      if (pendingSignup) {
        const { name, email, password } = pendingSignup;
        const userData = {
          name,
          email,
          password,
          account_type: "Buyer",
          role: "buyer",
          about_us: formData.whyCollaborate,
          address: "",
          city: "",
          country: "",
          social_media_instagram: formData.socialMediaHandles,
          social_media_x: "",
          social_media_linkedin: "",
          social_media_website: "",
          profile_image: "default_profile.jpg",
          gender: "",
          age: null,
          is_two_factor_enabled: false,
          phone_number: formData.phone,
          is_private_account: false,
          privacy_settings: {
            hideActivity: false,
            hideContacts: false,
            hideProducts: false,
            allowMessagesFrom: "everyone",
          },
        };
        const newUser = await createUser(userData);
        await AsyncStorage.removeItem("pendingInfluencerSignup");
        await submitInfluencerRequest(newUser.user_id);
        await AsyncStorage.setItem("user", JSON.stringify(newUser));
        await AsyncStorage.setItem("userRole", "buyer");
        await AsyncStorage.setItem("isLoggedIn", "true");

        Alert.alert(
          "Application Submitted",
          "Your account has been created and your influencer application has been submitted for review. You can use your account as a regular user while your application is being processed.",
          [
            {
              text: "Continue to Home",
              onPress: () => {
                navigation.reset({ index: 0, routes: [{ name: "Home" }] });
              },
            },
          ]
        );
      } else if (user) {
        await submitInfluencerRequest(user.user_id);
        Alert.alert(
          "Application Submitted",
          "Thank you for your application. Our team will review it and contact you shortly.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({ index: 0, routes: [{ name: "Home" }] });
              },
            },
          ]
        );
      } else {
        throw new Error("No user data available");
      }
    } catch (error) {
      console.error("Error submitting influencer application:", error);
      Alert.alert("Error", "Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicPadding = isSignupFlow
  ? (Platform.OS === "ios" ? 80 : 100)
  : 0;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Custom header only in signup flow */}
      {isSignupFlow && (
        <Animated.View
          style={[
            styles.headerContainer,
            {paddingTop: insets.top,
              height: 60 + insets.top },
          ]}
        >
          <View style={styles.customHeader}>
            <View style={styles.headerLeft}>
              <Image
                source={require("../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Influencer Application
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={[
            styles.contentContainer, 
            { paddingTop: dynamicPadding }
          ]}
          // scrollEventThrottle={16}
          // onScroll={Animated.event(
          //   [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          //   { useNativeDriver: true }
          // )}
        >
          <View
            style={[styles.formContainer, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {" "}
              {pendingSignup
                ? "Become an Influencer"
                : "Become an Influencer"}
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.subtitle }]}>
              {" "}
              {tier} Application
            </Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Full Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.fullName ? "#ff4d4f" : colors.border,
                    backgroundColor: colors.inputBackground || "#f9fafb",
                    color: colors.text,
                  },
                ]}
                placeholderTextColor={colors.placeholder || "#a0aec0"}
                value={formData.fullName}
                onChangeText={(val) => updateFormField("fullName", val)}
              />
              {!!errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Email *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.email ? "#ff4d4f" : colors.border,
                    backgroundColor: colors.inputBackground || "#f9fafb",
                    color: colors.text,
                  },
                ]}
                placeholderTextColor={colors.placeholder || "#a0aec0"}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(val) => updateFormField("email", val)}
              />
              {!!errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Phone Number *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.phone ? "#ff4d4f" : colors.border,
                    backgroundColor: colors.inputBackground || "#f9fafb",
                    color: colors.text,
                  },
                ]}
                placeholderTextColor={colors.placeholder || "#a0aec0"}
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(val) => updateFormField("phone", val)}
              />
              {!!errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Social Media Handles */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Social Media Handles *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.socialMediaHandles
                      ? "#ff4d4f"
                      : colors.border,
                    backgroundColor: colors.inputBackground || "#f9fafb",
                    color: colors.text,
                    height: 80,
                    textAlignVertical: "top",
                  },
                ]}
                placeholderTextColor={colors.placeholder || "#a0aec0"}
                placeholder="Instagram: @username\nTikTok: @username\nYouTube: channel_name"
                multiline
                value={formData.socialMediaHandles}
                onChangeText={(val) =>
                  updateFormField("socialMediaHandles", val)
                }
              />
              {!!errors.socialMediaHandles && (
                <Text style={styles.errorText}>
                  {errors.socialMediaHandles}
                </Text>
              )}
            </View>

            {/* Followers */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Approximate Followers per Platform *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.followers ? "#ff4d4f" : colors.border,
                    backgroundColor: colors.inputBackground || "#f9fafb",
                    color: colors.text,
                    height: 80,
                    textAlignVertical: "top",
                  },
                ]}
                placeholderTextColor={colors.placeholder || "#a0aec0"}
                placeholder="Instagram: 10K\nTikTok: 15K\nYouTube: 5K"
                multiline
                value={formData.followers}
                onChangeText={(val) => updateFormField("followers", val)}
              />
              {!!errors.followers && (
                <Text style={styles.errorText}>{errors.followers}</Text>
              )}
            </View>

            {/* Why Collaborate */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Why do you want to collaborate with us? *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.whyCollaborate
                      ? "#ff4d4f"
                      : colors.border,
                    backgroundColor: colors.inputBackground || "#f9fafb",
                    color: colors.text,
                    height: 100,
                    textAlignVertical: "top",
                  },
                ]}
                placeholderTextColor={colors.placeholder || "#a0aec0"}
                placeholder="Tell us why you're interested in our brand and how you believe you can add value."
                multiline
                value={formData.whyCollaborate}
                onChangeText={(val) => updateFormField("whyCollaborate", val)}
              />
              {!!errors.whyCollaborate && (
                <Text style={styles.errorText}>{errors.whyCollaborate}</Text>
              )}
            </View>

            {/* Prior Experience */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Prior Experience with Brand Collaborations
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground || "#f9fafb",
                    color: colors.text,
                    height: 100,
                    textAlignVertical: "top",
                  },
                ]}
                placeholderTextColor={colors.placeholder || "#a0aec0"}
                placeholder="Tell us about your previous work with brands (if any)."
                multiline
                value={formData.priorExperience}
                onChangeText={(val) => updateFormField("priorExperience", val)}
              />
            </View>

            {/* Preferred Contact Method */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Preferred Method of Contact *
              </Text>
              <View style={styles.contactMethodsContainer}>
                <TouchableOpacity
                  style={[
                    styles.contactMethodButton,
                    formData.preferredContact === "email" && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => updateFormField("preferredContact", "email")}
                >
                  <Ionicons
                    name="mail"
                    size={18}
                    color={
                      formData.preferredContact === "email"
                        ? "#fff"
                        : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.contactMethodText,
                      {
                        color:
                          formData.preferredContact === "email"
                            ? "#fff"
                            : colors.text,
                      },
                    ]}
                  >
                    Email
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.contactMethodButton,
                    formData.preferredContact === "phone" && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => updateFormField("preferredContact", "phone")}
                >
                  <Ionicons
                    name="call"
                    size={18}
                    color={
                      formData.preferredContact === "phone"
                        ? "#fff"
                        : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.contactMethodText,
                      {
                        color:
                          formData.preferredContact === "phone"
                            ? "#fff"
                            : colors.text,
                      },
                    ]}
                  >
                    Phone
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.contactMethodButton,
                    formData.preferredContact === "message" && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => updateFormField("preferredContact", "message")}
                >
                  <Ionicons
                    name="chatbubble"
                    size={18}
                    color={
                      formData.preferredContact === "message"
                        ? "#fff"
                        : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.contactMethodText,
                      {
                        color:
                          formData.preferredContact === "message"
                            ? "#fff"
                            : colors.text,
                      },
                    ]}
                  >
                    Message
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Agreement */}
            <View style={styles.termsContainer}>
              <Switch
                value={formData.agreeTerms}
                onValueChange={(val) => updateFormField("agreeTerms", val)}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={formData.agreeTerms ? "#fff" : "#f4f3f4"}
              />
              <Text
                style={[
                  styles.termsText,
                  { color: colors.text },
                  errors.agreeTerms && { color: "#ff4d4f" },
                ]}
              >
                I agree to the terms and conditions of the influencer program *
              </Text>
            </View>
            {!!errors.agreeTerms && (
              <Text style={styles.errorText}>{errors.agreeTerms}</Text>
            )}

            {/* Admin review notice */}
            <View style={styles.noticeContainer}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.noticeText, { color: colors.subtitle }]}>
                Your application will be reviewed by our admin team before
                approval.
                {tier !== "Starter Tier"
                  ? " Paid tiers require additional verification."
                  : ""}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    Submit Application
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.disclaimerText, { color: colors.subtitle }]}>
              * Required fields. Your application will be reviewed by our team.
              You'll receive a notification once a decision has been made.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 4,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
  },
  headerLeft: { flex: 1, alignItems: "flex-start" },
  headerCenter: { flex: 2, alignItems: "center" },
  headerRight: { flex: 1, alignItems: "flex-end" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  logo: { height: 100, width: 100 },
  formContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  formSubtitle: { fontSize: 14, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: { color: "#ff4d4f", fontSize: 14, marginTop: 4 },
  contactMethodsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  contactMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  contactMethodText: { marginLeft: 6, fontSize: 14, fontWeight: "500" },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  termsText: { marginLeft: 8, fontSize: 14, flex: 1 },
  noticeContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  noticeText: { fontSize: 14, marginLeft: 8, flex: 1, lineHeight: 20 },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  disclaimerText: { fontSize: 12, lineHeight: 18, textAlign: "center" },
});

export default InfluencerFormScreen;
