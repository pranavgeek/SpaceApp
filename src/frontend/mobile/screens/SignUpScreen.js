import React, { useState } from "react";
import {
  View,
  Text,
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
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { useForgetPassword } from "../context/ForgetPasswordContext";
import { Ionicons } from "@expo/vector-icons";

const SignUpScreen = ({ navigation }) => {
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
  } = useForgetPassword();

  // States for login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Loading state for login
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    }
  };

  // Debug log for current step
  console.log("Current step:", currentStep);

  const renderLoginForm = () => (
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
          placeholder="Email or Phone"
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

      <TouchableOpacity
        style={styles.forgotPasswordLink}
        onPress={() => {
          console.log("Going to forgot password email screen");
          goToStep("email");
        }}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or login with</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialButtonsContainer}>
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
      </View>

      <Text style={styles.note}>
        Default account is Buyer. You can switch to Seller or Influencer from
        Settings.
      </Text>
    </>
  );

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
          secureTextEntry={!showNewPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          autoCapitalize="none"
          autoFocus
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          <Ionicons
            name={showNewPassword ? "eye-off-outline" : "eye-outline"}
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
    console.log("Rendering content for step:", currentStep);
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
    switch (currentStep) {
      case "email":
        return "Enter your email to receive a verification code";
      case "otp":
        return "Enter the code we sent to your email";
      case "newPassword":
        return "Create a strong password for your account";
      default:
        return "Login to continue your journey";
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
            <View style={styles.card}>
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
            </View>

            {currentStep === "login" && (
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const { width, height } = Dimensions.get("window");

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    backgroundImage: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    container: {
      flex: 1,
      backgroundColor: colors.primary, // Use app's primary color for background
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
    },
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    card: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 30,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    },
    logoContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: 120,
      height: 120,
    },
    appName: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.primary,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: '#000',
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: "center",
      marginBottom: 30,
    },
    resetStepText: {
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: "#f8fafc",
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 50,
      color: '#000',
      fontSize: 16,
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
      fontSize: 14,
      fontWeight: "600",
    },
    button: {
      height: 54,
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    disabledButton: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: "#e2e8f0",
    },
    dividerText: {
      color: colors.subtitle,
      paddingHorizontal: 10,
      fontSize: 14,
    },
    socialButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 24,
      gap: 16,
    },
    socialButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    note: {
      fontSize: 13,
      color: colors.subtitle,
      textAlign: "center",
      lineHeight: 18,
    },
    backToLoginButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    backToLoginText: {
      color: colors.primary,
      marginLeft: 8,
      fontSize: 16,
      fontWeight: "600",
    },
    signupContainer: {
      flexDirection: "row",
      marginTop: 20,
      alignItems: "center",
    },
    signupText: {
      color: "#fff",
      fontSize: 14,
    },
    signupLink: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 14,
      marginLeft: 5,
      textDecorationLine: "underline",
    },
    otpHelpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 20,
    },
    otpHelpText: {
      color: colors.subtitle,
      fontSize: 14,
    },
    resendText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 5,
    },
  });

export default SignUpScreen;
