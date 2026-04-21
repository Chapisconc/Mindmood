import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function LoginScreen({ navigation }) {
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
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error de Inicio', error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>MindMood</Text>
        <Text style={styles.subtitle}>Tu espacio seguro de salud mental</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          placeholderTextColor="#718096"
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#718096"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={styles.buttonMain} onPress={signInWithEmail}>
            <Text style={styles.buttonMainText}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>¿No tienes cuenta? <Text style={{fontWeight: 'bold', color: '#818CF8'}}>Regístrate aquí</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 44, fontWeight: '900', color: '#F8FAFC', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#94A3B8', marginTop: 8 },
  card: { backgroundColor: '#1E293B', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  label: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, marginBottom: 20, color: '#F8FAFC', fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  buttonMain: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonMainText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  registerLink: { marginTop: 30, alignItems: 'center' },
  registerText: { color: '#94A3B8', fontSize: 15 }
});
