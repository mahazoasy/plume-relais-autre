import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ stories: 0, contributions: 0, reputation: 0 });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { count: storiesCount } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      const { count: contribCount } = await supabase
        .from('contributions')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('is_canon', true);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('reputation, avatar_url')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      setStats({
        stories: storiesCount || 0,
        contributions: contribCount || 0,
        reputation: userData?.reputation || 0,
      });

      if (userData?.avatar_url) {
        setAvatarUrl(userData.avatar_url);
      } else {
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setShowLogoutModal(false);
      router.replace('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOut = () => {
    setShowLogoutModal(true);
  };

  if (!user && !loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Utilisateur';

  const avatarSource = avatarUrl
    ? { uri: avatarUrl }
    : { uri: `https://ui-avatars.com/api/?name=${username}&background=3B3358&color=fff&size=100` };

  const menuItems = [
    { icon: 'person-outline' as const, label: 'Modifier le profil', href: '/profile/edit' },
    { icon: 'book-outline' as const, label: 'Mes histoires', href: '/profile/stories' },
    { icon: 'notifications-outline' as const, label: 'Notifications', href: '/notifications' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            <Image source={avatarSource} style={styles.avatar} />
          </View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.reputation}</Text>
            <Text style={styles.statLabel}>Réputation</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.stories}</Text>
            <Text style={styles.statLabel}>Histoires</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.contributions}</Text>
            <Text style={styles.statLabel}>Contributions</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === menuItems.length - 1 && styles.menuItemLast]}
              onPress={() => router.push(item.href as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={19} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.85}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.signOutText}>Se déconnecter</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={40} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
                disabled={signingOut}
                activeOpacity={0.85}
              >
                {signingOut ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: spacing.xl,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 56,
    backgroundColor: colors.accent,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  username: { ...typography.h2, color: colors.textOnPrimary, marginTop: spacing.md },
  email: { fontSize: 13.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  statItem: { alignItems: 'center' },
  statValue: { ...typography.h2, color: colors.primary },
  statLabel: { fontSize: 11.5, color: colors.textSecondary, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: colors.border },
  menu: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: { fontSize: 15, color: colors.textPrimary, flex: 1, fontWeight: '500' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    padding: 15,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.lg,
    gap: 8,
  },
  signOutButtonDisabled: { opacity: 0.5 },
  signOutText: { fontSize: 15, color: colors.danger, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    width: '82%',
    alignItems: 'center',
    ...shadow.raised,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.md },
  modalMessage: {
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: spacing.md },
  modalButton: { flex: 1, paddingVertical: 13, borderRadius: radius.pill, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  modalButtonCancelText: { color: colors.textSecondary, fontSize: 14.5, fontWeight: '700' },
  modalButtonConfirm: { backgroundColor: colors.danger },
  modalButtonConfirmText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
});