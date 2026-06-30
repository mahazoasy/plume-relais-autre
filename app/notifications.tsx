import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { useNotifications } from '../src/hooks/useNotifications';
import { formatDate } from '../src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh } = useNotifications(user?.id || '');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Connectez-vous pour voir vos notifications</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.unread]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        {!item.read && <View style={styles.badge} />}
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune notification</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  markAll: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  unread: { borderLeftColor: '#6C63FF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  badge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6C63FF' },
  message: { fontSize: 14, color: '#666', marginTop: 4 },
  date: { fontSize: 12, color: '#999', marginTop: 8 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  loader: { flex: 1, justifyContent: 'center' },
});