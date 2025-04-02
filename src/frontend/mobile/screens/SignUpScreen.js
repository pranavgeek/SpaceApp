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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Space App</Text>

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
            Default account is Buyer. You can switch to Seller or Influencer from Settings.
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

export default SignUpScreen;

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
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
      height: 40,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 10,
      marginBottom: 10,
      color: colors.text,
    },
    button: {
      width: "100%",
      height: 40,
      backgroundColor: colors.primary,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    buttonText: {
      color: colors.buttonText,
      fontWeight: "bold",
    },
    linkText: {
      color: colors.link,
      textDecorationLine: "underline",
      marginBottom: 10,
    },
    note: {
      fontSize: 12,
      color: colors.subtitle,
      textAlign: "center",
    },
  });
