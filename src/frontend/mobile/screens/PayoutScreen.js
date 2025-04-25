// PayoutScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const PayoutScreen = () => {
  const [activeTab, setActiveTab] = useState('Summary');
  const [payoutData, setPayoutData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [payoutOption, setPayoutOption] = useState('');
  const [filter, setFilter] = useState('');
  
  // Get current user from AuthContext
  const { currentUser } = useAuth();
  
  // Determine user type from current user
  const userType = currentUser?.userType || 'seller'; // Default to seller if not specified

  // Load different data based on user type
  useEffect(() => {
    // In a real app, this would fetch from your API with the user's ID
    loadUserData(userType);
  }, [userType]);

  const loadUserData = (type) => {
    // Sample data - replace with actual API calls
    const data = {
      seller: {
        chartData: [
          { month: 'Jan', amount: 1000 },
          { month: 'Feb', amount: 1500 },
          { month: 'Mar', amount: 1200 },
          { month: 'Apr', amount: 1800 },
          { month: 'May', amount: 2200 },
          { month: 'Jun', amount: 2000 }
        ],
        detailsData: [
          { type: 'Sale', item: 'Product A', description: 'Direct sale', payout: '$120' },
          { type: 'Sale', item: 'Product B', description: 'Online sale', payout: '$85' },
          { type: 'Commission', item: 'Product C', description: 'Marketplace fee', payout: '$65' },
          { type: 'Sale', item: 'Product D', description: 'Direct sale', payout: '$210' },
          { type: 'Return', item: 'Product E', description: 'Customer return', payout: '-$150' },
        ]
      },
      influencer: {
        chartData: [
          { month: 'Jan', amount: 500 },
          { month: 'Feb', amount: 750 },
          { month: 'Mar', amount: 900 },
          { month: 'Apr', amount: 1100 },
          { month: 'May', amount: 1500 },
          { month: 'Jun', amount: 1800 }
        ],
        detailsData: [
          { type: 'Referral', item: 'Product X', description: 'Link clicks', payout: '$220' },
          { type: 'Commission', item: 'Product Y', description: 'Affiliate sale', payout: '$185' },
          { type: 'Bonus', item: 'Campaign Z', description: 'Performance bonus', payout: '$300' },
          { type: 'Referral', item: 'Product W', description: 'Instagram post', payout: '$175' },
          { type: 'Commission', item: 'Product V', description: 'TikTok video', payout: '$265' },
        ]
      },
    };

    setPayoutData(data[type]?.chartData || []);
    setTableData(data[type]?.detailsData || []);
  };

  const handleSave = () => {
    alert('Payout option saved: ' + payoutOption);
  };

  // Get title based on user type
  const getTitle = () => {
    return '';
  };

  // Simple bar chart renderer
  const renderSimpleChart = () => {
    if (!payoutData || payoutData.length === 0) return null;
    
    // Find maximum amount to scale the bars
    const maxAmount = Math.max(...payoutData.map(item => item.amount));
    const chartWidth = Dimensions.get('window').width - 80;
    const barWidth = chartWidth / payoutData.length - 10;
    
    return (
      <View style={styles.simpleChartContainer}>
        <View style={styles.chartBars}>
          {payoutData.map((item, index) => {
            const barHeight = (item.amount / maxAmount) * 120;
            return (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.bar, { height: barHeight }]} />
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.chartValues}>
          <Text style={styles.chartValueText}>${maxAmount}</Text>
          <Text style={styles.chartValueText}>$0</Text>
        </View>
      </View>
    );
  };

  // Render the content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'Summary':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Summary</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Filter"
              value={filter}
              onChangeText={setFilter}
            />
            
            <View style={styles.chartContainer}>
              <Text style={styles.axisLabel}>Amount</Text>
              {renderSimpleChart()}
            </View>
          </View>
        );
        
      case 'Details':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Details</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Filter"
              value={filter}
              onChangeText={setFilter}
            />
            
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Type</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Item</Text>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Payout</Text>
              </View>
              
              <ScrollView style={styles.tableBody}>
                {tableData.map((row, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{row.type}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{row.item}</Text>
                    <Text style={[styles.tableCell, { flex: 3 }]}>{row.description}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{row.payout}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        );
        
      case 'Options':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Options</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Payout Option details:"
              value={payoutOption}
              onChangeText={setPayoutOption}
            />
            
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
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
        <Text style={styles.headerTitle}>{getTitle()}</Text>
      </View>
      
      <View style={styles.tabBar}>
        {['Summary', 'Details', 'Options'].map((tab) => (
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
//   header: {
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//     backgroundColor: '#ffffff',
//   },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  activeTabButtonText: {
    color: '#3498db',
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  chartContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  simpleChartContainer: {
    flexDirection: 'row',
    height: 160,
    marginVertical: 10,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  chartValues: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  chartValueText: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    width: 24,
    backgroundColor: '#3498db',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 5,
    color: '#7f8c8d',
  },
  axisLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  centerText: {
    textAlign: 'center',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 16,
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  tableBody: {
    maxHeight: 300,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
  },
  tableCell: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
  tabsButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  tabsButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  homeLine: {
    width: 48,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
});

export default PayoutScreen;