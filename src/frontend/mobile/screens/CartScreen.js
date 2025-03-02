import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useCart } from "../context/CartContext";
import { useTheme } from "../theme/ThemeContext"; // Import useTheme

const CartScreen = () => {
  const { cartItems, removeFromCart } = useCart();
  const { colors } = useTheme(); // Access colors from ThemeContext

  const renderItem = ({ item }) => (
    <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <Text style={[styles.itemName, { color: colors.text }]}>{item?.name}</Text>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemPrice, { color: colors.text }]}>{item?.price}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item?.cartItemId)}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {cartItems && cartItems.length > 0 ? (
        <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item?.cartItemId}
      />
      ) : (
        <Text style={[styles.emptyCartText, { color: colors.subtitle }]}>Your cart is empty.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 16,
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyCartText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});

export default CartScreen;