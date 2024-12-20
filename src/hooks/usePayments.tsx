import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { PaymentMethod, PaymentIntent } from '@stripe/stripe-js';

interface PaymentsState {
  isLoading: boolean;
  error: string | null;
  paymentMethods: PaymentMethod[];
}

interface PaymentsContextType extends PaymentsState {
  addPaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
  processPayment: (amount: number, currency: string) => Promise<PaymentIntent | null>;
  getPaymentMethods: () => Promise<void>;
}

const PaymentsContext = React.createContext<PaymentsContextType | undefined>(undefined);

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PaymentsState>({
    isLoading: false,
    error: null,
    paymentMethods: []
  });

  const addPaymentMethod = async (paymentMethod: PaymentMethod) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      // In a real app, you would make an API call to your backend to save the payment method
      setState(prev => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, paymentMethod]
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to add payment method' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const processPayment = async (amount: number, currency: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      // In a real app, you would create a payment intent through your backend
      const paymentIntent = await stripe.confirmCardPayment('dummy_client_secret', {
        payment_method: state.paymentMethods[0]?.id
      });

      if (paymentIntent.error) {
        throw new Error(paymentIntent.error.message);
      }

      return paymentIntent.paymentIntent;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getPaymentMethods = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      // In a real app, you would fetch saved payment methods from your backend
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to fetch payment methods' }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const value = React.useMemo(() => ({
    ...state,
    addPaymentMethod,
    processPayment,
    getPaymentMethods
  }), [state]);

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
}

export function usePayments() {
  const context = React.useContext(PaymentsContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return context;
}