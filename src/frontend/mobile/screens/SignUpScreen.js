import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const SignUpScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const { login } = useAuth();

  // States for login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Toggle for forgot password view
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  // State for forgot password email
  const [forgotEmail, setForgotEmail] = useState("");
  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      // Since login is now corrected to use apiLogin within the context, use it here
      await login(email, password);
      // navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    }
  };

  const handleResetPassword = () => {
    if (!forgotEmail) {
      Alert.alert("Error", "Please enter your email or phone to reset your password.");
      return;
    }
    // For demonstration, simply show an alert.
    Alert.alert(
      "Reset Password",
      `Password reset instructions have been sent to ${forgotEmail}.`
    );
    // Optionally toggle back to login view:
    setIsForgotPassword(false);
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
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
                <View style={styles.logoCircle}>
                  <Ionicons name="planet-outline" size={40} color={colors.primary} />
                </View>
                <Text style={styles.appName}>Space App</Text>
              </View>
              
              <Text style={styles.title}>
                {!isForgotPassword ? "Welcome Back" : "Reset Password"}
              </Text>
              <Text style={styles.subtitle}>
                {!isForgotPassword 
                  ? "Login to continue your journey" 
                  : "We'll send you instructions to reset"}
              </Text>

              {!isForgotPassword ? (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={22} color={colors.subtitle} style={styles.inputIcon} />
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
                    <Ionicons name="lock-closed-outline" size={22} color={colors.subtitle} style={styles.inputIcon} />
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
                    onPress={() => setIsForgotPassword(true)}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleLogin}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Login</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or login with</Text>
                    <View style={styles.divider} />
                  </View>
                  
                  <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity style={[styles.socialButton, { backgroundColor: "#4267B2" }]}>
                      <Ionicons name="logo-facebook" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialButton, { backgroundColor: "#DB4437" }]}>
                      <Ionicons name="logo-google" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialButton, { backgroundColor: "#000000" }]}>
                      <Ionicons name="logo-apple" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.note}>
                    Default account is Buyer. You can switch to Seller or Influencer from Settings.
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={22} color={colors.subtitle} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your Email or Phone"
                      placeholderTextColor={colors.subtitle}
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleResetPassword}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Reset Password</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.backToLoginButton} 
                    onPress={() => setIsForgotPassword(false)}
                  >
                    <Ionicons name="arrow-back-outline" size={20} color={colors.primary} />
                    <Text style={styles.backToLoginText}>Back to Login</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {!isForgotPassword && (
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

const { width, height } = Dimensions.get('window');

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    container: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    logoCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    appName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.primary,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: 'center',
      marginBottom: 30,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: '#f8fafc',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 50,
      color: colors.text,
      fontSize: 16,
    },
    eyeIcon: {
      padding: 8,
    },
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    button: {
      height: 54,
      backgroundColor: colors.primary,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: '#e2e8f0',
    },
    dividerText: {
      color: colors.subtitle,
      paddingHorizontal: 10,
      fontSize: 14,
    },
    socialButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 24,
      gap: 16,
    },
    socialButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    note: {
      fontSize: 13,
      color: colors.subtitle,
      textAlign: 'center',
      lineHeight: 18,
    },
    backToLoginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    backToLoginText: {
      color: colors.primary,
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
    },
    signupContainer: {
      flexDirection: 'row',
      marginTop: 20,
      alignItems: 'center',
    },
    signupText: {
      color: '#fff',
      fontSize: 14,
    },
    signupLink: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
      marginLeft: 5,
      textDecorationLine: 'underline',
    },
  });

export default SignUpScreen;