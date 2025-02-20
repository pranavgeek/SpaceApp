import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import BaseContainer from '../components/BaseContainer';
import ButtonMain from '../components/ButtonMain.js';
import { useTheme } from '../theme/ThemeContext.js';

const SecurityPrivacyScreen = () => {
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isTwoFAModalVisible, setTwoFAModalVisible] = useState(false);
  const [isCodeVerificationModalVisible, setCodeVerificationModalVisible] =
    useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isTwoFAEnabled, setTwoFAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors);

  // Password Modal Handlers
  const handleSavePassword = () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    Alert.alert('Success', 'Password has been updated.');
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Two-Factor Authentication Handlers
  const handleEnableTwoFA = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }
    setTwoFAModalVisible(false);
    setCodeVerificationModalVisible(true);
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code.');
      return;
    }
    Alert.alert('Success', 'Two-Factor Authentication has been enabled.');
    setCodeVerificationModalVisible(false);
    setPhoneNumber('');
    setVerificationCode('');
  };

  return (
    <ScrollView style={styles.container}>

      <BaseContainer 
        title={"Password and Security"} 
        subtitle={"In this section you can change your password and enable 2FA to increase your account security"}
        titleIcon={"lock-closed-outline"}
        footer={
          <>
            <View style={styles.footerElement}>
              <Text style={styles.text}>
              Enable Two-Factor Authentication
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={(value) => {
                  setTwoFAEnabled(value);
                  if (value) {
                    setTwoFAModalVisible(true);
                  }
                }}
                thumbColor={isDarkMode ? '#AAA' : '#555'}
                trackColor={{ false: '#FFF', true: '#000' }}
              />
            </View>
            <View style={styles.footerElement}>
              <Text style={styles.text}>
              Set Account as Private
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={() => {}}
                thumbColor={isDarkMode ? '#AAA' : '#555'}
                trackColor={{ false: '#FFF', true: '#000' }}
              />
            </View>
          </>
        }>
        

        {/* Password Management */}
        <ButtonMain
          onPress={() => setPasswordModalVisible(true)}
        >
          <Text style={styles.buttonText}>Modify Password</Text>
        </ButtonMain>
        <ButtonMain
          onPress={() => Alert.alert('Privacy Policy', 'Redirecting to Privacy Policy...')}
        >
          <Text style={styles.buttonText}>View Privacy Policy</Text>
        </ButtonMain>
        <ButtonMain
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert(
              'Delete Account',
              'Are you sure you want to permanently delete your account?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {} },
              ]
            )
          }
        >
          <Text style={styles.buttonText}>Delete Account</Text>
        </ButtonMain>
      </BaseContainer>

      {/* Password Modal */}
      <Modal visible={isPasswordModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleSavePassword}>
              <Text style={styles.buttonText}>Save Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPasswordModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Two-Factor Authentication Modal */}
      <Modal visible={isTwoFAModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Two-Factor Authentication</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Phone Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TouchableOpacity style={styles.button} onPress={handleEnableTwoFA}>
              <Text style={styles.buttonText}>Save Phone Number</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setTwoFAModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Code Verification Modal */}
      <Modal visible={isCodeVerificationModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-Digit Code"
              keyboardType="numeric"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyCode}>
              <Text style={styles.buttonText}>Verify Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCodeVerificationModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.subtitle,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  optionText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  footerElement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
});

export default SecurityPrivacyScreen;
