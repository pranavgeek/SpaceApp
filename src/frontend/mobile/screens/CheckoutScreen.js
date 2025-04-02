// CheckoutScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CheckoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      {/* Add your checkout form or payment logic here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
});
