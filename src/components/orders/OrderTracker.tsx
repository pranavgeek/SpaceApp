import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import type { Order, OrderStatus } from '../../types/order';

interface OrderTrackerProps {
  orderId: string;
}

const STATUS_ICONS = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: Clock
};

const STATUS_COLORS = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  shipped: 'text-purple-500',
  delivered: 'text-green-500',
  cancelled: 'text-red-500'
};

export function OrderTracker({ orderId }: OrderTrackerProps) {
  const { getOrderById, isLoading } = useOrders();
  const order = getOrderById(orderId);

  if (!order) return null;

  const StatusIcon = STATUS_ICONS[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="modern-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg text-white font-light mb-1">Order Status</h2>
          <p className="text-sm text-white/60 font-light">
            Order #{order.id}
          </p>
        </div>
        <StatusIcon className={`w-6 h-6 ${STATUS_COLORS[order.status]}`} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-white/60" />
            <span className="text-white font-light">
              {order.shipping.carrier}
            </span>
          </div>
          <span className="text-sm text-white/60 font-light">
            {order.shipping.trackingNumber}
          </span>
        </div>

        <div className="space-y-4">
          {order.tracking.map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${
                  index === order.tracking.length - 1 
                    ? STATUS_COLORS[update.status]
                    : 'bg-white/20'
                }`} />
                {index !== order.tracking.length - 1 && (
                  <div className="absolute top-3 left-1.5 w-0.5 h-full bg-white/10" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-light">
                    {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                  </span>
                  <span className="text-xs text-white/40">
                    {new Date(update.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <MapPin className="w-3 h-3 text-white/40" />
                  <span className="text-sm text-white/60">
                    {update.location}
                  </span>
                </div>
                <p className="text-sm text-white/60 mt-1">
                  {update.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-white/60 font-light">
              Estimated Delivery
            </span>
            <span className="text-white font-light">
              {order.shipping.estimatedDelivery.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}