import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import Icon from 'react-native-vector-icons/Ionicons';

import ButtonMain from '../components/ButtonMain';
import InputMain  from '../components/InputMain';
import { ScrollView } from 'react-native-gesture-handler';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const modalizeRef = useRef(null);

  const openForgotPasswordSheet = () => modalizeRef.current?.open();

  const handleForgotPassword = (email) => {
    Alert.alert('Password Reset', `Password reset link sent to ${email}`);
    modalizeRef.current?.close();
  };

  return (
    <View style={styles.container}>
      {/* Toggle Login/Signup */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isLogin && styles.activeToggleButton,
          ]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={isLogin ? styles.activeText : styles.inactiveText}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !isLogin && styles.activeToggleButton,
          ]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={!isLogin ? styles.activeText : styles.inactiveText}>
            Signup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Form */}
      {isLogin ? (
        <View style={styles.formContainer}>
          
          <InputMain
            placeholder="Email"
            label="Email"
          />
          <InputMain
            placeholder="Password"
            label="Password"
            isPassword={true}
          />

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={openForgotPasswordSheet}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <ButtonMain >Sign In</ButtonMain>

          {/* Social Login */}
          <View style={styles.socialContainer}>
            <Text style={styles.orText}>Or Login with</Text>
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="logo-facebook" size={24} color="#4267B2" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* Signup Form */
        <View style={styles.formContainer}>
          <ScrollView>
            <InputMain placeholder='Name' label='Name'/>
            <InputMain placeholder='Email' label='Email'/>
            <InputMain placeholder='Password' isPassword={true} label='Password' />
            <InputMain placeholder='Confirm Password' isPassword={true} label='Confirm Parssword'/>
            <InputMain label='Bio' numberOfLines={4} />
            <ButtonMain>Sign Up</ButtonMain>
          </ScrollView>
        </View>
      )}

      {/* Forgot Password Sheet */}
      <Modalize ref={modalizeRef} snapPoint={450} modalStyle={styles.modal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Reset Password</Text>
          <Text style={styles.modalText}>We'll send an email to recover your password</Text>
          <InputMain placeholder='email' />
          <ButtonMain>Send</ButtonMain>
        </View>
      </Modalize>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#141414',
    padding: 20,
    color: '#ffffff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#666666',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeToggleButton: { backgroundColor: '#777777' },
  activeText: { color: '#fff', fontWeight: 'bold' },
  inactiveText: { color: '#fff', fontWeight: 'bold' },

  formContainer: { marginTop: 10, marginBottom: 80 },
  input: {
    padding: 20,
    bordRadius: 20,
    color: '#ffffff',
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  forgotPasswordButton: { marginTop: 10, marginBottom: 10 },
  forgotPasswordText: { color: '#fff', textAlign: 'right', paddingBottom: 20 },
  submitButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: { 
    color: '#555', 
    fontWeight: 'bold' 
  },
  socialContainer: { alignItems: 'center', marginTop: 20 },
  orText: { color: '#aaa', marginBottom: 10 },
  socialButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 20,
    borderColor: '#aaa',
    borderWidth: 1,
  },
  socialButtonText: { 
    marginLeft: 5,
    fontSize: 16,
    color: '#aaa',
  },

  modal: { padding: 20, backgroundColor: '#494949' },
  modalContent: { alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
  modalText: { fontSize: 16, marginBottom: 20, color: '#aaa' },
});

export default AuthScreen;
