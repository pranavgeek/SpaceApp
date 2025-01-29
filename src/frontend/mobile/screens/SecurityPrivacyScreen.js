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
} from 'react-native';

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
    <View style={styles.container}>
      {/* Password Management */}
      <Text style={styles.sectionTitle}>Password Management</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setPasswordModalVisible(true)}
      >
        <Text style={styles.buttonText}>Modify Password</Text>
      </TouchableOpacity>

      {/* Enable Two-Factor Authentication */}
      <View style={styles.optionRow}>
        <Text style={styles.optionText}>Enable Two-Factor Authentication</Text>
        <Switch
          value={isTwoFAEnabled}
          onValueChange={(value) => {
            setTwoFAEnabled(value);
            if (value) {
              setTwoFAModalVisible(true);
            }
          }}
        />
      </View>

      {/* Account Privacy */}
      <View style={styles.optionRow}>
        <Text style={styles.optionText}>Set Account as Private</Text>
        <Switch value={false} onValueChange={() => {}} />
      </View>

      {/* Privacy Policy Access */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => Alert.alert('Privacy Policy', 'Redirecting to Privacy Policy...')}
      >
        <Text style={styles.buttonText}>View Privacy Policy</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity
        style={[styles.button, styles.deleteButton]}
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
      </TouchableOpacity>

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
            <Text style={styles.modalTitle}>Enable Two-Factor Authentication</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
});

export default SecurityPrivacyScreen;
