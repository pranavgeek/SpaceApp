import React from 'react';
import { motion } from 'framer-motion';
import { Package, ChevronRight } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import type { Order } from '../../types/order';

interface OrderItemProps {
  order: Order;
  onClick: () => void;
}

function OrderItem({ order, onClick }: OrderItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full modern-card p-4 ios-button"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl modern-card flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-light">Order #{order.id}</h3>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-white/60 capitalize">
              {order.status}
            </span>
            <span className="text-sm text-white/60">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: order.currency
              }).format(order.amount)}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs text-white/40">
              {order.shipping.carrier}
            </span>
            <span className="text-xs text-white/40">•</span>
            <span className="text-xs text-white/40">
              {order.shipping.trackingNumber}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function OrderList() {
  const { orders, isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Package className="w-8 h-8 text-white/40 mx-auto mb-4 animate-pulse" />
        <p className="text-white/60 font-light">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-8 h-8 text-white/40 mx-auto mb-4" />
        <p className="text-white/60 font-light">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderItem
          key={order.id}
          order={order}
          onClick={() => setSelectedOrder(order.id)}
        />
      ))}
    </div>
  );
}