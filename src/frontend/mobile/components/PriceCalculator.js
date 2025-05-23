import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext"; // Import Auth context to access user tier

const PriceCalculator = ({
  initialPrice = "",
  onPriceChange,
  onSellingPriceChange,
  colors,
  isMobile = true, // Default to mobile since we're in React Native
}) => {
  const { user } = useAuth(); // Get user from Auth context to determine the tier
  const [basePrice, setBasePrice] = useState(initialPrice);
  const [processingFee, setProcessingFee] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [showProcessingFeeInfo, setShowProcessingFeeInfo] = useState(false);
  const infoHeight = useState(new Animated.Value(0))[0];
  const inputRef = useRef(null);
  
  // Determine fee percentage based on the user's subscription tier
  const getFeePercentage = () => {
    const tier = user?.tier?.toLowerCase() || "basic";
    
    switch (tier) {
      case "pro":
        return 3; // 3% for Pro
      case "enterprise":
        return 2; // 2% for Enterprise
      case "basic":
      default:
        return 5; // 5% for Basic (default)
    }
  };
  
  const feePercentage = getFeePercentage();
  
  // Calculate fees whenever base price changes
  useEffect(() => {
    if (basePrice && !isNaN(basePrice)) {
      const numericPrice = parseFloat(basePrice);
      const fee = numericPrice * (feePercentage / 100); // Use dynamic fee percentage
      setProcessingFee(fee);
      const calculatedSellingPrice = numericPrice + fee;
      setSellingPrice(calculatedSellingPrice);
      
      // Call the parent callbacks if provided
      if (onPriceChange) {
        onPriceChange(basePrice);
      }
      if (onSellingPriceChange) {
        onSellingPriceChange(calculatedSellingPrice);
      }
    } else {
      setProcessingFee(0);
      setSellingPrice(0);
    }
  }, [basePrice, feePercentage, onPriceChange, onSellingPriceChange]);

  // Toggle processing fee info with animation
  useEffect(() => {
    Animated.timing(infoHeight, {
      toValue: showProcessingFeeInfo ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showProcessingFeeInfo, infoHeight]);

  const handlePriceChange = (text) => {
    // Only allow numeric input
    if (text === "" || /^\d*\.?\d*$/.test(text)) {
      setBasePrice(text);
    }
  };

  // Function to dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Function to handle "Done" button press on keyboard
  const handleSubmitEditing = () => {
    dismissKeyboard();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        {/* Price Input */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Price</Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { 
                borderColor: colors.inputBorder || "#E0E0E0",
                backgroundColor: colors.cardBackground || "#FFFFFF",
                color: colors.text 
              }
            ]}
            value={basePrice}
            onChangeText={handlePriceChange}
            placeholder="0"
            placeholderTextColor={colors.placeholderText || "#888"}
            keyboardType={Platform.OS === 'ios' ? "numbers-and-punctuation" : "numeric"}
            returnKeyType="done"
            onSubmitEditing={handleSubmitEditing}
            blurOnSubmit={true}
          />
        </View>
        
        {/* Processing Fees */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Processing Fees</Text>
          <Text style={[styles.value, { color: colors.text }]}>{feePercentage}%</Text>
        </View>
        
        {/* Selling Price */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Selling Price</Text>
          <Text style={[styles.value, { color: colors.primary }]}>
            {sellingPrice.toLocaleString()}
          </Text>
        </View>
        
        {/* Show subscription tier information */}
        <View style={styles.tierInfoContainer}>
          <Text style={[styles.tierInfo, { color: colors.secondary }]}>
            {`Your current plan (${user?.tier || 'Basic'}) has a ${feePercentage}% processing fee`}
          </Text>
        </View>
        
        {/* Terms Section */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsSectionLabel, { color: colors.text }]}>Terms</Text>
          
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setShowProcessingFeeInfo(!showProcessingFeeInfo)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, { borderColor: colors.text }]}>
              {showProcessingFeeInfo && (
                <View style={[styles.checkboxInner, { backgroundColor: colors.text }]} />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Talk about processing fee
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Processing Fee Info - Animated */}
        <Animated.View 
          style={[
            styles.infoBox, 
            { 
              maxHeight: infoHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 150]
              }),
              opacity: infoHeight,
              backgroundColor: `${colors.primary}22`, // Semi-transparent primary color
            }
          ]}
        >
          <View style={styles.infoContent}>
            <View style={styles.infoIconContainer}>
              <MaterialIcons 
                name="info" 
                size={20} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>
                Processing Fee Information
              </Text>
              <Text style={[styles.infoText, { color: colors.text }]}>
                A {feePercentage}% processing fee is applied to all transactions to cover payment 
                processing costs. This fee is automatically calculated and added to 
                your base price to determine the final selling price.
                {user?.tier !== 'enterprise' && 
                  "\n\nUpgrade your plan to reduce this fee."}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    width: 160,
    textAlign: "right",
  },
  termsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  termsSectionLabel: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  infoBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoContent: {
    flexDirection: "row",
  },
  infoIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.8,
  },
  tierInfoContainer: {
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
  },
  tierInfo: {
    fontSize: 14,
    fontStyle: 'italic',
  }
});

export default PriceCalculator;