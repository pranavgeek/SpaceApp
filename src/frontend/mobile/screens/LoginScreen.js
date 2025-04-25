import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { useForgetPassword } from "../context/ForgetPasswordContext";
import { Ionicons } from "@expo/vector-icons";
import { createUser } from "../backend/db/API";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { login } = useAuth();
  const {
    currentStep,
    email: forgotEmail,
    otp,
    newPassword,
    confirmPassword,
    isLoading: fpLoading,
    setEmail: setForgotEmail,
    setOtp,
    setNewPassword,
    setConfirmPassword,
    goToStep,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    resetState,
  } = useForgetPassword();

  // State to track whether we're in login or signup mode
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [signupAccountType, setSignupAccountType] = useState("buyer");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Animation values
  const cardSlide = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Account type selection
  const [selectedAccountType, setSelectedAccountType] = useState("buyer");

  // Signup states
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmSignupPassword, setConfirmSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const strengthBarWidth = useRef(new Animated.Value(0)).current;

  // Reset password flow when returning to login
  useEffect(() => {
    if (currentStep === "login" && !isSignupMode) {
      resetState();
    }
  }, [currentStep, isSignupMode, resetState]);

  const accountTypes = [
    {
      id: "buyer",
      label: "Buyer",
      icon: "person",
      description: "Shop products and follow influencers",
    },
    {
      id: "seller",
      label: "Seller",
      icon: "cart",
      description: "List products and manage sales",
    },
    {
      id: "influencer",
      label: "Influencer",
      icon: "star",
      description: "Promote products and earn commissions",
    },
  ];

  // Add this function to toggle the dropdown
  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  // Add this function to select an account type
  const selectAccountType = (type) => {
    setSignupAccountType(type);
    setDropdownVisible(false);
  };

  // // Add this function to toggle admin mode
  // const toggleAdminMode = () => {
  //   setIsAdminMode(!isAdminMode);
  //   // Reset selected account type when switching to/from admin mode
  //   if (!isAdminMode) {
  //     setSelectedAccountType("admin");
  //   } else {
  //     setSelectedAccountType("buyer");
  //   }
  // };

  // Toggle between login and signup
  const toggleMode = () => {
    // Fade out current form
    Animated.timing(formOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    // Scale down card
    Animated.timing(cardScale, {
      toValue: 0.95,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Slide card out
    Animated.timing(cardSlide, {
      toValue: isSignupMode ? 0 : 1, // Slide right for signup, left for login
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      // Switch mode after animation completes
      setIsSignupMode(!isSignupMode);

      // Reset fields if going back to login
      if (isSignupMode) {
        setSignupName("");
        setSignupEmail("");
        setSignupPassword("");
        setConfirmSignupPassword("");
        setPasswordStrength(0);
      }

      // Slide card back in from opposite side
      cardSlide.setValue(isSignupMode ? -1 : 0);
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();

      // Scale card back up
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 200,
        delay: 100,
        useNativeDriver: true,
      }).start();

      // Fade in new form
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 250,
        delay: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Calculate password strength when password changes
  useEffect(() => {
    let strength = 0;

    if (signupPassword.length > 0) {
      // Start with 20% for having any password
      strength += 20;

      // Add 20% for length > 8
      if (signupPassword.length >= 8) strength += 20;

      // Add 20% for having uppercase
      if (/[A-Z]/.test(signupPassword)) strength += 20;

      // Add 20% for having numbers
      if (/\d/.test(signupPassword)) strength += 20;

      // Add 20% for having special characters
      if (/[^A-Za-z0-9]/.test(signupPassword)) strength += 20;
    }

    setPasswordStrength(strength);

    Animated.timing(strengthBarWidth, {
      toValue: strength,
      duration: 500,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [signupPassword]);

  const getStrengthColor = () => {
    if (passwordStrength < 40) return "#ef4444"; // Red
    if (passwordStrength < 80) return "#f59e0b"; // Amber
    return "#10b981"; // Green
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return "Weak";
    if (passwordStrength < 80) return "Medium";
    return "Strong";
  };

  // Handle account type selection
  const handleAccountTypeSelection = async (type) => {
    setSelectedAccountType(type);
    // Store the selected account type in AsyncStorage
    await AsyncStorage.setItem("userRole", type);
    // console.log(`Selected account type: ${type}`);
  };

  // Handle login with your existing AuthContext
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      // First check if these are admin credentials using a simple email check
      // Adjust this based on your admin email pattern
      const possibleAdminEmail =
        email.includes("admin") || email.endsWith("@admin.com");

      if (possibleAdminEmail) {
        // Only allow admin login with buyer account type selected
        if (selectedAccountType !== "buyer") {
          Alert.alert(
            "Invalid Selection",
            "Admin accounts can only log in with Buyer account type selected."
          );
          setIsLoading(false);
          return;
        }

        try {
          // Try admin login
          console.log("Attempting admin login");
          await AsyncStorage.setItem("userRole", "admin");
          await login(email, password, true); // Pass admin flag
          console.log("Admin login successful");
          return; // Exit function on success
        } catch (adminError) {
          console.log("Admin login failed, trying regular login:", adminError);
          // If admin login fails, continue to regular login attempt
        }
      }

      // Regular login attempt
      console.log(`Attempting to login as: ${selectedAccountType}`);
      await AsyncStorage.setItem("userRole", selectedAccountType);
      await login(email, password);
      console.log(`Login successful as ${selectedAccountType}`);
    } catch (error) {
      console.error("Login error:", error);

      // Special handling for admin account error
      if (error.message && error.message.includes("registered as a admin")) {
        // This means it's an admin account but we tried to log in as regular user
        if (selectedAccountType !== "buyer") {
          Alert.alert(
            "Invalid Selection",
            "Admin accounts can only log in with Buyer account type selected."
          );
        } else {
          try {
            console.log("Detected admin account, trying admin login path");
            await AsyncStorage.setItem("userRole", "admin");
            await login(email, password, true); // Retry with admin flag
            console.log("Admin login successful after retry");
          } catch (retryError) {
            console.error("Admin login retry failed:", retryError);
            Alert.alert(
              "Login Failed",
              "Could not authenticate with the provided credentials."
            );
          }
        }
      } else {
        Alert.alert("Login Failed", error.message || "Invalid credentials");
      }
    } finally {
      setIsLoading(false);
    }
  };

// Modified handleSignUp with direct navigation
const handleSignUp = async () => {
  // Validate form
  if (!signupName.trim()) {
    Alert.alert("Error", "Please enter your name");
    return;
  }

  if (!signupEmail.trim()) {
    Alert.alert("Error", "Please enter your email");
    return;
  }

  if (!signupEmail.includes('@')) {
    Alert.alert("Error", "Please enter a valid email address");
    return;
  }

  if (!signupPassword) {
    Alert.alert("Error", "Please enter a password");
    return;
  }

  if (signupPassword !== confirmSignupPassword) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  // Check password strength
  if (passwordStrength < 40) {
    Alert.alert(
      "Weak Password",
      "Please create a stronger password with at least 8 characters, including uppercase letters, numbers, and special characters."
    );
    return;
  }

  setIsSignupLoading(true);

  try {
    // For influencer accounts, create a temporary account first then redirect to program screen
    if (signupAccountType === "influencer") {
      // Save signup data to AsyncStorage for later use
      const signupData = {
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        accountType: signupAccountType
      };
      await AsyncStorage.setItem("pendingInfluencerSignup", JSON.stringify(signupData));

      // Show success message
      Alert.alert(
        "Almost Done!",
        "Please complete the influencer program application to finish creating your account.",
        [
          { 
            text: "Continue", 
            onPress: () => {
              setIsSignupLoading(false);
              // Navigate to influencer program
              navigation.navigate("Influencer Program");
            }
          }
        ]
      );
      return;
    }

    // Regular account creation for buyer/seller
    const userData = {
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      account_type:
        signupAccountType.charAt(0).toUpperCase() +
        signupAccountType.slice(1), // Capitalize first letter
      role: signupAccountType.toLowerCase(),
      about_us: "",
      address: "",
      city: "",
      country: "",
      social_media_x: "",
      social_media_linkedin: "",
      social_media_website: "",
      profile_image: "default_profile.jpg",
      gender: "",
      age: null,
      is_two_factor_enabled: false,
      phone_number: "",
      is_private_account: false,
      privacy_settings: {
        hideActivity: false,
        hideContacts: false,
        hideProducts: false,
        allowMessagesFrom: "everyone",
      },
    };

    // Create user in backend
    const newUser = await createUser(userData);
    console.log("User created successfully:", JSON.stringify({
      user_id: newUser.user_id,
      email: newUser.email,
      account_type: newUser.account_type,
      role: newUser.role
    }));

    // Store the user data in AsyncStorage
    // Store the complete user object to access directly
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    await AsyncStorage.setItem("userRole", signupAccountType);
    
    // Set as logged in - directly in AsyncStorage
    await AsyncStorage.setItem("isLoggedIn", "true");

    // Clear loading state
    setIsSignupLoading(false);

    // Show success message
    Alert.alert(
      "Account Created Successfully",
      `Your ${signupAccountType} account has been created.`,
      [{ 
        text: "Continue to Dashboard", 
        onPress: () => {
          // Directly navigate to the appropriate dashboard based on account type
          if (signupAccountType === "seller") {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } else {
            // Default to Home/BuyerDashboard
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        }
      }]
    );
  } catch (error) {
    setIsSignupLoading(false);
    Alert.alert(
      "Sign Up Failed",
      error.message || "Could not create account. Please try again."
    );
  }
};

  // Card slide animation
  const translateX = cardSlide.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [
      -Dimensions.get("window").width,
      0,
      Dimensions.get("window").width,
    ],
  });

  // const renderAdminLoginButton = () => (
  //   <TouchableOpacity style={styles.adminModeButton} onPress={toggleAdminMode}>
  //     <Text style={styles.adminModeText}>
  //       {isAdminMode ? "Back to User Login" : "Admin Login"}
  //     </Text>
  //   </TouchableOpacity>
  // );

  // Add this component for the account type dropdown
  const renderAccountTypeDropdown = () => {
    // Find the currently selected account type
    const selectedAccount = accountTypes.find(
      (type) => type.id === signupAccountType
    );

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={toggleDropdown}
          activeOpacity={0.7}
        >
          <View style={styles.selectedAccountContainer}>
            <Ionicons
              name={selectedAccount.icon}
              size={20}
              color={colors.primary}
              style={styles.accountTypeIcon}
            />
            <View style={styles.accountTypeTextContainer}>
              <Text style={styles.selectedAccountText}>
                {selectedAccount.label}
              </Text>
              <Text style={styles.accountTypeDescription}>
                {selectedAccount.description}
              </Text>
            </View>
          </View>
          <Ionicons
            name={dropdownVisible ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.subtitle}
          />
        </TouchableOpacity>

        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View
              style={[
                styles.dropdownListContainer,
                {
                  top: Platform.OS === "ios" ? 250 : 220, // Adjust based on your layout
                },
              ]}
            >
              <FlatList
                data={accountTypes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      signupAccountType === item.id &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => selectAccountType(item.id)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={
                        signupAccountType === item.id ? "#fff" : colors.primary
                      }
                      style={styles.dropdownItemIcon}
                    />
                    <View style={styles.dropdownItemContent}>
                      <Text
                        style={[
                          styles.dropdownItemLabel,
                          signupAccountType === item.id &&
                            styles.dropdownItemLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.dropdownItemDescription,
                          signupAccountType === item.id &&
                            styles.dropdownItemDescriptionSelected,
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>
                    {signupAccountType === item.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color="#fff"
                        style={styles.dropdownItemCheck}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  // Render account type selection buttons
  const renderAccountTypeButtons = () => (
    <View style={styles.accountTypeContainer}>
      <View style={styles.accountButtonsRow}>
        <TouchableOpacity
          style={[
            styles.accountTypeButton,
            selectedAccountType === "buyer" && styles.selectedAccountTypeButton,
          ]}
          onPress={() => handleAccountTypeSelection("buyer")}
        >
          <Ionicons
            name="person"
            size={18}
            color={selectedAccountType === "buyer" ? "#fff" : colors.primary}
          />
          <Text
            style={[
              styles.accountTypeText,
              selectedAccountType === "buyer" && styles.selectedAccountTypeText,
            ]}
          >
            Buyer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.accountTypeButton,
            selectedAccountType === "seller" &&
              styles.selectedAccountTypeButton,
          ]}
          onPress={() => handleAccountTypeSelection("seller")}
        >
          <Ionicons
            name="cart"
            size={18}
            color={selectedAccountType === "seller" ? "#fff" : colors.primary}
          />
          <Text
            style={[
              styles.accountTypeText,
              selectedAccountType === "seller" &&
                styles.selectedAccountTypeText,
            ]}
          >
            Seller
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.accountTypeButton,
            selectedAccountType === "influencer" &&
              styles.selectedAccountTypeButton,
          ]}
          onPress={() => handleAccountTypeSelection("influencer")}
        >
          <Ionicons
            name="star"
            size={18}
            color={
              selectedAccountType === "influencer" ? "#fff" : colors.primary
            }
          />
          <Text
            style={[
              styles.accountTypeText,
              selectedAccountType === "influencer" &&
                styles.selectedAccountTypeText,
            ]}
          >
            Influencer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoginForm = () => (
    <Animated.View style={{ opacity: formOpacity }}>
      {!isAdminMode ? (
        // Show account type selection buttons for regular users
        renderAccountTypeButtons()
      ) : (
        // Show admin login header
        <View style={styles.adminLoginHeader}>
          <Ionicons name="shield" size={28} color={colors.primary} />
          <Text style={styles.adminLoginText}>Administrator Login</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.subtitle}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.subtitle}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.subtitle}
          />
        </TouchableOpacity>
      </View>

      {!isAdminMode && (
        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={() => {
            console.log("Going to forgot password email screen");
            goToStep("email");
          }}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          isAdminMode && styles.adminLoginButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={handleLogin}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isAdminMode ? "Admin Login" : "Login"}
          </Text>
        )}
      </TouchableOpacity>

      {/* {renderAdminLoginButton()} */}

      {/* <View style={styles.socialButtonsContainer}>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: "#4267B2" }]}
        >
          <Ionicons name="logo-facebook" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: "#DB4437" }]}
        >
          <Ionicons name="logo-google" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.socialButton, { backgroundColor: "#000000" }]}
        >
          <Ionicons name="logo-apple" size={24} color="#fff" />
        </TouchableOpacity>
      </View> */}
    </Animated.View>
  );

  const renderSignupForm = () => (
    <Animated.View style={{ opacity: formOpacity }}>
      {/* Name Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="person-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={colors.subtitle}
          value={signupName}
          onChangeText={setSignupName}
        />
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor={colors.subtitle}
          value={signupEmail}
          onChangeText={setSignupEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Custom Account Type Dropdown */}
      {renderAccountTypeDropdown()}

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.subtitle}
          secureTextEntry={!showSignupPassword}
          value={signupPassword}
          onChangeText={setSignupPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowSignupPassword(!showSignupPassword)}
        >
          <Ionicons
            name={showSignupPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.subtitle}
          />
        </TouchableOpacity>
      </View>

      {/* Password Strength Indicator */}
      {signupPassword.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBar}>
            <Animated.View
              style={[
                styles.strengthIndicator,
                {
                  width: strengthBarWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                  backgroundColor: getStrengthColor(),
                },
              ]}
            />
          </View>
          <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
            {getStrengthText()} Password
          </Text>
        </View>
      )}

      {/* Confirm Password Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.subtitle}
          secureTextEntry={!showConfirmPassword}
          value={confirmSignupPassword}
          onChangeText={setConfirmSignupPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.subtitle}
          />
        </TouchableOpacity>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[styles.button, isSignupLoading && styles.disabledButton]}
        onPress={handleSignUp}
        activeOpacity={0.8}
        disabled={isSignupLoading}
      >
        {isSignupLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      {/* Terms and Conditions */}
      <Text style={styles.termsText}>
        By signing up, you agree to our{" "}
        <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </Animated.View>
  );

  // Original forgot password handlers
  const renderForgotEmailForm = () => (
    <>
      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your Email"
          placeholderTextColor={colors.subtitle}
          value={forgotEmail}
          onChangeText={setForgotEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, fpLoading && styles.disabledButton]}
        onPress={handleSendOtp}
        activeOpacity={0.8}
        disabled={fpLoading}
      >
        {fpLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backToLoginButton}
        onPress={() => {
          console.log("Going back to login");
          goToStep("login");
        }}
      >
        <Ionicons name="arrow-back-outline" size={20} color={colors.primary} />
        <Text style={styles.backToLoginText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  const renderOtpVerificationForm = () => {
    console.log("Rendering OTP verification form with email:", forgotEmail);
    return (
      <>
        <Text style={styles.resetStepText}>
          Please enter the 6-digit code sent to {forgotEmail}
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color={colors.subtitle}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            placeholderTextColor={colors.subtitle}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.button, fpLoading && styles.disabledButton]}
          onPress={handleVerifyOtp}
          activeOpacity={0.8}
          disabled={fpLoading}
        >
          {fpLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.otpHelpContainer}>
          <Text style={styles.otpHelpText}>Didn't receive the code?</Text>
          <TouchableOpacity onPress={handleSendOtp}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backToLoginButton}
          onPress={() => {
            console.log("Going back to email form");
            goToStep("email");
          }}
        >
          <Ionicons
            name="arrow-back-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.backToLoginText}>Back</Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderResetPasswordForm = () => (
    <>
      <Text style={styles.resetStepText}>
        Create a new password for your account
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={colors.subtitle}
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          autoCapitalize="none"
          autoFocus
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.subtitle}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.subtitle}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.subtitle}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.subtitle}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, fpLoading && styles.disabledButton]}
        onPress={handleResetPassword}
        activeOpacity={0.8}
        disabled={fpLoading}
      >
        {fpLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backToLoginButton}
        onPress={() => {
          console.log("Going back to OTP verification");
          goToStep("otp");
        }}
      >
        <Ionicons name="arrow-back-outline" size={20} color={colors.primary} />
        <Text style={styles.backToLoginText}>Back</Text>
      </TouchableOpacity>
    </>
  );

  // Function to determine which content to show based on current step
  const renderContent = () => {
    // If we're in signup mode, show signup form
    if (isSignupMode && currentStep === "login") {
      return renderSignupForm();
    }

    // Otherwise, continue with original flow
    switch (currentStep) {
      case "email":
        return renderForgotEmailForm();
      case "otp":
        return renderOtpVerificationForm();
      case "newPassword":
        return renderResetPasswordForm();
      default:
        return renderLoginForm();
    }
  };

  const getTitle = () => {
    if (isSignupMode && currentStep === "login") {
      return "Create Account";
    }

    switch (currentStep) {
      case "email":
        return "Reset Password";
      case "otp":
        return "Verify OTP";
      case "newPassword":
        return "Create New Password";
      default:
        return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    if (isSignupMode && currentStep === "login") {
      return "Default account is Buyer. You can switch to Seller or Influencer from Settings.";
    }

    switch (currentStep) {
      case "email":
        return "Enter your email to receive a verification code";
      case "otp":
        return "Enter the code we sent to your email";
      case "newPassword":
        return "Create a strong password for your account";
      default:
        return "Choose your account type and log in";
    }
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ translateX }, { scale: cardScale }],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>

              {renderContent()}
            </Animated.View>

            {currentStep === "login" && (
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  {isSignupMode
                    ? "Already have an account?"
                    : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={styles.signupLink}>
                    {isSignupMode ? "Login" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.1)",
      padding: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 20,
      width: "100%",
      maxWidth: 400,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 8,
    },
    logoContainer: {
      alignItems: "center",
    },
    logo: {
      width: 120,
      height: 120,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 12,
      color: colors.subtitle,
      marginBottom: 24,
      textAlign: "center",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f9fafb",
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      height: 45,
      borderWidth: 1,
      borderColor: "#f1f5f9",
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      marginLeft: 12,
    },
    inputIcon: {
      width: 24,
      textAlign: "center",
    },
    eyeIcon: {
      padding: 8,
    },
    forgotPasswordLink: {
      alignSelf: "flex-end",
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    button: {
      backgroundColor: colors.primary,
      height: 56,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    disabledButton: {
      backgroundColor: colors.primary + "80", // Add transparency
    },
    buttonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    signupContainer: {
      flexDirection: "row",
      marginTop: 20,
      alignItems: "center",
    },
    signupText: {
      color: "#f8fafc",
      fontSize: 16,
    },
    signupLink: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
      marginLeft: 4,
    },
    strengthContainer: {
      marginBottom: 16,
    },
    strengthBar: {
      height: 6,
      width: "100%",
      backgroundColor: "#e2e8f0",
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 8,
    },
    strengthIndicator: {
      height: 6,
      width: "0%",
      borderRadius: 3,
    },
    strengthText: {
      textAlign: "right",
      fontSize: 14,
      fontWeight: "500",
    },
    termsText: {
      fontSize: 12,
      color: colors.subtitle,
      textAlign: "center",
      marginTop: 8,
    },
    termsLink: {
      color: colors.primary,
      fontWeight: "600",
    },
    resetStepText: {
      fontSize: 16,
      color: colors.subtitle,
      marginBottom: 20,
      textAlign: "center",
    },
    otpHelpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 20,
      marginBottom: 20,
    },
    otpHelpText: {
      color: colors.subtitle,
      fontSize: 14,
    },
    resendText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
      marginLeft: 4,
    },
    backToLoginButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },
    backToLoginText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
      marginLeft: 4,
    },
    // Account type selection styles
    accountTypeContainer: {
      marginBottom: 20,
    },
    accountTypeLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 12,
      textAlign: "center",
    },
    accountButtonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    accountTypeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderRadius: 10,
      marginHorizontal: 5,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: "transparent",
    },
    selectedAccountTypeButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    accountTypeText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 13,
      marginLeft: 6,
    },
    selectedAccountTypeText: {
      color: "#ffffff",
    },
    adminModeButton: {
      alignSelf: "center",
      marginTop: 16,
      marginBottom: 8,
      padding: 8,
    },
    adminModeText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    adminLoginHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      padding: 12,
      backgroundColor: "#f8fafc",
      borderRadius: 12,
    },
    adminLoginText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.primary,
      marginLeft: 8,
    },
    adminLoginButton: {
      backgroundColor: "#475569", // Different color for admin login
    },
    dropdownContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f9fafb",
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      minHeight: 56,
      borderWidth: 1,
      borderColor: "#f1f5f9",
    },
    dropdownSelector: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      marginLeft: 12,
    },
    selectedAccountContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    selectedAccountText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    accountTypeIcon: {
      marginRight: 14,
      marginLeft: -10,
    },
    accountTypeTextContainer: {
      flex: 1,
    },
    accountTypeDescription: {
      fontSize: 12,
      color: colors.subtitle,
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    dropdownListContainer: {
      position: "absolute",
      left: 20,
      right: 20,
      backgroundColor: "#fff",
      borderRadius: 12,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    },
    dropdownItemSelected: {
      backgroundColor: colors.primary,
    },
    dropdownItemIcon: {
      marginRight: 12,
    },
    dropdownItemContent: {
      flex: 1,
    },
    dropdownItemLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    dropdownItemLabelSelected: {
      color: "#fff",
    },
    dropdownItemDescription: {
      fontSize: 12,
      color: colors.subtitle,
      marginTop: 2,
    },
    dropdownItemDescriptionSelected: {
      color: "rgba(255, 255, 255, 0.8)",
    },
    dropdownItemCheck: {
      marginLeft: 8,
    },
  });

export default LoginScreen;
