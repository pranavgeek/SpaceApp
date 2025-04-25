import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BaseContainer from "../components/BaseContainer";
import ButtonMain from "../components/ButtonMain.js";
import { useTheme } from "../theme/ThemeContext.js";
import { useAuth } from "../context/AuthContext";
import {
  updatePassword,
  enableTwoFA,
  verifyTwoFACode,
  disableTwoFA,
  getUserSecuritySettings,
  updatePrivacySettings,
  deleteUser,
  requestVerificationCode,
} from "../backend/db/API"; // Import your backend API functions

const SecurityPrivacyScreen = () => {
  // Modal visibility states
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isTwoFAModalVisible, setTwoFAModalVisible] = useState(false);
  const [isCodeVerificationModalVisible, setCodeVerificationModalVisible] =
    useState(false);
  const [isPrivacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 2FA states
  const [isTwoFAEnabled, setTwoFAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeError, setCodeError] = useState("");
  const [verificationId, setVerificationId] = useState(null); // To track verification session

  // Privacy states
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    hideActivity: false,
    hideContacts: false,
    hideProducts: false,
    allowMessagesFrom: "everyone", // 'everyone', 'contacts', 'none'
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { colors, isDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const styles = getDynamicStyles(colors);

  const isBuyer = user && user.account_type === "Buyer";

  // Load user security settings from backend
  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      setIsLoading(true);
      // Make API call to get user's security settings
      const settings = await getUserSecuritySettings(user.user_id);

      // Update state with fetched settings
      setTwoFAEnabled(settings.twoFactorEnabled || false);
      setIsPrivateAccount(settings.isPrivate || false);
      setPrivacySettings({
        hideActivity: settings.privacySettings?.hideActivity || false,
        hideContacts: settings.privacySettings?.hideContacts || false,
        hideProducts: settings.privacySettings?.hideProducts || false,
        allowMessagesFrom:
          settings.privacySettings?.allowMessagesFrom || "everyone",
      });

      if (settings.phoneNumber) {
        setPhoneNumber(settings.phoneNumber);
      }

      console.log("Security settings loaded successfully");
    } catch (error) {
      console.error("Error loading security settings:", error);
      Alert.alert(
        "Error",
        "Failed to load security settings. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for resending verification code
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (!password) return 0;

    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    // Contains number
    if (/\d/.test(password)) strength += 1;
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    // Contains special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;

    return strength;
  };

  // Password Modal Handlers
  const handlePasswordChange = (text) => {
    setNewPassword(text);
    setPasswordStrength(checkPasswordStrength(text));
  };

  const handleSavePassword = async () => {
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (passwordStrength < 3) {
      setPasswordError(
        "Password is too weak. Include uppercase, lowercase, numbers and special characters."
      );
      return;
    }

    setIsSaving(true);

    try {
      // Call API to update password
      const response = await updatePassword(
        user.user_id,
        currentPassword,
        newPassword
      );

      if (response.success) {
        Alert.alert("Success", "Password has been updated successfully.");
        setPasswordModalVisible(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordStrength(0);
      } else {
        // Handle API error response
        setPasswordError(
          response.message ||
            "Failed to update password. Please check your current password."
        );
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError("An error occurred. Please try again later.");
    } finally {
      setIsSaving(false);
    }
  };

  // Two-Factor Authentication Handlers
  const handleTwoFAToggle = (value) => {
    if (value) {
      setTwoFAModalVisible(true);
    } else if (isTwoFAEnabled) {
      Alert.alert(
        "Disable 2FA",
        "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              setIsLoading(true);
              try {
                // Call API to disable 2FA
                const response = await disableTwoFA(user.user_id);

                if (response.success) {
                  setTwoFAEnabled(false);
                  Alert.alert(
                    "Two-Factor Authentication Disabled",
                    "Your account is now less secure."
                  );
                } else {
                  Alert.alert(
                    "Error",
                    response.message ||
                      "Failed to disable two-factor authentication."
                  );
                }
              } catch (error) {
                console.error("Error disabling 2FA:", error);
                Alert.alert(
                  "Error",
                  "An error occurred. Please try again later."
                );
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleEnableTwoFA = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }

    setIsVerifying(true);

    try {
      // Call API to send verification code
      const response = await requestVerificationCode(user.user_id, phoneNumber);

      if (response.success) {
        setVerificationId(response.verificationId); // Store verification ID for later validation
        setTwoFAModalVisible(false);
        setCodeVerificationModalVisible(true);
        setCountdown(60); // Set 60-second countdown for code resend
        Alert.alert(
          "Verification Code Sent",
          "A 6-digit code has been sent to your phone."
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to send verification code."
        );
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      Alert.alert("Error", "An error occurred. Please try again later.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsVerifying(true);

    try {
      // Call API to resend verification code
      const response = await requestVerificationCode(user.user_id, phoneNumber);

      if (response.success) {
        setVerificationId(response.verificationId);
        setCountdown(60);
        Alert.alert(
          "New Code Sent",
          "A new verification code has been sent to your phone."
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to send verification code."
        );
      }
    } catch (error) {
      console.error("Error resending verification code:", error);
      Alert.alert("Error", "An error occurred. Please try again later.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    setCodeError("");

    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setCodeError("Please enter a valid 6-digit verification code");
      return;
    }

    setIsVerifying(true);

    try {
      // Call API to verify code and enable 2FA
      const response = await verifyTwoFACode(
        user.user_id,
        verificationId,
        verificationCode,
        phoneNumber
      );

      if (response.success) {
        setTwoFAEnabled(true);
        setCodeVerificationModalVisible(false);
        setVerificationCode("");
        Alert.alert(
          "Success",
          "Two-Factor Authentication has been enabled successfully."
        );
      } else {
        setCodeError(
          response.message || "Invalid verification code. Please try again."
        );
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setCodeError("An error occurred. Please try again later.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Privacy settings handlers
  const handlePrivacyToggle = (value) => {
    if (value !== isPrivateAccount) {
      setIsPrivateAccount(value);

      if (value) {
        // Show privacy settings modal when enabling private account
        setPrivacyModalVisible(true);
      } else {
        // Update privacy settings in backend when disabling private account
        handleUpdatePrivacySettings({
          isPrivate: false,
          hideActivity: false,
          hideContacts: false,
          hideProducts: false,
          allowMessagesFrom: "everyone",
        });
      }
    }
  };

  const handleSavePrivacySettings = () => {
    // Prepare privacy settings object
    const settings = {
      isPrivate: true,
      ...privacySettings,
    };

    // Update privacy settings in backend
    handleUpdatePrivacySettings(settings);
  };

  const handleUpdatePrivacySettings = async (settings) => {
    setIsSaving(true);

    try {
      // Call API to update privacy settings
      const response = await updatePrivacySettings(user.user_id, settings);

      if (response.success) {
        setIsPrivateAccount(settings.isPrivate);
        setPrivacySettings({
          hideActivity: settings.hideActivity,
          hideContacts: settings.hideContacts,
          hideProducts: settings.hideProducts,
          allowMessagesFrom: settings.allowMessagesFrom,
        });

        setPrivacyModalVisible(false);
        Alert.alert(
          "Privacy Settings Updated",
          "Your account privacy settings have been updated."
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to update privacy settings."
        );
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      Alert.alert("Error", "An error occurred. Please try again later.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              // Updated to use deleteUser instead of deleteAccount
              const response = await deleteUser(user.user_id);
  
              if (response.success) {
                Alert.alert(
                  "Account Deleted",
                  "Your account has been permanently deleted.",
                  [{ text: "OK", onPress: () => logout() }]
                );
              } else {
                Alert.alert(
                  "Error",
                  response.message || "Failed to delete account."
                );
                setIsLoading(false);
              }
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                "An error occurred. Please try again later."
              );
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading security settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <BaseContainer
          title="Password and Security"
          subtitle="Manage your password, enable two-factor authentication, and control your privacy settings"
          titleIcon="shield-checkmark-outline"
          footer={
            <>
              <View style={styles.securitySection}>
                <Text style={styles.sectionTitle}>Account Security</Text>

                {/* 2FA Toggle */}
                <View style={styles.footerElement}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>
                      Two-Factor Authentication
                    </Text>
                    <Text style={styles.settingDescription}>
                      Add an extra layer of security to your account
                    </Text>
                  </View>
                  <Switch
                    value={isTwoFAEnabled}
                    onValueChange={handleTwoFAToggle}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary + "80",
                    }}
                    thumbColor={isTwoFAEnabled ? colors.primary : colors.card}
                    ios_backgroundColor={colors.border}
                  />
                </View>

                {isBuyer && (
                  <View style={styles.footerElement}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingLabel}>Private Account</Text>
                      <Text style={styles.settingDescription}>
                        Control who can see your activity and products
                      </Text>
                    </View>
                    <Switch
                      value={isPrivateAccount}
                      onValueChange={handlePrivacyToggle}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary + "80",
                      }}
                      thumbColor={
                        isPrivateAccount ? colors.primary : colors.card
                      }
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                )}
              </View>

              {/* Security Status */}
              <View style={styles.securityStatusContainer}>
                <Text style={styles.securityStatusTitle}>
                  Account Security Status
                </Text>
                <View style={styles.securityStatusBar}>
                  <View
                    style={[
                      styles.securityStatusFill,
                      {
                        width: `${(isTwoFAEnabled ? 50 : 0) + (isPrivateAccount ? 50 : 0)}%`,
                        backgroundColor:
                          isTwoFAEnabled && isPrivateAccount
                            ? "#10b981" // green if both enabled
                            : isTwoFAEnabled || isPrivateAccount
                              ? "#f59e0b" // yellow if one enabled
                              : "#ef4444", // red if none enabled
                      },
                    ]}
                  />
                </View>
                <Text style={styles.securityStatusText}>
                  {isTwoFAEnabled && isPrivateAccount
                    ? "Your account has strong protection"
                    : isTwoFAEnabled || isPrivateAccount
                      ? "Your account has medium protection"
                      : "Your account has weak protection"}
                </Text>
              </View>
            </>
          }
        >
          {/* Password Management */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="key-outline" size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Change Password</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.subtitle}
            />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Linking.openURL(
                "https://kspace-technologies.com/components/Legal/Termsandcondition"
              )
            }
          >
            <View style={styles.actionButtonContent}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.actionButtonText}>View Privacy Policy</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.subtitle}
            />
          </TouchableOpacity>

          {/* Terms of Service */}
          {/* <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Terms of Service', 'Redirecting to Terms of Service...')}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="reader-outline" size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtitle} />
          </TouchableOpacity> */}

          {/* Delete Account */}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <Text style={[styles.actionButtonText, { color: "#ef4444" }]}>
                Delete Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </BaseContainer>

        {/* Password Modal */}
        <Modal
          visible={isPasswordModalVisible}
          animationType="slide"
          transparent
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor={colors.subtitle}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />

              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor={colors.subtitle}
                secureTextEntry
                value={newPassword}
                onChangeText={handlePasswordChange}
              />

              {/* Password strength indicator */}
              {newPassword ? (
                <View style={styles.strengthContainer}>
                  <Text style={styles.strengthText}>
                    Password strength:
                    <Text
                      style={{
                        color:
                          passwordStrength <= 2
                            ? "#ef4444"
                            : passwordStrength <= 3
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    >
                      {" "}
                      {passwordStrength <= 2
                        ? "Weak"
                        : passwordStrength <= 3
                          ? "Medium"
                          : "Strong"}
                    </Text>
                  </Text>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${passwordStrength * 20}%`,
                          backgroundColor:
                            passwordStrength <= 2
                              ? "#ef4444"
                              : passwordStrength <= 3
                                ? "#f59e0b"
                                : "#10b981",
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.subtitle}
                secureTextEntry
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />

              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  isSaving && { opacity: 0.7 },
                ]}
                onPress={handleSavePassword}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Two-Factor Authentication Modal */}
        <Modal visible={isTwoFAModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Two-Factor Authentication</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setTwoFAModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Add an extra layer of security to your account. We'll send a
                verification code to your phone whenever you sign in.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter Phone Number"
                placeholderTextColor={colors.subtitle}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  isVerifying && { opacity: 0.7 },
                ]}
                onPress={handleEnableTwoFA}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Code Verification Modal */}
        <Modal
          visible={isCodeVerificationModalVisible}
          animationType="slide"
          transparent
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verify Code</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setCodeVerificationModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Enter the 6-digit verification code sent to your phone.
              </Text>

              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="Enter 6-Digit Code"
                placeholderTextColor={colors.subtitle}
                keyboardType="numeric"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />

              {codeError ? (
                <Text style={styles.errorText}>{codeError}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  isVerifying && { opacity: 0.7 },
                ]}
                onPress={handleVerifyCode}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resendButton, countdown > 0 && { opacity: 0.5 }]}
                onPress={handleResendCode}
                disabled={countdown > 0 || isVerifying}
              >
                <Text style={styles.resendText}>
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : "Didn't receive the code? Resend"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Privacy Settings Modal */}
        <Modal
          visible={isPrivacyModalVisible}
          animationType="slide"
          transparent
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Privacy Settings</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setPrivacyModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Control who can see your information and how your account
                appears to others.
              </Text>

              <View style={styles.privacyOption}>
                <Text style={styles.privacyOptionLabel}>Hide Activity</Text>
                <Switch
                  value={privacySettings.hideActivity}
                  onValueChange={(value) =>
                    setPrivacySettings({
                      ...privacySettings,
                      hideActivity: value,
                    })
                  }
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + "80",
                  }}
                  thumbColor={
                    privacySettings.hideActivity ? colors.primary : colors.card
                  }
                  ios_backgroundColor={colors.border}
                />
              </View>

              <View style={styles.privacyOption}>
                <Text style={styles.privacyOptionLabel}>Hide Contacts</Text>
                <Switch
                  value={privacySettings.hideContacts}
                  onValueChange={(value) =>
                    setPrivacySettings({
                      ...privacySettings,
                      hideContacts: value,
                    })
                  }
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + "80",
                  }}
                  thumbColor={
                    privacySettings.hideContacts ? colors.primary : colors.card
                  }
                  ios_backgroundColor={colors.border}
                />
              </View>

              <View style={styles.privacyOption}>
                <Text style={styles.privacyOptionLabel}>Hide Products</Text>
                <Switch
                  value={privacySettings.hideProducts}
                  onValueChange={(value) =>
                    setPrivacySettings({
                      ...privacySettings,
                      hideProducts: value,
                    })
                  }
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + "80",
                  }}
                  thumbColor={
                    privacySettings.hideProducts ? colors.primary : colors.card
                  }
                  ios_backgroundColor={colors.border}
                />
              </View>

              <Text style={styles.optionSectionTitle}>Allow Messages From</Text>

              <View style={styles.radioOptions}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() =>
                    setPrivacySettings({
                      ...privacySettings,
                      allowMessagesFrom: "everyone",
                    })
                  }
                >
                  <View style={styles.radioButton}>
                    {privacySettings.allowMessagesFrom === "everyone" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Everyone</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() =>
                    setPrivacySettings({
                      ...privacySettings,
                      allowMessagesFrom: "contacts",
                    })
                  }
                >
                  <View style={styles.radioButton}>
                    {privacySettings.allowMessagesFrom === "contacts" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.radioText}>Contacts Only</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() =>
                    setPrivacySettings({
                      ...privacySettings,
                      allowMessagesFrom: "none",
                    })
                  }
                >
                  <View style={styles.radioButton}>
                    {privacySettings.allowMessagesFrom === "none" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.radioText}>No One</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  isSaving && { opacity: 0.7 },
                ]}
                onPress={handleSavePrivacySettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save Privacy Settings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      color: colors.subtitle,
      fontSize: 16,
    },
    securitySection: {
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    footerElement: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 10,
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.subtitle,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    actionButtonContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginLeft: 12,
    },
    deleteButton: {
      marginTop: 8,
      backgroundColor: colors.cardBackground || "#FFF8F8",
      borderWidth: 1,
      borderColor: "#FEE2E2",
    },
    input: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    codeInput: {
      fontSize: 24,
      letterSpacing: 4,
      textAlign: "center",
    },
    button: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    buttonText: {
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 16,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "90%",
      maxWidth: 500,
      padding: 24,
      backgroundColor: colors.background,
      borderRadius: 16,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    modalCloseButton: {
      padding: 8,
    },
    modalDescription: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 20,
    },
    errorText: {
      color: "#ef4444",
      fontSize: 14,
      marginBottom: 10,
    },
    strengthContainer: {
      marginBottom: 16,
      width: "100%",
    },
    strengthText: {
      fontSize: 14,
      color: colors.subtitle,
      marginBottom: 6,
    },
    strengthBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    strengthFill: {
      height: "100%",
      borderRadius: 3,
    },
    resendButton: {
      marginTop: 16,
      padding: 8,
    },
    resendText: {
      color: colors.primary,
      fontSize: 14,
      textAlign: "center",
    },
    privacyOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    privacyOptionLabel: {
      fontSize: 16,
      color: colors.text,
    },
    optionSectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginTop: 20,
      marginBottom: 12,
    },
    radioOptions: {
      marginBottom: 20,
    },
    radioOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    radioButtonSelected: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    radioText: {
      fontSize: 16,
      color: colors.text,
    },
    securityStatusContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    securityStatusTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    securityStatusBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 10,
    },
    securityStatusFill: {
      height: "100%",
      borderRadius: 4,
    },
    securityStatusText: {
      fontSize: 14,
      color: colors.subtitle,
    },
  });

export default SecurityPrivacyScreen;
