import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image, 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { commentsService } from '../../src/services/supabase/comments';
import { formatDate } from '../../src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../../src/theme';

export default function Comments() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComments();
    const subscription = commentsService.subscribeToComments(id as string, (payload) => {
      if (payload.eventType === 'INSERT') {
        setComments(prev => [...prev, payload.new]);
      }
    });
    return () => subscription.unsubscribe();
  }, [id]);

  const fetchComments = async () => {
    try {
      const data = await commentsService.getComments(id as string);
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    if (!user) {
      Alert.alert('Erreur', 'Connectez-vous pour commenter');
      return;
    }
    setSending(true);
    try {
      await commentsService.addComment(id as string, user.id, content.trim());
      setContent('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSending(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/story/${id}`);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        {item.user?.avatar_url ? (
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitial}>
            {(item.user?.username || 'A').charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.bubble}>
        <View style={styles.cardHeader}>
          <Text style={styles.author}>{item.user?.username || 'Anonyme'}</Text>
          <Text style={styles.date}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.content}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commentaires</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={comments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubble-outline" size={26} color={colors.primaryLight} />
              </View>
              <Text style={styles.emptyText}>Aucun commentaire</Text>
            </View>
          )}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un commentaire..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!content.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!content.trim() || sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
  },
  headerBtn: { width: 32 },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  loader: { flex: 1, justifyContent: 'center' },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  avatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // pour que l'image respecte le borderRadius
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarInitial: { color: '#FFF', fontSize: 12.5, fontWeight: '700' },
  bubble: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  author: { fontSize: 13.5, fontWeight: '700', color: colors.primary },
  date: { fontSize: 11, color: colors.textMuted },
  content: { fontSize: 14.5, color: colors.textPrimary, lineHeight: 20 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 80,
    fontSize: 14.5,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: { opacity: 0.5 },
});