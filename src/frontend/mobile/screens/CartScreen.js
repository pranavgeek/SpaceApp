import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { useCart } from "../context/CartContext";
import { useTheme } from "../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

export default function CartScreen() {
  const { cartItems, removeFromCart, updateItemQuantity } = useCart();
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  const navigation = useNavigation();
  const { user } = useAuth(); // Get logged-in user

  // For shipping & discount logic (used for large web only)
  const [shippingMethod, setShippingMethod] = useState("free");
  const [shippingCost, setShippingCost] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const { width } = Dimensions.get("window");
  const isWebLarge = Platform.OS === "web" && width >= 768; // "Desktop" web
  const isMobileOrSmallWeb = !isWebLarge; // Mobile or web < 768

  // Compute subtotal
  const subTotal = cartItems.reduce((acc, item) => {
    const rawPrice =
      typeof item.price === "number"
        ? item.price
        : parseFloat(String(item.price ?? "0").replace("$", ""));
    const qty = item.quantity || 1;
    return acc + rawPrice * qty;
  }, 0);

  // Final total = subtotal + shipping - discount
  const total = subTotal + shippingCost - discountAmount;

  // Shipping method logic (only for large web)
  const handleShippingChange = (method) => {
    setShippingMethod(method);
    if (method === "local") {
      setShippingCost(5);
    } else if (method === "flat") {
      setShippingCost(10);
    } else {
      setShippingCost(0);
    }
  };

  // Discount code logic (only for large web)
  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === "SAVE10") {
      setDiscountAmount(10);
    } else {
      setDiscountAmount(0);
    }
  };

  const handleCheckout = () => {
    const cartItem = cartItems[0];
  
    if (!cartItem) {
      console.error("🚫 No item in cart.");
      return;
    }
  
    const productId = cartItem.product_id || cartItem.id || cartItem.project_id;
    const quantity = cartItem.quantity || 1;
    const seller_id = cartItem.seller_id;
    const buyer_id = user?.user_id;
  
    console.log("🛒 Final cart item:", cartItem);
    console.log("🛒 Passing to Checkout:", {
      productId,
      quantity,
      total: total.toFixed(2),
      buyer_id,
      seller_id,
    });
  
    navigation.navigate("ContactForm", {
      total: total.toFixed(2),
      productId,
      quantity,
      buyer_id,
      seller_id,
      product_name: cartItem.name,
    });
  };
  
  

  const decrementQuantity = (item) => {
    if (item.quantity > 1) {
      updateItemQuantity(item.cartItemId, item.quantity - 1);
    }
  };

  const incrementQuantity = (item) => {
    updateItemQuantity(item.cartItemId, (item.quantity || 1) + 1);
  };

  // -------------------------------------------
  // ITEM RENDERING
  // -------------------------------------------
  const renderItem = ({ item }) => {
    const rawPrice =
      typeof item.price === "number"
        ? item.price
        : parseFloat(String(item.price ?? "0").replace("$", ""));
    const qty = item.quantity || 1;
    const itemSubtotal = rawPrice * qty;

    if (isWebLarge) {
      // Large web: 5 columns (Product, Price, Quantity, Subtotal, Remove)
      return (
        <View style={styles.itemRow}>
          {/* Column 1: Product (image + name) */}
          <View style={[styles.itemCell, { flex: 2 }]}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.name}
            </Text>
          </View>
          {/* Column 2: Price */}
          <View style={[styles.itemCell, { flex: 1 }]}>
            <Text style={[styles.itemPrice, { color: colors.text }]}>
              ${rawPrice.toFixed(2)}
            </Text>
          </View>
          {/* Column 3: Quantity */}
          <View style={[styles.itemCell, { flex: 1 }]}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => decrementQuantity(item)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>
                {qty}
              </Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => incrementQuantity(item)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Column 4: Subtotal */}
          <View style={[styles.itemCell, { flex: 1 }]}>
            <Text style={[styles.subtotalText, { color: colors.text }]}>
              ${itemSubtotal.toFixed(2)}
            </Text>
          </View>
          {/* Column 5: Remove (X icon) */}
          <View style={[styles.itemCell, { flex: 1 }]}>
            <TouchableOpacity onPress={() => removeFromCart(item.cartItemId)}>
              <Icon name="close" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      // Mobile / small web: "two-column" style
      // Left column: image + name (stacked)
      // Right column: price & remove in top row, quantity in bottom row
      return (
        <View style={styles.mobileItemRow}>
          {/* Left Part */}
          <View style={styles.mobileLeftPart}>
            <Image
              source={{ uri: item.image }}
              style={styles.mobileItemImage}
            />
            <Text style={[styles.mobileItemName, { color: colors.text }]}>
              {item.name}
            </Text>
          </View>

          {/* Right Part */}
          <View style={styles.mobileRightPart}>
            {/* Top Row: Price & Remove Icon */}
            <View style={styles.mobileTopRow}>
              <Text style={[styles.mobilePrice, { color: colors.text }]}>
                ${rawPrice.toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => removeFromCart(item.cartItemId)}>
                <Icon name="close" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            {/* Bottom Row: Quantity Controls */}
            <View style={styles.mobileBottomRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => decrementQuantity(item)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>
                {qty}
              </Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => incrementQuantity(item)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
  };

  // -------------------------------------------
  // WEB LAYOUT (>= 768px)
  // -------------------------------------------
  if (isWebLarge) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.webContainer}>
          {/* Left Column: Cart Items Table */}
          <View style={styles.cartItemsContainer}>
            {cartItems && cartItems.length > 0 ? (
              <>
                {/* Table Header (5 columns) */}
                <View style={styles.headerRow}>
                  <Text style={[styles.headerCell, { flex: 2 }]}>Product</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}>Price</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}>Quantity</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}>Subtotal</Text>
                  <Text style={[styles.headerCell, { flex: 1 }]}></Text>
                </View>
                <FlatList
                  data={cartItems}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.cartItemId}
                />
              </>
            ) : (
              <Text style={[styles.emptyCartText, { color: colors.subtitle }]}>
                Your cart is empty.
              </Text>
            )}
          </View>

          {/* Right Column: Summary */}
          {cartItems.length > 0 && (
            <View style={styles.summaryContainer}>
              {/* Title and content */}
              <Text style={styles.summaryTitle}>CART TOTAL</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subTotal.toFixed(2)}</Text>
              </View>

              {/* Shipping */}
              <Text style={styles.summaryLabel}>Shipping</Text>
              <View style={styles.shippingOptions}>
                <TouchableOpacity
                  style={styles.shippingOptionRow}
                  onPress={() => handleShippingChange("free")}
                >
                  <Text style={styles.radioCircle}>
                    {shippingMethod === "free" ? "●" : "○"}
                  </Text>
                  <Text style={styles.shippingOptionText}>Free shipping</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shippingOptionRow}
                  onPress={() => handleShippingChange("local")}
                >
                  <Text style={styles.radioCircle}>
                    {shippingMethod === "local" ? "●" : "○"}
                  </Text>
                  <Text style={styles.shippingOptionText}>
                    Local delivery ($5)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shippingOptionRow}
                  onPress={() => handleShippingChange("flat")}
                >
                  <Text style={styles.radioCircle}>
                    {shippingMethod === "flat" ? "●" : "○"}
                  </Text>
                  <Text style={styles.shippingOptionText}>Flat rate ($10)</Text>
                </TouchableOpacity>
              </View>

              {/* Country & Postcode */}
              <View style={styles.addressContainer}>
                <View style={styles.row}>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.summaryLabel}>Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter address"
                      placeholderTextColor="#888"
                    />
                  </View>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.summaryLabel}>City</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter city"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.summaryLabel}>Country</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter country"
                      placeholderTextColor="#888"
                    />
                  </View>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.summaryLabel}>Postal Code</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter postal code"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>
              </View>

              {/* Discount Code */}
              <View style={styles.discountContainer}>
                <TextInput
                  style={styles.discountInput}
                  placeholder="Discount code"
                  placeholderTextColor="#888"
                  value={discountCode}
                  onChangeText={setDiscountCode}
                />
                <TouchableOpacity
                  style={styles.discountButton}
                  onPress={handleApplyDiscount}
                >
                  <Text style={styles.discountButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Cost</Text>
                <Text style={styles.summaryValue}>
                  ${shippingCost.toFixed(2)}
                </Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={styles.summaryValue}>
                    -${discountAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
              </View>

              {/* Proceed to Checkout button at bottom center */}
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
              >
                <Text style={styles.checkoutButtonText}>
                  Proceed to Checkout
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // -------------------------------------------
  // MOBILE / SMALL WEB LAYOUT
  // -------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {cartItems && cartItems.length > 0 ? (
        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.cartItemId}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : (
        <Text style={[styles.emptyCartText, { color: colors.subtitle }]}>
          Your cart is empty.
        </Text>
      )}

      {cartItems.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card }]}>
          <Text style={[styles.totalText, { color: colors.text }]}>
            Total: ${subTotal.toFixed(2)}
          </Text>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// --------------------------------------------
// STYLES
// --------------------------------------------
const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },

    // Web layout (≥ 768px)
    webContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cartItemsContainer: {
      flex: 3,
      marginRight: 10,
    },
    summaryContainer: {
      borderWidth: 1,
      borderColor: "#e0e0e0",
      padding: 15,
      borderRadius: 8,
    },
    headerRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
      paddingBottom: 5,
      marginBottom: 10,
    },
    headerCell: {
      fontWeight: "bold",
      color: colors.text,
    },

    // Large web item row
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
      paddingVertical: 10,
    },
    itemCell: {
      flexDirection: "row",
      alignItems: "center",
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
    itemPrice: {
      fontSize: 14,
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    qtyButton: {
      borderWidth: 1,
      borderColor: "#ccc",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    qtyButtonText: {
      fontSize: 16,
      color: colors.text,
    },
    qtyText: {
      fontSize: 16,
      marginHorizontal: 8,
      minWidth: 20,
      textAlign: "center",
    },
    subtotalText: {
      fontSize: 14,
      marginLeft: 5,
    },

    // MOBILE / SMALL WEB
    mobileItemRow: {
      flexDirection: "row",
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
      paddingBottom: 15,
    },
    mobileLeftPart: {
      flex: 0.5,
      alignItems: "center",
    },
    mobileItemImage: {
      width: 70,
      height: 70,
      borderRadius: 8,
      marginBottom: 8,
    },
    mobileItemName: {
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
    mobileRightPart: {
      flex: 1,
      justifyContent: "space-between",
    },
    mobileTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    mobilePrice: {
      fontSize: 16,
      fontWeight: "bold",
    },
    mobileBottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },

    // Remove button
    removeButton: {
      marginLeft: 10,
    },

    // If cart is empty
    emptyCartText: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
    },

    // Bottom Checkout Bar (mobile/small web)
    bottomBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: 15,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "#ccc",
    },
    totalText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    checkoutButton: {
      alignSelf: "center", // ensures the button is centered horizontally
      marginTop: 20, // some spacing from content above
      backgroundColor: colors.buttonBackground,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 5,
    },

    checkoutButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#fff",
      textAlign: "center",
    },

    // Summary styles (web)
    summaryContainer: {
      backgroundColor: colors.baseContainerHeader, // distinct background for the right panel
      borderRadius: 8,
      padding: 20,
      marginTop: 20,
      height: "100%",
      width: "30%",
      // If you want some drop shadow on web:
      // shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      // shadowOpacity: 0.1, shadowRadius: 5,
      // elevation: 2, // For Android
    },

    summaryTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      color: colors.text,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 5,
    },

    summaryLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },

    // Shipping
    shippingOptions: {
      marginVertical: 10,
    },
    shippingOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 5,
    },
    radioCircle: {
      marginRight: 8,
      fontSize: 18,
      color: colors.text,
    },
    shippingOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    addressContainer: {
      marginVertical: 15,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    halfInputContainer: {
      flex: 1,
      marginRight: 10,
    },
    // Remove marginRight for the last item in a row if desired:
    halfInputContainerLast: {
      flex: 1,
      marginRight: 0,
    },
    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text, // or use colors.text if available
      marginTop: 5,
    },
    

    // Discount Code
    discountContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
    },
    discountInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 4,
      paddingHorizontal: 10,
      marginRight: 10,
      height: 32,
      color: colors.text,
    },
    discountButton: {
      backgroundColor: colors.buttonBackground,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 4,
    },
    discountButtonText: {
      color: "white",
      fontWeight: "bold",
    },
  });
