import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProjectId } from '../context/projectIdHelper';

export default function FavoritesScreen({ navigation }) {
  const { getWishlist, loading, toggleWishlistItem } = useWishlist();
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [refreshKey, setRefreshKey] = React.useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prevKey) => prevKey + 1);
    }, [])
  );

  const wishlistItems = getWishlist().filter(
    (item) => item && item.project && getProjectId(item.project)
  );

  const styles = getStyles(colors);

  const handleProjectPress = (item) => {
    navigation.navigate('ProjectDetail', { item });
  };

  const handleRemoveFromWishlist = (item) => {
    Alert.alert('Remove from Wishlist', 'Are you sure you want to remove this item from your wishlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => toggleWishlistItem(item),
        style: 'destructive',
      },
    ]);
  };

  const handleAddToCart = (item) => {
    const projectId = getProjectId(item.project);
    const buyerId = parseInt(user?.user_id);
    const sellerId = parseInt(item.project.user_seller);
    const productId = item.project.product_id || item.project.id || item.id;

    const cartItem = {
      ...item.project,
      cartItemId: projectId,
      seller_id: sellerId,
      buyer_id: buyerId,
      product_id: productId,
    };

    addToCart(cartItem);
    Alert.alert('Success', 'Item added to cart!');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={colors.subtitle} />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite projects for later by tapping the heart icon
          </Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.browseButtonText}>Browse Projects</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderWishlistItem = ({ item }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => handleProjectPress(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.project.image }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.project.name}
          </Text>
          <Text style={styles.itemPrice}>${parseFloat(item.project.price).toFixed(2)}</Text>
          <Text style={styles.itemCategory} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleAddToCart(item)}>
          <Ionicons name="cart-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleRemoveFromWishlist(item)}>
          <Ionicons name="heart" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} key={refreshKey}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.itemCount}>
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <FlatList
        data={wishlistItems}
        keyExtractor={(item, index) => `wishlist-${index}-${getProjectId(item.project)}`}
        renderItem={renderWishlistItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}


const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.baseContainerBody,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  itemCount: {
    fontSize: 14,
    color: colors.subtitle,
  },
  listContent: {
    padding: 16,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 90,
    height: 90,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  itemDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.subtitle,
  },
  itemActions: {
    borderLeftWidth: 1,
    borderLeftColor: colors.baseContainerBody,
    padding: 10,
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.subtitle,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.subtitle,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
});