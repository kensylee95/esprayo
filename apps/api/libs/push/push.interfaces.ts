export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SaveSubscriptionDto {
  userId: string;
  subscription: WebPushSubscription;
  device?: 'android' | 'ios' | 'web';
}

export interface SendNotificationDto {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

export interface SendNotificationResponse {
  successCount: number;
  failureCount: number;
}
