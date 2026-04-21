import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkRoleAndRedirect(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkRoleAndRedirect(session.user.id);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkRoleAndRedirect(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (data?.role === 'admin') {
      navigation.replace('AdminDashboard');
    } else {
      navigation.replace('Home');
    }
  }

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error de Inicio', error.message);
    setLoading(false);
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: themeStyles.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: themeStyles.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    logoText: { fontSize: 36, fontWeight: '900', color: themeStyles.text, letterSpacing: 1 },
    subtitle: { fontSize: 16, color: themeStyles.secondaryText, marginTop: 8, textAlign: 'center' },
    card: { backgroundColor: themeStyles.card, padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: themeStyles.border },
    label: { color: themeStyles.text, fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.background, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border, paddingHorizontal: 15 },
    input: { flex: 1, padding: 16, color: themeStyles.text, fontSize: 16 },
    buttonMain: { backgroundColor: themeStyles.accent, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: themeStyles.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    buttonMainText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    registerLink: { marginTop: 30, alignItems: 'center' },
    registerText: { color: themeStyles.secondaryText, fontSize: 15 }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={50} color="#FFF" />
          </View>
          <Text style={styles.logoText}>MindMood</Text>
          <Text style={styles.subtitle}>Tu espacio seguro de salud mental</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={themeStyles.secondaryText} />
            <TextInput
              style={styles.input}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={themeStyles.secondaryText}
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={themeStyles.secondaryText} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={themeStyles.secondaryText}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={themeStyles.accent} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.buttonMain} onPress={signInWithEmail}>
              <Text style={styles.buttonMainText}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta? <Text style={{ fontWeight: 'bold', color: themeStyles.accent }}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
