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
import { colors, spacing, radius, shadow, typography } from '../src/theme';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  vote_open: 'thumbs-up-outline',
  contribution_accepted: 'create-outline',
  story_completed: 'trophy-outline',
};

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh } = useNotifications(user?.id || '');

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Connectez-vous pour voir vos notifications</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.unread]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={TYPE_ICON[item.type] || 'notifications-outline'} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {!item.read && <View style={styles.badge} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-outline" size={28} color={colors.primaryLight} />
              </View>
              <Text style={styles.emptyText}>Aucune notification</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
  },
  headerBtn: { width: 44 },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  markAll: { fontSize: 13.5, color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...shadow.card,
  },
  unread: { borderLeftColor: colors.primary },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  badge: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  message: { fontSize: 13.5, color: colors.textSecondary, marginTop: 3 },
  date: { fontSize: 11.5, color: colors.textMuted, marginTop: spacing.sm },
  empty: { paddingVertical: 72, alignItems: 'center' },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  loader: { flex: 1, justifyContent: 'center' },
});