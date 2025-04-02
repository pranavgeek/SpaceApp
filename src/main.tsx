import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './hooks/useAuth';
import { MembershipProvider } from './hooks/useMembership';
import { ChatProvider } from './hooks/useChat';
import { OrdersProvider } from './hooks/useOrders';
import { NotificationsProvider } from './hooks/useNotifications';
import { PaymentsProvider } from './hooks/usePayments';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_dummy');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MembershipProvider>
          <Elements stripe={stripePromise}>
            <NotificationsProvider>
              <OrdersProvider>
                <PaymentsProvider>
                  <ChatProvider>
                    <App />
                  </ChatProvider>
                </PaymentsProvider>
              </OrdersProvider>
            </NotificationsProvider>
          </Elements>
        </MembershipProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
