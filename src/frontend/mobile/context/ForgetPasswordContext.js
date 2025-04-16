import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestOtp, verifyOtp, resetPassword } from '../backend/db/API';

// Create the context
const ForgetPasswordContext = createContext();

// Custom hook to use the context
export const useForgetPassword = () => {
  const context = useContext(ForgetPasswordContext);
  if (!context) {
    throw new Error('useForgetPassword must be used within a ForgetPasswordProvider');
  }
  return context;
};

// Provider component
export const ForgetPasswordProvider = ({ children }) => {
  // State variables
  const [currentStep, setCurrentStep] = useState('login'); // login, email, otp, newPassword
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved state when the provider mounts
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedStep = await AsyncStorage.getItem('currentStep');
        const savedEmail = await AsyncStorage.getItem('forgotEmail');
        
        if (savedStep) setCurrentStep(savedStep);
        if (savedEmail) setEmail(savedEmail);
        
        console.log('Loaded saved step:', savedStep);
        console.log('Loaded saved email:', savedEmail);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    };
    
    loadSavedState();
  }, []);

  // Function to handle step navigation with persistence
  const goToStep = useCallback(async (step) => {
    console.log(`Navigating from ${currentStep} to ${step}`);
    setCurrentStep(step);
    
    // Save current step
    try {
      await AsyncStorage.setItem('currentStep', step);
      if (email) {
        await AsyncStorage.setItem('forgotEmail', email);
      }
      console.log('Saved step to storage:', step);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [currentStep, email]);

  // Function to reset all state
  const resetState = useCallback(async () => {
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentStep('login');
    
    // Clear storage
    try {
      await AsyncStorage.removeItem('currentStep');
      await AsyncStorage.removeItem('forgotEmail');
      console.log('Cleared saved state');
    } catch (error) {
      console.error('Error clearing state:', error);
    }
  }, []);

  // Function to handle OTP request
  const handleSendOtp = useCallback(async () => {
    if (!email) {
      return Alert.alert('Error', 'Please enter your email address.');
    }

    setIsLoading(true);
    try {
      console.log('Sending OTP request for:', email);
      const response = await requestOtp(email);
      console.log('OTP request response:', response);
      
      setIsLoading(false);
      
      // Update step state with persistence
      await goToStep('otp');
      
      // Show alert after the state update
      Alert.alert(
        'OTP Sent',
        `We've sent a verification code to ${email}. Please check your email.`
      );
    } catch (error) {
      console.error('OTP request error:', error);
      setIsLoading(false);
      
      // For testing purposes - enable this if backend is not available
      // Comment out in production
      /*
      console.log('Testing mode: Moving to OTP screen anyway');
      goToStep('otp');
      Alert.alert('Test Mode', 'Moving to OTP screen for testing.');
      */
      
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    }
  }, [email, goToStep]);

  // Function to verify OTP
  const handleVerifyOtp = useCallback(async () => {
    if (!otp) {
      return Alert.alert('Error', 'Please enter the verification code.');
    }

    setIsLoading(true);
    try {
      await verifyOtp(email, otp);
      setIsLoading(false);
      await goToStep('newPassword');
    } catch (error) {
      console.error('OTP verification error:', error);
      setIsLoading(false);
      
      // For testing purposes - enable this if backend is not available
      // Comment out in production
      /*
      console.log('Testing mode: Moving to new password screen anyway');
      goToStep('newPassword');
      */
      
      Alert.alert('Error', error.message || 'Invalid or expired code. Please try again.');
    }
  }, [email, otp, goToStep]);

  // Function to reset password
const handleResetPassword = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please enter and confirm your new password.');
    }
  
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
  
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters long.');
    }
  
    setIsLoading(true);
    try {
      await resetPassword(email, newPassword);
      setIsLoading(false);
      
      // First clear the state to ensure a clean start
      await resetState();
      
      // Show success message
      Alert.alert(
        'Success',
        'Your password has been reset successfully.',
        [
          {
            text: 'Login',
            onPress: () => {
              // Make sure we explicitly go to login screen
              goToStep('login');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      setIsLoading(false);
      
      // For testing purposes - enable this if backend is not available
      // Comment out in production
      /*
      console.log('Testing mode: Resetting state and going to login');
      // Clear state and navigate to login
      await resetState();
      Alert.alert(
        'Success (Test Mode)',
        'Your password has been reset successfully.',
        [{ 
          text: 'Login', 
          onPress: () => goToStep('login') 
        }]
      );
      */
      
      Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
    }
  }, [newPassword, confirmPassword, email, resetState, goToStep]);

  // Create the context value object
  const contextValue = {
    currentStep,
    email,
    otp,
    newPassword,
    confirmPassword,
    isLoading,
    setEmail,
    setOtp,
    setNewPassword,
    setConfirmPassword,
    goToStep,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    resetState
  };

  return (
    <ForgetPasswordContext.Provider value={contextValue}>
      {children}
    </ForgetPasswordContext.Provider>
  );
};

export default ForgetPasswordContext;