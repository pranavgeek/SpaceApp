export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type ShippingMethod = 'standard' | 'express' | 'overnight';

export interface TrackingUpdate {
  id: string;
  status: OrderStatus;
  location: string;
  timestamp: Date;
  description: string;
}

export interface ShippingDetails {
  method: ShippingMethod;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: Date;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  shipping: ShippingDetails;
  tracking: TrackingUpdate[];
  createdAt: Date;
  updatedAt: Date;
}