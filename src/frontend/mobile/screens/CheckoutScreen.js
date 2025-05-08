import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  BackHandler,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../context/AuthContext"; // adjust if path differs
import { createOrder } from "../backend/db/API"; // your API method
import AsyncStorage from "@react-native-async-storage/async-storage";

const CheckoutScreen = ({ navigation, route }) => {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);
  const { user } = useAuth(); // 👈 Get logged-in user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Use different base URLs based on platform
  const BASE_URL = Platform.OS === "web" 
  ? "http://localhost:5001/api"
  : "http://10.0.0.25:5001/api";


  // const BASE_URL = Platform.OS === "web" 
  // ? "http://3.99.169.179/api"
  // : "http://3.99.169.179/api";


  const {
    productId,
    quantity,
    total,
    seller_id,
    product_name,
    first_name,
    last_name,
    email,
    phone,
    address,
    city,
    province,
    country,
    postal_code,
  } = route.params || {};

  const checkoutUrl = `${BASE_URL}/checkout.html?total=${total}&productId=${productId}&quantity=${quantity}&product_name=${encodeURIComponent(product_name || "")}`;

  const buyer_id = user?.user_id;

  console.log("💳 CheckoutScreen params:", {
    product_id: productId,
    buyer_id,
    quantity,
    seller_id,
    total,
    product_name,
    url: checkoutUrl,
  });

  // Handle message events from iframe in web mode
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleWebMessage = async (event) => {
        // Check origin based on environment
        if (event.origin !== "http://3.99.169.179") return;

        try {
          console.log("Received message from iframe:", event.data);
          const response = JSON.parse(event.data);
          handlePaymentResponse(response);
        } catch (err) {
          console.error("Error parsing WebView message:", err);
          setError("Communication error with payment gateway.");
        }
      };

      window.addEventListener("message", handleWebMessage);
      return () => window.removeEventListener("message", handleWebMessage);
    }
  }, [user]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (processingPayment) {
          Alert.alert(
            "Payment in Progress",
            "Do you want to cancel this payment?",
            [
              { text: "Stay", style: "cancel" },
              {
                text: "Cancel Payment",
                style: "destructive",
                onPress: () => navigation.goBack(),
              },
            ]
          );
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [processingPayment]);

  const handlePaymentResponse = async (response) => {
    console.log("Processing payment response:", response);
    try {
      switch (response.type) {
        case "payment_started":
          setProcessingPayment(true);
          break;

        case "payment_response":
          setProcessingPayment(false);

          if (response.success && user) {
            const {
              productId: respProductId,
              quantity: respQuantity,
              amount,
              transactionId,
              orderId,
              status,
            } = response.orderDetails || {};

            // Use route params if order details are missing
            const productIdToUse = respProductId || productId;
            const quantityToUse = respQuantity || quantity;
            const amountToUse = amount || total;
            const statusToUse = status || "completed";

            // 👇 use route.params.product_name if not present in orderDetails
            const enrichedOrder = {
              product_id: parseInt(productIdToUse),
              product_name: product_name || "Unnamed Product",
              quantity: parseInt(quantityToUse) || 1,
              amount: parseFloat(amountToUse),
              status: statusToUse,
              tracking_number: "",
              buyer_id: parseInt(user.user_id),
              seller_id: parseInt(seller_id),
              buyer_first_name: first_name,
              buyer_last_name: last_name,
              buyer_email: email,
              buyer_phone: phone,
              shipping_address: address,
              shipping_city: city,
              shipping_province: province,
              shipping_country: country,
              shipping_postal_code: postal_code,
            };

            console.log("Creating order with:", enrichedOrder);

            try {
              await createOrder(enrichedOrder.buyer_id, enrichedOrder);
              console.log("✅ Order created:", enrichedOrder);

              navigation.navigate("Home", {
                orderComplete: true,
                orderDetails: enrichedOrder,
              });
            } catch (error) {
              console.error("❌ Failed to create order:", error);
              setError("Order creation failed.");
            }
          } else {
            setError("Payment processing failed.");
          }
          break;

        case "navigation":
          navigation.navigate("Home", { orderComplete: true });
          break;

        case "error":
          setProcessingPayment(false);
          setError(response.message || "An error occurred");
          break;

        default:
          console.log("Unknown message type:", response);
      }
    } catch (err) {
      console.error("Error handling payment response:", err);
      setError("Error processing payment response.");
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      console.log("WebView message received:", event.nativeEvent.data);
      const response = JSON.parse(event.nativeEvent.data);
      handlePaymentResponse(response);
    } catch (err) {
      console.error("Error parsing WebView message:", err);
      setError("Communication error with payment gateway.");
    }
  };

  // For web - add window message listener script to iframe
  const setupIframeListener = () => {
    if (iframeRef.current) {
      try {
        // Add a loading complete handler
        setLoading(false);

        // Get the iframe content window
        const iframeWindow = iframeRef.current.contentWindow;

        console.log("Iframe loaded successfully");

        // Let's modify the checkout.html to ensure postMessage works properly
        if (iframeWindow && iframeWindow.postMessage) {
          // Just for debugging - the real communication should happen in checkout.html
          console.log("Iframe window is accessible");
        }
      } catch (err) {
        console.error("Error setting up iframe listener:", err);
        setError("Failed to initialize checkout page.");
      }
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading payment gateway...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorDismiss} onPress={() => setError(null)}>
            Dismiss
          </Text>
        </View>
      )}

      {Platform.OS === "web" ? (
        <iframe
          ref={iframeRef}
          src={checkoutUrl}
          onLoad={setupIframeListener}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          title="Checkout"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{
            uri: checkoutUrl,
          }}
          onLoad={() => setLoading(false)}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          style={styles.webview}
          injectedJavaScript={`
            (function() {
              window.onerror = function(message) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: message
                }));
                return true;
              };
              const originalFetch = window.fetch;
              window.fetch = function() {
                const result = originalFetch.apply(this, arguments);
                if (arguments[0].includes('/api/payment')) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'payment_started' }));
                }
                return result;
              };
            })();
            true;
          `}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    ...(Platform.OS === "web"
      ? {
          height: "100vh", // Use viewport height for web
          width: "100%",
        }
      : {}),
  },
  webview: { flex: 1 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },
  loadingText: { marginTop: 10, color: "#333", fontSize: 16 },
  errorContainer: {
    padding: 12,
    backgroundColor: "#ffe6e6",
    borderBottomWidth: 1,
    borderBottomColor: "#ff9999",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: { color: "#d32f2f", fontWeight: "600", flex: 1 },
  errorDismiss: { color: "#d32f2f", fontWeight: "bold", padding: 5 },
});

export default CheckoutScreen;
