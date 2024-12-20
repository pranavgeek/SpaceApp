import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePayments } from '../../hooks/usePayments';

export function PaymentMethodForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { addPaymentMethod, isLoading, error } = usePayments();
  const [cardError, setCardError] = React.useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setCardError(error.message || 'Failed to add card');
    } else if (paymentMethod) {
      await addPaymentMethod(paymentMethod);
      cardElement.clear();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="modern-card p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <CreditCard className="w-6 h-6 text-white" />
        <h2 className="text-lg text-white font-light">Add Payment Method</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="modern-card p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#fff',
                  '::placeholder': {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                },
              },
            }}
          />
        </div>

        {(cardError || error) && (
          <p className="text-red-500 text-sm">{cardError || error}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white/60">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-light">Secure payment</span>
          </div>
          <button
            type="submit"
            disabled={!stripe || isLoading}
            className="px-6 py-2 bg-white text-black rounded-full text-sm font-light disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Card'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}