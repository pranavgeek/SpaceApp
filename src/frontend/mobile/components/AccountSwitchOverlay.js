import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

const screenHeight = Dimensions.get("window").height;

export default function AccountSwitchOverlay({ role, onDone }) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30)); // Slide up from 30px below

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(onDone);
      }, 2000); // visible for 2s
    });
  }, []);

  useEffect(() => {
    console.log("🎬 Overlay shown for role:", role);
  }, []);
  

  const getMessage = () => {
    if (role === "Seller") return "🎉 You're now a Seller!";
    if (role === "Influencer") return "🔥 Welcome, Influencer!";
    return "🎉 You're now buyer again";
  };

  return (
    <Modal visible transparent animationType="fade">
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={[styles.card, { backgroundColor: colors.baseContainerBody }]}>
        <Text style={[styles.message, { color: colors.text }]}>{getMessage()}</Text>
      </View>
    </Animated.View>
  </Modal>  
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: 280,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});
