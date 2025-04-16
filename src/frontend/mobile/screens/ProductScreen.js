import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { fetchProducts, getVerifiedProductsCount } from '../backend/db/API';

const ProductScreen = ({ navigation, route }) => {
  const { sellerId } = route.params || {};
  const [products, setProducts] = useState([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allProducts = await fetchProducts();
        
        // Filter products by seller ID
        const sellerProducts = allProducts.filter(
          product => product.user_seller === sellerId
        );
        
        setProducts(sellerProducts);
        
        // Get verified products count
        const count = await getVerifiedProductsCount(sellerId);
        setVerifiedCount(count);
      } catch (error) {
        console.error('Error loading seller products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sellerId]);

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { productId: product.product_id });
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.productCard, item.verified ? styles.verifiedCard : null]} 
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.product_name}</Text>
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productDetails}>
        <Text style={styles.productPrice}>${item.cost}</Text>
        <Text style={styles.productCategory}>{item.category || 'Uncategorized'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{verifiedCount}</Text>
          <Text style={styles.statLabel}>Verified Products</Text>
        </View>
      </View>
      
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.product_id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products found</Text>
        }
      />
    </View>
  );
};

const getDynamicStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: colors.cardBackground,
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    elevation: 2,
  },
  statBox: {
    alignItems: 'center',
    padding: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.subtitle,
    marginTop: 4,
  },
  list: {
    padding: 10,
  },
  productCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  verifiedCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardHeaderBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    marginLeft: 4,
    color: colors.primary,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  productCategory: {
    fontSize: 14,
    color: colors.subtitle,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.subtitle,
  },
});

export default ProductScreen;