// SubscriptionRequestHandler.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as API from '../backend/db/API';
import { MaterialIcons } from '@expo/vector-icons';

const SubscriptionRequestHandler = ({ 
  planId, 
  planTitle, 
  selectedPeriod,
  onSuccess,
  onCancel
}) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState(null);

  // Check if there's an existing subscription request
  useEffect(() => {
    const checkRequestStatus = async () => {
      if (user && user.user_id) {
        try {
          setLoading(true);
          const status = await API.checkSubscriptionRequestStatus(user.user_id);
          setRequestStatus(status);
          
          // If there's a pending request and it's for the same plan, show the status modal
          if (status.status === 'pending' && status.requestedTier === planId) {
            setModalVisible(true);
          }
        } catch (error) {
          console.error('Error checking request status:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    checkRequestStatus();
  }, [user, planId]);

  // Handle subscription request
  const handleRequestSubscription = async () => {
    if (!user || !user.user_id) {
      setError('You must be logged in to request a subscription.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a subscription change request (admin approval required)
      const result = await API.requestSubscriptionChange(
        user.user_id,
        'seller', // Always 'seller' role for subscription plans
        planId,
        user.tier || 'basic',
        `Subscription request for ${planTitle} (${selectedPeriod}) plan`
      );

      if (result) {
        setRequestStatus({
          status: 'pending',
          requestedTier: planId,
          currentTier: user.tier || 'basic',
          requestDate: new Date().toISOString()
        });
        
        setModalVisible(true);
      } else {
        throw new Error('Failed to create subscription request');
      }
    } catch (error) {
      console.error('Subscription request error:', error);
      setError(error.message || 'Failed to request subscription');
    } finally {
      setLoading(false);
    }
  };

  // Check request status periodically
  useEffect(() => {
    let intervalId;
    
    if (modalVisible && requestStatus && requestStatus.status === 'pending') {
      // Poll for status updates every 5 seconds
      intervalId = setInterval(async () => {
        try {
          const status = await API.checkSubscriptionRequestStatus(user.user_id);
          
          if (status.status !== requestStatus.status) {
            setRequestStatus(status);
            
            // If approved, update the user context
            if (status.status === 'approved') {
              try {
                // Get the updated user data
                const updatedUser = await API.fetchUserById(user.user_id);
                
                // Update the user context
                if (updateUser && updatedUser) {
                  updateUser(updatedUser);
                }
                
                // Call success callback
                if (onSuccess) {
                  onSuccess();
                }
              } catch (error) {
                console.error('Error updating user after approval:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error checking request status:', error);
        }
      }, 5000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [modalVisible, requestStatus, user]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      {/* Request Button */}
      <TouchableOpacity
        style={[
          styles.requestButton,
          loading && styles.disabledButton
        ]}
        onPress={handleRequestSubscription}
        disabled={loading || (requestStatus && requestStatus.status === 'pending')}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {requestStatus && requestStatus.status === 'pending'
              ? 'Request Pending'
              : requestStatus && requestStatus.status === 'approved'
                ? 'Subscription Active'
                : `Request ${planTitle} Plan`}
          </Text>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Status Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconContainer}>
              {requestStatus && requestStatus.status === 'pending' ? (
                <MaterialIcons name="hourglass-top" size={40} color="#f39c12" />
              ) : requestStatus && requestStatus.status === 'approved' ? (
                <MaterialIcons name="check-circle" size={40} color="#2ecc71" />
              ) : requestStatus && requestStatus.status === 'rejected' ? (
                <MaterialIcons name="cancel" size={40} color="#e74c3c" />
              ) : (
                <MaterialIcons name="info" size={40} color="#3498db" />
              )}
            </View>

            <Text style={styles.modalTitle}>
              {requestStatus && requestStatus.status === 'pending'
                ? 'Subscription Request Pending'
                : requestStatus && requestStatus.status === 'approved'
                  ? 'Subscription Request Approved'
                  : requestStatus && requestStatus.status === 'rejected'
                    ? 'Subscription Request Declined'
                    : 'Subscription Status'}
            </Text>

            <Text style={styles.modalText}>
              {requestStatus && requestStatus.status === 'pending'
                ? `Your request to upgrade to the ${planTitle} plan is pending admin approval. We'll notify you once it's processed.`
                : requestStatus && requestStatus.status === 'approved'
                  ? `Your subscription to the ${planTitle} plan has been approved! You now have access to all the features of this plan.`
                  : requestStatus && requestStatus.status === 'rejected'
                    ? `Your subscription request has been declined. Please contact support for more information.`
                    : 'Please wait while we process your request.'}
            </Text>

            {requestStatus && requestStatus.requestDate && (
              <Text style={styles.dateText}>
                Request Date: {formatDate(requestStatus.requestDate)}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  requestStatus && requestStatus.status === 'approved'
                    ? styles.successButton
                    : requestStatus && requestStatus.status === 'rejected'
                      ? styles.dangerButton
                      : styles.primaryButton
                ]}
                onPress={() => {
                  setModalVisible(false);
                  if (requestStatus && requestStatus.status === 'approved' && onSuccess) {
                    onSuccess();
                  } else if (requestStatus && requestStatus.status === 'rejected' && onCancel) {
                    onCancel();
                  }
                }}
              >
                <Text style={styles.modalButtonText}>
                  {requestStatus && requestStatus.status === 'approved'
                    ? 'Continue'
                    : requestStatus && requestStatus.status === 'rejected'
                      ? 'Close'
                      : 'OK'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  requestButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  successButton: {
    backgroundColor: '#2ecc71',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SubscriptionRequestHandler;