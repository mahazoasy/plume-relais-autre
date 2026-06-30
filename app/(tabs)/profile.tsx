import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ stories: 0, contributions: 0, reputation: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
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

      const { data: userData } = await supabase
        .from('users')
        .select('reputation')
        .eq('id', user.id)
        .single();

      setStats({
        stories: storiesCount || 0,
        contributions: contribCount || 0,
        reputation: userData?.reputation || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Veuillez vous connecter</Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>Aller à la connexion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Utilisateur';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: `https://ui-avatars.com/api/?name=${username}&background=6C63FF&color=fff&size=100`,
          }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.email}>{user.email}</Text>
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
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/edit')}>
          <Ionicons name="person-outline" size={24} color="#6C63FF" />
          <Text style={styles.menuText}>Modifier le profil</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/stories')}>
          <Ionicons name="book-outline" size={24} color="#6C63FF" />
          <Text style={styles.menuText}>Mes histoires</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#6C63FF" />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles inchangés
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6C63FF' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 12 },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#6C63FF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#E0E0E0' },
  menu: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: { fontSize: 16, color: '#333', flex: 1, marginLeft: 12 },
  menuArrow: { marginLeft: 'auto' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: { fontSize: 16, color: '#FF3B30', fontWeight: '600', marginLeft: 8 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
  link: { color: '#6C63FF', textAlign: 'center', marginTop: 10 },
});