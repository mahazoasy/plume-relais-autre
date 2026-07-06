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
import { supabase } from '../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, typography } from '../src/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      console.error('Login error:', error);
      Alert.alert('Erreur de connexion', error.message);
      return;
    }

    if (data.user) {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Ionicons name="book" size={34} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.title}>Plume Relais</Text>
        <Text style={styles.subtitle}>Bon retour parmi nous</Text>

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
              placeholder="••••••••"
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
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnAccent} />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkWrap}>
          <Text style={styles.link}>
            Pas encore de compte ? <Text style={styles.linkStrong}>Créer un compte</Text>
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
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h1, fontSize: 30, color: colors.textPrimary, textAlign: 'center' },
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