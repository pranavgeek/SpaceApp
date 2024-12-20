import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield } from 'lucide-react';
import { usePayments } from '../../hooks/usePayments';
import type { PaymentMethod } from '@stripe/stripe-js';

interface PaymentSummaryProps {
  amount: number;
  currency: string;
  onPaymentComplete: () => void;
}

export function PaymentSummary({ amount, currency, onPaymentComplete }: PaymentSummaryProps) {
  const { paymentMethods, processPayment, isLoading, error } = usePayments();
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);

  const handlePayment = async () => {
    if (!selectedMethod) return;
    const result = await processPayment(amount, currency);
    if (result) {
      onPaymentComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="modern-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg text-white font-light">Payment Summary</h2>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-white/60" />
          <span className="text-xs text-white/60 font-light">Secure checkout</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-white/60 font-light">Amount</span>
          <span className="text-white font-light">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            }).format(amount)}
          </span>
        </div>

        {paymentMethods.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm text-white/60 font-light">Select Payment Method</h3>
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={`w-full modern-card p-4 flex items-center space-x-3 ios-button ${
                  selectedMethod?.id === method.id ? 'ring-2 ring-white' : ''
                }`}
              >
                <CreditCard className="w-5 h-5 text-white/60" />
                <div className="flex-1 text-left">
                  <p className="text-white font-light">
                    •••• {method.card?.last4}
                  </p>
                  <p className="text-xs text-white/60">
                    Expires {method.card?.exp_month}/{method.card?.exp_year}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          onClick={handlePayment}
          disabled={!selectedMethod || isLoading}
          className="w-full py-3 bg-white text-black rounded-full text-sm font-light disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </motion.div>
  );
}