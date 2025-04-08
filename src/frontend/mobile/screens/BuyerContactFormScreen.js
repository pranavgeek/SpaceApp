import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const BuyerContactFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    productId,
    quantity,
    total,
    buyer_id,
    seller_id,
    product_name
  } = route.params || {};

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    country: "",
    postal_code: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateField = (field, value) => {
    if (!value.trim()) return `${field.replace('_', ' ')} is required`;
    
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Invalid email format';
    }
    
    if (field === 'phone') {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(value.replace(/[^0-9]/g, ''))) 
        return 'Invalid phone number';
    }
    
    if (field === 'postal_code') {
      if (value.length < 4) return 'Invalid postal code';
    }
    
    return null;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(form).forEach(field => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    setTouched(Object.keys(form).reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    return isValid;
  };

  const handleContinue = () => {
    if (validateForm()) {
      // Navigate to CheckoutScreen with all info
      navigation.navigate("Checkout", {
        productId,
        quantity,
        total,
        buyer_id,
        seller_id,
        product_name,
        ...form,
      });
    }
  };

  const formFields = [
    ["first_name", "First Name", "person"],
    ["last_name", "Last Name", "person"],
    ["email", "Email", "email"],
    ["phone", "Phone Number", "phone"],
    ["address", "Address", "home"],
    ["city", "City", "location-city"],
    ["province", "Province / State", "map"],
    ["country", "Country", "public"],
    ["postal_code", "Postal Code", "markunread-mailbox"],
  ];

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Shipping Details</Text>
          <Text style={styles.subheader}>Please fill in your contact and shipping information</Text>
        </View>

        <View style={styles.formContainer}>
          {formFields.map(([key, label]) => (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={[
                  styles.input,
                  touched[key] && errors[key] && styles.inputError,
                  form[key] && !errors[key] && styles.inputSuccess
                ]}
                placeholder={label}
                value={form[key]}
                onChangeText={(text) => handleChange(key, text)}
                onBlur={() => handleBlur(key)}
              />
              {touched[key] && errors[key] && (
                <Text style={styles.errorText}>{errors[key]}</Text>
              )}
            </View>
          ))}

          <TouchableOpacity 
            style={styles.button}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue to Payment</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    flexGrow: 1,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  subheader: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
    backgroundColor: "#fef2f2",
  },
  inputSuccess: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdfa",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
    shadowColor: "#3b82f6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});

export default BuyerContactFormScreen;