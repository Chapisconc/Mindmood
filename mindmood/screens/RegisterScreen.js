import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (!email || !password) {
      Alert.alert('Aviso', 'Por favor llena todos los campos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Aviso', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('¡Cuenta Creada!', 'Se ha creado tu perfil de MindMood con éxito. Inicia sesión ahora.', [
        { text: 'Ir al Login', onPress: () => navigation.goBack() }
      ]);
    }
    setLoading(false);
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    header: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 32, fontWeight: '900', color: themeStyles.text, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, color: themeStyles.secondaryText, textAlign: 'center', marginBottom: 30 },
    card: { backgroundColor: themeStyles.card, padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: themeStyles.border },
    label: { color: themeStyles.text, fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.background, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border, paddingHorizontal: 15 },
    input: { flex: 1, padding: 16, color: themeStyles.text, fontSize: 16 },
    buttonMain: { backgroundColor: themeStyles.success, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: themeStyles.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    buttonMainText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    cancelLink: { marginTop: 30, alignItems: 'center' },
    cancelText: { color: themeStyles.secondaryText, fontSize: 15, textDecorationLine: 'underline' }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Comienza a cuidar tu salud mental hoy</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={themeStyles.secondaryText} />
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
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
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={themeStyles.secondaryText}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={themeStyles.success} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.buttonMain} onPress={signUpWithEmail}>
              <Text style={styles.buttonMainText}>Confirmar Registro</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.cancelLink} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Volver al Inicio de Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
