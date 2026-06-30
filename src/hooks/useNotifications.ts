import { useState, useEffect } from 'react';
import { notificationsService } from '../services/supabase/notifications';

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsService.getNotifications(userId);
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    return notificationsService.subscribeToNotifications(userId, (payload) => {
      setNotifications(prev => [payload.new, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
  };

  const markAsRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationsService.markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
};