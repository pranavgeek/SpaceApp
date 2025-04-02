// CartIcon.js
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { useCart } from "../context/CartContext";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";

export default function CartIcon() {
  const { cartItems } = useCart();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <TouchableOpacity
      style={styles.cartIconContainer}
      onPress={() => navigation.navigate("CartScreen")}
    >
      <Icon name="shoppingcart" size={24} color="#fff" />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cartIconContainer: {
    marginRight: 15,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
  },
});
