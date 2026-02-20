/**
 * Notifications & Reminders
 * Send ride reminders and updates to users
 */
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: 'ride_reminder' | 'payment_reminder' | 'split_invitation' | 'badge_earned' | 'referral' | 'ride_request' | 'request_accepted' | 'ride_started' | 'message';
  title: string;
  message: string;
  action_url?: string;
  read: boolean;
  created_at: string;
  scheduled_for?: string;
  data?: any;
}

/**
 * Schedule generic notification
 */
export const scheduleNotification = async (notification: Partial<Notification>) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: {
          action_url: notification.action_url,
          scheduled_for: notification.scheduled_for,
          ...notification.data
        }
      });

    if (error) throw error;
    console.log('📬 Notification saved:', notification.title);
    return true;
  } catch (error) {
    console.error('Failed to save notification:', error);
    return false;
  }
};

/**
 * Send notification for a ride join request
 */
export const sendRideRequestNotification = async (hostId: string, requesterName: string, rideId: string) => {
  return scheduleNotification({
    user_id: hostId,
    type: 'ride_request',
    title: 'New Ride Request 📩',
    message: `${requesterName} wants to join your ride.`,
    action_url: `/activity`,
    data: { ride_id: rideId }
  });
};

/**
 * Send notification when a ride request is accepted
 */
export const sendRequestAcceptedNotification = async (requesterId: string, hostName: string, rideId: string) => {
  return scheduleNotification({
    user_id: requesterId,
    type: 'request_accepted',
    title: 'Request Accepted! 🎉',
    message: `${hostName} accepted your request to join the ride.`,
    action_url: `/activity`,
    data: { ride_id: rideId }
  });
};

/**
 * Send notification for a new message
 */
export const sendMessageNotification = async (recipientId: string, senderName: string, messagePreview: string, conversationUrl: string) => {
  return scheduleNotification({
    user_id: recipientId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: messagePreview.length > 50 ? messagePreview.substring(0, 47) + '...' : messagePreview,
    action_url: conversationUrl,
  });
};

/**
 * Send notification when a ride starts
 */
export const sendRideStartedNotification = async (userId: string, rideInfo: string) => {
  return scheduleNotification({
    user_id: userId,
    type: 'ride_started',
    title: 'Ride Started! 🚗',
    message: `Your ride ${rideInfo} has started. Stay safe!`,
    action_url: '/activity',
  });
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (userId: string, limit: number = 20) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return false;
  }
};
