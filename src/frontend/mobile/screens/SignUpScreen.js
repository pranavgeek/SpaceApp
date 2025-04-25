import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const SignUpScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { register } = useAuth();
  const styles = getStyles(colors);
  
  // Form field states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Buyer'); // Default to Buyer
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle sign up button press
  const handleSignUp = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        
        // Create user object
        const userData = {
          name,
          email,
          password,
          account_type: accountType
        };
        
        // Call register function from Auth context
        await register(userData);
        
        // Navigate to the next screen or home
        // navigation.navigate('Home'); 
        // This will be handled by your Auth context
        
      } catch (error) {
        Alert.alert(
          'Registration Failed',
          error.message || 'Could not create your account. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const AccountTypeOption = ({ type, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.accountTypeOption,
        accountType === type && styles.accountTypeSelected
      ]}
      onPress={() => setAccountType(type)}
    >
      <Ionicons
        name={icon}
        size={22}
        color={accountType === type ? colors.primary : colors.subtitle}
      />
      <Text 
        style={[
          styles.accountTypeLabel,
          accountType === type && styles.accountTypeLabelSelected
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Sign up to start collaborating, buying, or selling innovative tech products
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            {/* Account Type Selection */}
            <Text style={styles.sectionTitle}>I want to join as a:</Text>
            <View style={styles.accountTypeContainer}>
              <AccountTypeOption 
                type="Buyer"
                label="Buyer"
                icon="cart-outline"
              />
              <AccountTypeOption 
                type="Seller"
                label="Seller"
                icon="briefcase-outline"
              />
              <AccountTypeOption 
                type="Influencer"
                label="Influencer"
                icon="megaphone-outline"
              />
            </View>
            
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  errors.name && styles.inputError
                ]}
              >
                <Ionicons name="person-outline" size={20} color={colors.subtitle} />
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.subtitle + '80'}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      const newErrors = {...errors};
                      delete newErrors.name;
                      setErrors(newErrors);
                    }
                  }}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  errors.email && styles.inputError
                ]}
              >
                <Ionicons name="mail-outline" size={20} color={colors.subtitle} />
                <TextInput
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor={colors.subtitle + '80'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      const newErrors = {...errors};
                      delete newErrors.email;
                      setErrors(newErrors);
                    }
                  }}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
            
            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  errors.password && styles.inputError
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.subtitle} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a strong password"
                  placeholderTextColor={colors.subtitle + '80'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      const newErrors = {...errors};
                      delete newErrors.password;
                      setErrors(newErrors);
                    }
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.subtitle}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View 
                      style={[
                        styles.passwordStrengthIndicator, 
                        { 
                          width: `${(password.length >= 8 ? 100 : password.length * 12.5)}%`,
                          backgroundColor: password.length >= 8 ? '#10b981' : password.length >= 6 ? '#eab308' : '#ef4444'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.passwordStrengthText}>
                    {password.length >= 8 ? 'Strong password' : password.length >= 6 ? 'Moderate password' : 'Weak password'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View 
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword && styles.inputError
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.subtitle} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.subtitle + '80'}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      const newErrors = {...errors};
                      delete newErrors.confirmPassword;
                      setErrors(newErrors);
                    }
                  }}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.subtitle}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
            
            {/* Sign Up Button */}
            <TouchableOpacity 
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
            
            {/* Terms and Conditions */}
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
            
            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.subtitle,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  accountTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: colors.cardBackground || '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountTypeSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  accountTypeLabel: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
    color: colors.subtitle,
  },
  accountTypeLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground || '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border || '#E0E0E0',
    paddingHorizontal: 12,
    height: 56,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: colors.border || '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  passwordStrengthIndicator: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    color: colors.subtitle,
  },
  signUpButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 14,
    color: colors.subtitle,
    textAlign: 'center',
    marginBottom: 24,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: colors.subtitle,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
});

export default SignUpScreen;