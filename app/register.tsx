import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../src/theme';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        Alert.alert('Erreur', 'Cet email est déjà utilisé');
      } else {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      }
      return;
    }

    Alert.alert(
      'Succès',
      'Inscription réussie ! Un email de confirmation vous a été envoyé (si activé). Vous pouvez maintenant vous connecter.',
      [{ text: 'OK', onPress: () => router.replace('/login') }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Ionicons name="sparkles" size={30} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.title}>Inscription</Text>
        <Text style={styles.subtitle}>Rejoignez l'aventure littéraire</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="3 caractères min."
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="vous@exemple.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="6 caractères min."
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnAccent} />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkWrap}>
          <Text style={styles.link}>
            Déjà un compte ? <Text style={styles.linkStrong}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, fontSize: 28, color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  fieldGroup: { marginBottom: spacing.lg },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadow.button,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textOnAccent, fontSize: 16, fontWeight: '700' },
  linkWrap: { marginTop: spacing.xl, alignItems: 'center' },
  link: { color: colors.textSecondary, fontSize: 14 },
  linkStrong: { color: colors.primary, fontWeight: '700' },
});