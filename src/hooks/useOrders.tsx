import React from 'react';
import type { Order, OrderStatus, TrackingUpdate } from '../types/order';

interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

interface OrdersContextType extends OrdersState {
  getOrders: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  trackOrder: (id: string) => Promise<TrackingUpdate[]>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
}

const OrdersContext = React.createContext<OrdersContextType | undefined>(undefined);

// Demo data
const DEMO_ORDERS: Order[] = [
  {
    id: 'ord_1',
    userId: 'user_1',
    productId: 'prod_1',
    status: 'shipped',
    amount: 299.99,
    currency: 'USD',
    shipping: {
      method: 'express',
      carrier: 'DHL',
      trackingNumber: 'DHL123456789',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    tracking: [
      {
        id: 'trk_1',
        status: 'processing',
        location: 'Warehouse',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        description: 'Order has been processed and packed'
      },
      {
        id: 'trk_2',
        status: 'shipped',
        location: 'Distribution Center',
        timestamp: new Date(),
        description: 'Package is in transit'
      }
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<OrdersState>({
    orders: DEMO_ORDERS,
    isLoading: false,
    error: null
  });

  const getOrders = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // In a real app, fetch orders from API
      setState(prev => ({ ...prev, orders: DEMO_ORDERS }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to fetch orders' 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getOrderById = (id: string) => {
    return state.orders.find(order => order.id === id);
  };

  const trackOrder = async (id: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const order = getOrderById(id);
      if (!order) throw new Error('Order not found');
      return order.tracking;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to track order' 
      }));
      return [];
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // In a real app, update status via API
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === id 
            ? { 
                ...order, 
                status,
                updatedAt: new Date(),
                tracking: [
                  ...order.tracking,
                  {
                    id: `trk_${order.tracking.length + 1}`,
                    status,
                    location: 'Updated Location',
                    timestamp: new Date(),
                    description: `Order status updated to ${status}`
                  }
                ]
              }
            : order
        )
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to update order status' 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const value = React.useMemo(() => ({
    ...state,
    getOrders,
    getOrderById,
    trackOrder,
    updateOrderStatus
  }), [state]);

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = React.useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}