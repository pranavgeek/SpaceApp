// PayoutScreen.js - Enhanced with Campaign-based Earnings and Stripe Integration
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { 
  fetchCampaignRequests, 
  fetchUserOrders, 
  getSellerReceivedOrders,
  BASE_URL 
} from '../backend/db/API';

const PayoutScreen = () => {
  const [activeTab, setActiveTab] = useState('Summary');
  const [payoutData, setPayoutData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  
  // Get current user and theme
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors);
  
  // Determine user type and role
  const userType = user?.role || user?.account_type?.toLowerCase() || 'buyer';
  const isInfluencer = userType === 'influencer';
  const isSeller = userType === 'seller';

  useEffect(() => {
    loadEarningsData();
    checkStripeConnection();
  }, [user]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      
      if (isInfluencer) {
        await loadInfluencerEarnings();
      } else if (isSeller) {
        await loadSellerEarnings();
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const loadInfluencerEarnings = async () => {
    try {
      // Fetch all campaigns where user is the influencer
      const allCampaigns = await fetchCampaignRequests();
      const userCampaigns = allCampaigns.filter(
        campaign => String(campaign.influencerId) === String(user.user_id) &&
        (campaign.status === 'Accepted' || 
         (typeof campaign.status === 'object' && campaign.status.status === 'Accepted'))
      );

      console.log(`Found ${userCampaigns.length} campaigns for influencer ${user.user_id}`);

      // Calculate earnings from each campaign
      const earningsData = [];
      const detailsData = [];
      let totalEarningsCalc = 0;
      let availableBalanceCalc = 0;
      let pendingBalanceCalc = 0;

      for (const campaign of userCampaigns) {
        // Get campaign dates
        const startDate = typeof campaign.status === 'object' && campaign.status.campaignStartDate
          ? new Date(campaign.status.campaignStartDate)
          : new Date(campaign.statusUpdatedAt || campaign.timestamp);
        
        const endDate = typeof campaign.status === 'object' && campaign.status.campaignEndDate
          ? new Date(campaign.status.campaignEndDate)
          : new Date(startDate.getTime() + (campaign.campaignDuration * 24 * 60 * 60 * 1000));

        // Check if campaign is completed
        const isCompleted = new Date() > endDate;
        
        // Calculate potential earnings based on product price and commission
        const productPrice = campaign.productPrice || 0;
        const commissionRate = campaign.commission || 0;
        const potentialEarning = (productPrice * commissionRate) / 100;

        // For demo purposes, assume some campaigns generated sales
        // In real implementation, this would come from actual sales data
        const simulatedSales = Math.floor(Math.random() * 5) + 1; // 1-5 sales
        const actualEarnings = potentialEarning * simulatedSales;

        totalEarningsCalc += actualEarnings;

        if (isCompleted) {
          availableBalanceCalc += actualEarnings;
        } else {
          pendingBalanceCalc += actualEarnings;
        }

        // Add to monthly chart data
        const monthKey = startDate.toLocaleDateString('en-US', { month: 'short' });
        const existingMonth = earningsData.find(item => item.month === monthKey);
        if (existingMonth) {
          existingMonth.amount += actualEarnings;
        } else {
          earningsData.push({ month: monthKey, amount: actualEarnings });
        }

        // Add to details table
        detailsData.push({
          type: 'Commission',
          item: campaign.productName,
          description: `${commissionRate}% commission (${simulatedSales} sales)`,
          payout: `$${actualEarnings.toFixed(2)}`,
          status: isCompleted ? 'Completed' : 'Active',
          date: startDate.toLocaleDateString(),
          campaignId: campaign.requestId,
          commissionRate,
          sales: simulatedSales
        });
      }

      setPayoutData(earningsData.slice(-6)); // Last 6 months
      setTableData(detailsData);
      setTotalEarnings(totalEarningsCalc);
      setAvailableBalance(availableBalanceCalc);
      setPendingBalance(pendingBalanceCalc);

    } catch (error) {
      console.error('Error loading influencer earnings:', error);
    }
  };

  const loadSellerEarnings = async () => {
    try {
      // Fetch orders where user is the seller
      const receivedOrders = await getSellerReceivedOrders(user.user_id);
      
      console.log(`Found ${receivedOrders.length} orders for seller ${user.user_id}`);

      // Calculate earnings from orders
      const earningsData = [];
      const detailsData = [];
      let totalEarningsCalc = 0;
      let availableBalanceCalc = 0;
      let pendingBalanceCalc = 0;

      for (const order of receivedOrders) {
        const orderDate = new Date(order.order_date);
        const orderAmount = parseFloat(order.total_amount || 0);
        
        // Check if order is completed (has tracking info)
        const isCompleted = !!order.tracking_link;
        
        // Platform fee (assume 5% platform fee for sellers)
        const platformFee = orderAmount * 0.05;
        const sellerEarnings = orderAmount - platformFee;

        totalEarningsCalc += sellerEarnings;

        if (isCompleted) {
          availableBalanceCalc += sellerEarnings;
        } else {
          pendingBalanceCalc += sellerEarnings;
        }

        // Add to monthly chart data
        const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short' });
        const existingMonth = earningsData.find(item => item.month === monthKey);
        if (existingMonth) {
          existingMonth.amount += sellerEarnings;
        } else {
          earningsData.push({ month: monthKey, amount: sellerEarnings });
        }

        // Add to details table
        detailsData.push({
          type: 'Sale',
          item: order.product_name,
          description: `Order #${order.order_id} (Platform fee: $${platformFee.toFixed(2)})`,
          payout: `$${sellerEarnings.toFixed(2)}`,
          status: isCompleted ? 'Completed' : 'Pending',
          date: orderDate.toLocaleDateString(),
          orderId: order.order_id,
          platformFee: platformFee.toFixed(2)
        });
      }

      setPayoutData(earningsData.slice(-6)); // Last 6 months
      setTableData(detailsData);
      setTotalEarnings(totalEarningsCalc);
      setAvailableBalance(availableBalanceCalc);
      setPendingBalance(pendingBalanceCalc);

    } catch (error) {
      console.error('Error loading seller earnings:', error);
    }
  };

  const checkStripeConnection = async () => {
    try {
      const response = await fetch(`${BASE_URL}/stripe/account-status/${user.user_id}`);
      const data = await response.json();
      setStripeConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking Stripe connection:', error);
      setStripeConnected(false);
    }
  };

  const connectToStripe = async () => {
    try {
      const response = await fetch(`${BASE_URL}/stripe/connect-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id,
          email: user.email,
          userType: userType
        })
      });

      const data = await response.json();
      
      if (data.accountLink) {
        // In a real app, you'd open this URL in a WebView or browser
        Alert.alert(
          'Connect to Stripe',
          'You will be redirected to Stripe to complete your account setup.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => {
                // Open Stripe Connect URL
                console.log('Open Stripe URL:', data.accountLink);
                // For demo, just set as connected
                setStripeConnected(true);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      Alert.alert('Error', 'Failed to connect to Stripe');
    }
  };

  const requestPayout = async (amount) => {
    if (!stripeConnected) {
      Alert.alert('Setup Required', 'Please connect your Stripe account first');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/stripe/create-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.user_id,
          amount: amount * 100, // Convert to cents
          currency: 'usd'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', `Payout of $${amount} has been initiated!`);
        setPayoutModalVisible(false);
        loadEarningsData(); // Refresh data
      } else {
        Alert.alert('Error', data.error || 'Failed to process payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      Alert.alert('Error', 'Failed to process payout request');
    }
  };

  const renderSummaryCards = () => (
    <View style={styles.summaryCards}>
      <View style={styles.summaryCard}>
        <Ionicons name="wallet-outline" size={24} color={colors.primary} />
        <Text style={styles.summaryCardTitle}>Total Earnings</Text>
        <Text style={styles.summaryCardAmount}>${totalEarnings.toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryCard}>
        <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
        <Text style={styles.summaryCardTitle}>Available</Text>
        <Text style={[styles.summaryCardAmount, { color: colors.success }]}>
          ${availableBalance.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.summaryCard}>
        <Ionicons name="time-outline" size={24} color={colors.warning} />
        <Text style={styles.summaryCardTitle}>Pending</Text>
        <Text style={[styles.summaryCardAmount, { color: colors.warning }]}>
          ${pendingBalance.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderChart = () => {
    if (!payoutData || payoutData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.subtitle} />
          <Text style={styles.emptyChartText}>No earnings data available</Text>
        </View>
      );
    }
    
    const maxAmount = Math.max(...payoutData.map(item => item.amount));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Earnings</Text>
        <View style={styles.chartBars}>
          {payoutData.map((item, index) => {
            const barHeight = maxAmount > 0 ? (item.amount / maxAmount) * 120 : 0;
            return (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.bar, { height: barHeight, backgroundColor: colors.primary }]} />
                <Text style={styles.barLabel}>{item.month}</Text>
                <Text style={styles.barAmount}>${item.amount.toFixed(0)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDetailsTable = () => (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Type</Text>
        <Text style={styles.tableHeaderCell}>Item</Text>
        <Text style={styles.tableHeaderCell}>Amount</Text>
        <Text style={styles.tableHeaderCell}>Status</Text>
      </View>
      
      <ScrollView style={styles.tableBody}>
        {tableData.map((row, index) => (
          <TouchableOpacity key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{row.type}</Text>
            <Text style={[styles.tableCell, styles.itemCell]} numberOfLines={2}>
              {row.item}
            </Text>
            <Text style={[styles.tableCell, styles.amountCell]}>{row.payout}</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: row.status === 'Completed' ? colors.success : colors.warning }
              ]}>
                <Text style={styles.statusText}>{row.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPayoutModal = () => (
    <Modal
      visible={payoutModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setPayoutModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Payout</Text>
            <TouchableOpacity onPress={() => setPayoutModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.availableText}>
              Available Balance: ${availableBalance.toFixed(2)}
            </Text>
            
            {!stripeConnected ? (
              <View style={styles.stripeSetup}>
                <Ionicons name="card-outline" size={48} color={colors.primary} />
                <Text style={styles.stripeSetupText}>
                  Connect your Stripe account to receive payouts
                </Text>
                <TouchableOpacity style={styles.stripeButton} onPress={connectToStripe}>
                  <Text style={styles.stripeButtonText}>Connect Stripe Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.payoutOptions}>
                <TouchableOpacity 
                  style={styles.payoutOption}
                  onPress={() => requestPayout(availableBalance)}
                >
                  <Text style={styles.payoutOptionText}>
                    Withdraw Full Amount (${availableBalance.toFixed(2)})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.payoutOption}
                  onPress={() => requestPayout(availableBalance / 2)}
                >
                  <Text style={styles.payoutOptionText}>
                    Withdraw Half (${(availableBalance / 2).toFixed(2)})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading earnings data...</Text>
        </View>
      );
    }

    if (!isInfluencer && !isSeller) {
      return (
        <View style={styles.notApplicable}>
          <Ionicons name="information-circle-outline" size={48} color={colors.subtitle} />
          <Text style={styles.notApplicableText}>
            Payout tracking is available for sellers and influencers only
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'Summary':
        return (
          <ScrollView style={styles.tabContent}>
            {renderSummaryCards()}
            {renderChart()}
          </ScrollView>
        );
        
      case 'Details':
        return (
          <View style={styles.tabContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.tabTitle}>Earnings Details</Text>
              <Text style={styles.detailsSubtitle}>
                {isInfluencer ? 'Commission from campaigns' : 'Revenue from sales'}
              </Text>
            </View>
            {renderDetailsTable()}
          </View>
        );
        
      case 'Payout':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Payout Options</Text>
            
            <View style={styles.payoutSetup}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>Available for Payout</Text>
                <Text style={styles.balanceAmount}>${availableBalance.toFixed(2)}</Text>
              </View>
              
              <View style={styles.stripeStatus}>
                <View style={styles.stripeStatusRow}>
                  <Ionicons 
                    name={stripeConnected ? "checkmark-circle" : "alert-circle"} 
                    size={24} 
                    color={stripeConnected ? colors.success : colors.warning} 
                  />
                  <Text style={styles.stripeStatusText}>
                    Stripe Account: {stripeConnected ? 'Connected' : 'Not Connected'}
                  </Text>
                </View>
                
                {!stripeConnected && (
                  <TouchableOpacity style={styles.connectButton} onPress={connectToStripe}>
                    <Text style={styles.connectButtonText}>Setup Payout Account</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.requestPayoutButton,
                  (!stripeConnected || availableBalance <= 0) && styles.disabledButton
                ]}
                onPress={() => setPayoutModalVisible(true)}
                disabled={!stripeConnected || availableBalance <= 0}
              >
                <Ionicons name="wallet-outline" size={20} color={colors.buttonText} />
                <Text style={styles.requestPayoutButtonText}>Request Payout</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isInfluencer ? 'Influencer Earnings' : isSeller ? 'Seller Revenue' : 'Payouts'}
        </Text>
      </View>
      
      <View style={styles.tabBar}>
        {['Summary', 'Details', 'Payout'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text 
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {renderContent()}
      {renderPayoutModal()}
    </SafeAreaView>
  );
};

const getDynamicStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTabBuffer: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: colors.subtitle,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.subtitle,
  },
  notApplicable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.background,
  },
  notApplicableText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.subtitle,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Summary Cards
  summaryCards: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardTitle: {
    fontSize: 12,
    color: colors.subtitle,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  
  // Chart
  chartContainer: {
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: colors.subtitle,
    marginBottom: 4,
  },
  barAmount: {
    fontSize: 10,
    color: colors.subtitle,
    fontWeight: '500',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.subtitle,
  },
  
  // Details Table
  detailsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailsSubtitle: {
    fontSize: 14,
    color: colors.subtitle,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: colors.card,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableCell: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  itemCell: {
    fontWeight: '500',
  },
  amountCell: {
    fontWeight: '600',
    color: colors.success,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  
  // Payout Section
  payoutSetup: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceTitle: {
    fontSize: 16,
    color: colors.subtitle,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
  },
  stripeStatus: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stripeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stripeStatusText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  requestPayoutButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: colors.subtitle,
    opacity: 0.5,
  },
  requestPayoutButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  availableText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  stripeSetup: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  stripeSetupText: {
    fontSize: 16,
    color: colors.subtitle,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  stripeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  stripeButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  payoutOptions: {
    gap: 12,
  },
  payoutOption: {
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payoutOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});

export default PayoutScreen;