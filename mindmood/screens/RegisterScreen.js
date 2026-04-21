import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if(password.length < 6) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <Text style={styles.subtitle}>Comienza a cuidar tu salud mental hoy</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          placeholderTextColor="#718096"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimo 6 caracteres"
          placeholderTextColor="#718096"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={styles.buttonMain} onPress={signUpWithEmail}>
            <Text style={styles.buttonMainText}>Confirmar Registro</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.cancelLink} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Volver al Inicio de Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 20 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginBottom: 40 },
  card: { backgroundColor: '#1E293B', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  label: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, marginBottom: 20, color: '#F8FAFC', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  buttonMain: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonMainText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  cancelLink: { marginTop: 30, alignItems: 'center' },
  cancelText: { color: '#94A3B8', fontSize: 15, textDecorationLine: 'underline' }
});
