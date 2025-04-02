export type NotificationType = 
  | 'order'
  | 'payment'
  | 'message'
  | 'system'
  | 'promotion';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  timestamp: Date;
  metadata?: {
    orderId?: string;
    paymentId?: string;
    messageId?: string;
    promotionId?: string;
  };
}