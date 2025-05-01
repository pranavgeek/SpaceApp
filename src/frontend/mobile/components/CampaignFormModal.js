import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  fetchProducts, 
  createCampaignRequest,
  createAdminAction 
} from "../backend/db/API";

const CampaignFormModal = ({ visible, onClose, influencerId, influencerName }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const styles = getStyles(colors, isDarkMode);
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [commission, setCommission] = useState("10");
  const [duration, setDuration] = useState("14");
  const [details, setDetails] = useState("");
  
  useEffect(() => {
    // Load seller's products when modal opens
    if (visible) {
      loadSellerProducts();
    }
  }, [visible]);
  
  const loadSellerProducts = async () => {
    setLoadingProducts(true);
    try {
      // Fetch seller's products
      const fetchedProducts = await fetchProducts();
      const sellerProducts = fetchedProducts.filter(
        p => p.user_seller === user.user_id && p.verified === true
      );
      setProducts(sellerProducts);
      
      // If products are available, select the first one by default
      if (sellerProducts.length > 0) {
        setSelectedProduct(sellerProducts[0]);
      }
    } catch (error) {
      console.error("Error loading seller products:", error);
      Alert.alert("Error", "Failed to load your products");
    } finally {
      setLoadingProducts(false);
    }
  };
  
  const renderProductItem = (product) => {
    const isSelected = selectedProduct && selectedProduct.product_id === product.product_id;
    
    return (
      <TouchableOpacity
        key={product.product_id}
        style={[
          styles.productItem,
          isSelected && styles.selectedProductItem
        ]}
        onPress={() => setSelectedProduct(product)}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.product_name}</Text>
          <Text style={styles.productPrice}>${product.cost}</Text>
        </View>
        <View style={styles.radioButton}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };
  
  const handleSubmit = async () => {
    if (!selectedProduct) {
      Alert.alert("Error", "Please select a product for this campaign");
      return;
    }
    
    if (!commission || isNaN(parseInt(commission)) || parseInt(commission) <= 0) {
      Alert.alert("Error", "Please enter a valid commission percentage");
      return;
    }
    
    if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      Alert.alert("Error", "Please enter a valid campaign duration in days");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Creating campaign request...");
      
      // Create campaign request object
      const requestId = Date.now().toString();
      const campaignRequest = {
        requestId: requestId,
        influencerId: influencerId,
        influencerName: influencerName,
        sellerId: user.id || user.user_id.toString(),
        sellerName: user.name,
        productId: selectedProduct.product_id.toString(),
        productName: selectedProduct.product_name,
        productImage: selectedProduct.product_image || "",
        productPrice: selectedProduct.cost || 0,
        commission: parseInt(commission),
        campaignDetails: details || `Request for ${influencerName} to promote ${selectedProduct.product_name}`,
        campaignDuration: parseInt(duration),
        status: "Pending",
        timestamp: new Date().toISOString(),
      };
      
      console.log("Campaign request data:", campaignRequest);
      
      // 1. Use the API function to create campaign request
      const createdRequest = await createCampaignRequest(campaignRequest);
      console.log("Campaign request created:", createdRequest);
      
      // 2. Create an admin action for approval
      const adminActionDetails = {
        campaignRequestId: requestId,
        productName: selectedProduct.product_name,
        influencerName: influencerName,
        sellerName: user.name,
        campaignDuration: parseInt(duration),
        commission: parseInt(commission)
      };

      const adminAction = {
        action: "Campaign Approval Request",
        user_id: user.id || user.user_id.toString(),
        status: "pending", // Admin needs to approve or reject
        date_timestamp: new Date().toISOString(),
        details: JSON.stringify(adminActionDetails)
      };

      console.log("Creating admin action:", adminAction);
      await createAdminAction(adminAction);
      console.log("Admin action created successfully");
      
      // 3. Update the collaboration request status to Accepted
      await updateCollaborationRequestStatus(influencerId);
      console.log("Collaboration request status updated");
      
      // 4. Send message to influencer
      await sendMessageToInfluencer(influencerName, selectedProduct.product_name);
      console.log("Message sent to influencer");
      
      // 5. Show success message
      Alert.alert(
        "Campaign Created",
        `Your campaign request with ${influencerName} has been sent and is pending admin approval.`,
        [{ text: "OK", onPress: onClose }]
      );
    } catch (error) {
      console.error("Error creating campaign:", error);
      Alert.alert("Error", "Failed to create campaign request");
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to update collaboration request status
  const updateCollaborationRequestStatus = async (influencerId) => {
    try {
      // Get existing collaboration requests
      const stored = await AsyncStorage.getItem("collaborationRequests");
      const allRequests = stored ? JSON.parse(stored) : [];
      
      // Update status of any matching requests from this influencer
      const updatedRequests = allRequests.map(req => {
        if (req.influencerId === influencerId && req.sellerId === (user.id || user.user_id.toString())) {
          return { ...req, status: "Accepted", statusUpdatedAt: new Date().toISOString() };
        }
        return req;
      });
      
      // Save updated requests
      await AsyncStorage.setItem("collaborationRequests", JSON.stringify(updatedRequests));
    } catch (error) {
      console.error("Error updating collaboration request status:", error);
    }
  };
  
  // Helper function to send message to influencer
  const sendMessageToInfluencer = async (influencerName, productName) => {
    try {
      const storedMessages = await AsyncStorage.getItem("messages");
      const existingMessages = storedMessages ? JSON.parse(storedMessages) : [];
      
      const newMessage = {
        message_id: Date.now(),
        user_from: user.name,
        user_to: influencerName,
        type_message: "text",
        message_content: `I've created a campaign for you to promote my product "${productName}". It's pending admin approval. I'll notify you when it's approved!`,
        date_timestamp_sent: new Date().toISOString(),
        is_read: false,
      };
      
      existingMessages.push(newMessage);
      await AsyncStorage.setItem("messages", JSON.stringify(existingMessages));
    } catch (error) {
      console.error("Error sending message to influencer:", error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Campaign</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Form Content */}
          <ScrollView style={styles.scrollContent}>
            {/* Influencer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Influencer Details</Text>
              <View style={styles.influencerCard}>
                <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                <Text style={styles.influencerName}>{influencerName}</Text>
              </View>
            </View>
            
            {/* Product Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Product</Text>
              
              {loadingProducts ? (
                <ActivityIndicator style={styles.loading} color={colors.primary} />
              ) : products.length === 0 ? (
                <Text style={styles.noProductsText}>
                  You don't have any verified products yet. Please add and verify products first.
                </Text>
              ) : (
                <View style={styles.productsList}>
                  {products.map(renderProductItem)}
                </View>
              )}
            </View>
            
            {/* Campaign Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Campaign Details</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Commission (%)</Text>
                <TextInput
                  style={styles.input}
                  value={commission}
                  onChangeText={setCommission}
                  keyboardType="numeric"
                  placeholder="Enter commission percentage"
                  placeholderTextColor={colors.subtitle}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Duration (days)</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="Enter campaign duration"
                  placeholderTextColor={colors.subtitle}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Additional Details</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  placeholder="Enter any specific requirements or details"
                  placeholderTextColor={colors.subtitle}
                  textAlignVertical="top"
                />
              </View>
              
              {/* Info about admin approval */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.infoText}>
                  Your campaign request will be sent to the admin for approval. Once approved, the influencer will be notified.
                </Text>
              </View>
            </View>
          </ScrollView>
          
          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || loadingProducts || products.length === 0) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={loading || loadingProducts || products.length === 0}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.submitButtonText}>Create Campaign</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  influencerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  influencerName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
  productsList: {
    marginBottom: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  },
  selectedProductItem: {
    backgroundColor: isDarkMode ? 'rgba(66, 135, 245, 0.2)' : 'rgba(66, 135, 245, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: colors.subtitle,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border || '#eee',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  noProductsText: {
    textAlign: 'center',
    padding: 16,
    color: colors.subtitle,
  },
  loading: {
    padding: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border || '#eee',
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? 'rgba(66, 135, 245, 0.1)' : 'rgba(66, 135, 245, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },
});

export default CampaignFormModal;