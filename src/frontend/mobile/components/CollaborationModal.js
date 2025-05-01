import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Modalize } from "react-native-modalize";
import Swiper from "react-native-deck-swiper";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { fetchUsers, createCollaborationRequest } from "../backend/db/API";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_HEIGHT = Platform.OS === "web" ? SCREEN_HEIGHT * 0.4 : SCREEN_HEIGHT * 0.40;

const CollaborationModal = ({ modalRef, isVisible }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swipedAll, setSwipedAll] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const swiperRef = useRef(null);

  const styles = getDynamicStyles(colors);

  useEffect(() => {
    if (isVisible) {
      loadSellers();
    }
  }, [isVisible]);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const users = await fetchUsers();
      const filteredSellers = users.filter(
        (u) => u.account_type === "Seller"
      );
      
      setSellers(filteredSellers);
      setSwipedAll(filteredSellers.length === 0);
    } catch (err) {
      console.error("Failed to fetch sellers", err);
      Alert.alert("Error", "Failed to load potential collaborators");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeRight = async (cardIndex) => {
    const selectedSeller = sellers[cardIndex];
    
    // Prevent duplicate swipes to the same seller
    if (isSending) {
      return;
    }
    
    setIsSending(true);
    
    try {
      // Create the collaboration request directly on the backend
      const request = {
        requestId: Date.now().toString(),
        sellerId: selectedSeller.user_id.toString(),
        sellerName: selectedSeller.name,
        influencerId: user.id || user.user_id.toString(),
        influencerName: user.name,
        product: "Collaboration Request",
        status: "Pending",
        timestamp: new Date().toISOString()
      };
      
      console.log("Sending collaboration request:", request);
      
      // Send to the backend
      const createdRequest = await createCollaborationRequest(request);
      console.log("Created request:", createdRequest);

      // Show success message
      showCollaboationSuccessIndicator(selectedSeller.name);
    } catch (error) {
      console.error("Error sending request:", error);
      Alert.alert("Error", "Something went wrong while sending your request.");
    } finally {
      setIsSending(false);
    }
  };

  // Success indicator that appears briefly
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  const showCollaboationSuccessIndicator = (name) => {
    setSuccessMessage(`Collaboration request sent to ${name}!`);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const renderCard = (seller) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: seller.profile_image?.startsWith("http")
            ? seller.profile_image
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=random`,
        }}
        style={styles.cardImage}
      />
      <Text style={styles.cardTitle}>{seller.name}</Text>
      <Text style={styles.cardSubtitle}>
        {seller.about_us || "No description available"}
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <FontAwesome5 name="briefcase" size={16} color={colors.primary} />
          <Text style={styles.statText}>Products: {Math.floor(Math.random() * 10) + 1}</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="star" size={16} color="#FFD700" />
          <Text style={styles.statText}>Rating: {(Math.random() * 2 + 3).toFixed(1)}/5</Text>
        </View>
      </View>
    </View>
  );

  const handleAllSwiped = () => {
    setSwipedAll(true);
  };

  return (
    <Modalize
      ref={modalRef}
      snapPoint={620}
      modalHeight={620}
      modalStyle={styles.modalContainer}
      handleStyle={{
        backgroundColor: colors.subtitle + "50",
        width: 80,
      }}
      HeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FontAwesome5 name="handshake" size={24} color={colors.primary} style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Collaboration</Text>
          </View>
          <TouchableOpacity onPress={() => modalRef.current?.close()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Finding potential collaborations...</Text>
          </View>
        ) : sellers.length === 0 ? (
          <View style={styles.noMoreContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }} 
              style={styles.noMoreImage} 
            />
            <Text style={styles.noMoreTitle}>No Sellers Found</Text>
            <Text style={styles.noMoreText}>
              There are no sellers available for collaboration at this time.
              Check back later for new opportunities!
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadSellers}>
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : swipedAll ? (
          <View style={styles.noMoreContainer}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }} 
              style={styles.noMoreImage} 
            />
            <Text style={styles.noMoreTitle}>All Profiles Viewed</Text>
            <Text style={styles.noMoreText}>
              You've seen all sellers for now.
              Check back later for new partnership opportunities!
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadSellers}>
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.instructionHeader}>
              Discover new collaboration opportunities
            </Text>
            
            <View style={styles.swiperWrapper}>
              <Swiper
                ref={swiperRef}
                cards={sellers}
                renderCard={renderCard}
                onSwipedRight={handleSwipeRight}
                onSwipedAll={handleAllSwiped}
                cardIndex={0}
                backgroundColor="transparent"
                stackSize={3}
                stackSeparation={14}
                cardVerticalMargin={10}
                verticalSwipe={false}
                containerStyle={styles.swiperContainerStyle}
                cardStyle={styles.swiperCardStyle}
                overlayLabels={{
                  left: {
                    title: 'Skip',
                    style: {
                      label: {
                        backgroundColor: "#FF6B6B",
                        color: "white",
                        fontSize: 24,
                        borderRadius: 10,
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start',
                        marginTop: 30,
                        marginLeft: -30,
                      }
                    }
                  },
                  right: {
                    title: 'Collab',
                    style: {
                      label: {
                        backgroundColor: "#4CAF50",
                        color: "white",
                        fontSize: 24,
                        borderRadius: 10,
                      },
                      wrapper: {
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        marginTop: 30,
                        marginLeft: 30,
                      }
                    }
                  }
                }}
              />
            </View>
            
            {/* Fixed buttons below the swiper */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.skipButton]}
                onPress={() => swiperRef.current?.swipeLeft()}
                disabled={isSending}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.connectButton,
                  isSending && styles.disabledButton
                ]}
                onPress={() => swiperRef.current?.swipeRight()}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="checkmark" size={24} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {/* Success indicator */}
        {showSuccess && (
          <View style={styles.successIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
      </View>
    </Modalize>
  );
};

const getDynamicStyles = (colors) => StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    marginBottom: 16,
  },
  instructionHeader: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.subtitle,
    marginBottom: 15,
  },
  swiperWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80, // Space for buttons
    height: CARD_HEIGHT + 40,
  },
  swiperContainerStyle: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swiperCardStyle: {
    top: 0,
    height: CARD_HEIGHT,
    width: '89%',
    borderRadius: 16,
    alignSelf: 'center',
  },
  card: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.cardBackground || "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    position: 'relative',
  },
  alreadyRequestedBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginVertical: 10,
  },
  alreadyRequestedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    color: colors.subtitle,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: colors.cardBackground ? colors.cardBackground + '80' : '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statText: {
    marginLeft: 6,
    color: colors.text,
    fontWeight: '500',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 20,
  },
  skipButton: {
    backgroundColor: "#FF6B6B",
  },
  connectButton: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    backgroundColor: "#4CAF50AA",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    color: colors.subtitle,
    fontSize: 16,
  },
  noMoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noMoreImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
    opacity: 0.7,
  },
  noMoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  noMoreText: {
    fontSize: 16,
    color: colors.subtitle,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#FFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  successIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CollaborationModal;