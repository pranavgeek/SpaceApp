// SignUpScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";

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

  // Allowed static credentials
  const allowedEmail = "buyer@example.com";
  const allowedPhone = "1234567890";
  const allowedPassword = "password123";

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email/phone and password.");
      return;
    }
    if (email === allowedEmail || email === allowedPhone) {
      if (password === allowedPassword) {
        // Successful login as Buyer (default)
        const user = {
          name: "Test Buyer",
          email: email,
          role: "buyer",
        };
        login(user);
      } else {
        Alert.alert("Incorrect Password", "The password you entered is incorrect.");
      }
    } else {
      Alert.alert(
        "User Not Found",
        "No user found with that email/phone. Redirecting to registration.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Register"),
          },
        ]
      );
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to My Space App</Text>

      {!isForgotPassword ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email or Phone"
            placeholderTextColor={colors.subtitle}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.subtitle}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsForgotPassword(true)}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
          <Text style={styles.note}>
            Default account is Buyer. You can switch to Seller or Influencer from
            Settings.
          </Text>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter your Email or Phone"
            placeholderTextColor={colors.subtitle}
            value={forgotEmail}
            onChangeText={setForgotEmail}
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={styles.buttonText}>Reset Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsForgotPassword(false)}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: colors.text,
    },
    input: {
      width: "100%",
      height: 50,
      borderWidth: 1,
      borderColor: colors.subtitle,
      borderRadius: 8,
      paddingHorizontal: 10,
      marginBottom: 15,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      marginBottom: 20,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    note: {
      fontSize: 14,
      color: colors.subtitle,
      textAlign: "center",
    },
    linkText: {
      fontSize: 16,
      color: colors.primary,
      marginBottom: 10,
    },
  });

export default SignUpScreen;
