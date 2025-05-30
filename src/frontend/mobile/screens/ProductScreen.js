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

  // Helper function to check if a product is verified
  const isProductVerified = (product) => {
    return product.verified === true || 
           product.verified === 1 || 
           product.verified === "true" ||
           product.verified === "1";
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log(`🔄 Loading products for seller ID: ${sellerId} (type: ${typeof sellerId})`);
        
        const allProducts = await fetchProducts();
        console.log(`📦 Total fetched products: ${allProducts.length}`);
        
        // Debug: Show all products and their sellers
        console.log('🔍 All products and their sellers:');
        allProducts.forEach(product => {
          console.log(`   - ${product.product_name}: seller=${product.user_seller} (type: ${typeof product.user_seller}), verified=${product.verified}`);
        });
        
        // Filter products by seller ID with multiple comparison methods
        const sellerProducts = allProducts.filter(product => {
          const productSellerId = product.user_seller;
          
          // Try multiple comparison methods to handle different data types
          const exactMatch = productSellerId === sellerId;
          const stringMatch = String(productSellerId) === String(sellerId);
          const numberMatch = Number(productSellerId) === Number(sellerId);
          
          const isSellerMatch = exactMatch || stringMatch || numberMatch;
          
          if (isSellerMatch) {
            console.log(`✅ Found seller product: ${product.product_name} (verified: ${product.verified})`);
            console.log(`   Match type: exact=${exactMatch}, string=${stringMatch}, number=${numberMatch}`);
          }
          
          return isSellerMatch;
        });
        
        console.log(`🎯 Filtered seller products count: ${sellerProducts.length}`);
        
        // If no products found, show detailed comparison info
        if (sellerProducts.length === 0) {
          console.warn(`⚠️ No products found for seller ${sellerId}. Detailed comparison:`);
          allProducts.forEach(product => {
            const productSellerId = product.user_seller;
            console.log(`   Product: ${product.product_name}`);
            console.log(`     - Product seller: ${productSellerId} (${typeof productSellerId})`);
            console.log(`     - Looking for: ${sellerId} (${typeof sellerId})`);
            console.log(`     - String comparison: "${String(productSellerId)}" === "${String(sellerId)}" -> ${String(productSellerId) === String(sellerId)}`);
            console.log(`     - Number comparison: ${Number(productSellerId)} === ${Number(sellerId)} -> ${Number(productSellerId) === Number(sellerId)}`);
          });
        }
        
        setProducts(sellerProducts);
        
        // Count verified products with robust logic
        const verifiedProducts = sellerProducts.filter(product => {
          const isVerified = isProductVerified(product);
          if (isVerified) {
            console.log(`✓ Verified product: ${product.product_name}`);
          } else {
            console.log(`❌ Unverified product: ${product.product_name} (verified value: ${product.verified})`);
          }
          return isVerified;
        });
        
        setVerifiedCount(verifiedProducts.length);
        
        // Enhanced debug logging
        console.log(`📊 Seller ${sellerId} summary:`);
        console.log(`   - Total products: ${sellerProducts.length}`);
        console.log(`   - Verified products: ${verifiedProducts.length}`);
        console.log(`   - Unverified products: ${sellerProducts.length - verifiedProducts.length}`);
        
        // Show verification status of all products for debugging
        if (sellerProducts.length > 0) {
          console.log('📋 Product verification details:');
          sellerProducts.forEach(product => {
            console.log(`   - ${product.product_name}: verified=${product.verified} (${typeof product.verified}) -> ${isProductVerified(product)}`);
          });
        }
        
      } catch (error) {
        console.error('❌ Error loading seller products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      loadData();
    } else {
      console.error('❌ No sellerId provided to ProductScreen');
      setLoading(false);
    }
  }, [sellerId]);

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetails', { productId: product.product_id });
  };

  const renderProductItem = ({ item }) => {
    const verified = isProductVerified(item);
    
    return (
      <TouchableOpacity 
        style={[styles.productCard, verified ? styles.verifiedCard : null]} 
        onPress={() => handleProductPress(item)}
      >
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.product_name}</Text>
          {verified && (
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
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Container */}
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
          <Text style={styles.emptyText}>No products found for this seller</Text>
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
  debugSection: {
    backgroundColor: colors.cardBackground,
    margin: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },
  debugHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 10,
    color: colors.subtitle,
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default ProductScreen;