import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';

export default function NewEntryScreen({ navigation }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  // URL of our local AI Backend
  const API_URL = "http://192.168.1.70:8000/analyze"; 

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Cuidado', 'El diario no puede estar vacío.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });

      if (!response.ok) {
        throw new Error('Error al conectar con la IA local.');
      }

      const aiData = await response.json();
      const { mood, score, requires_help } = aiData;

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;

      const { error } = await supabase.from('entries').insert([{ user_id: userId, text: text, mood: mood, score: score }]);
      if (error) throw error;

      if (requires_help) {
        Alert.alert(
          'No estás solo ❤️',
          'Hemos notado que estás pasando por un momento extremadamente difícil. Por favor, considera hablar con alguien.\n\nLínea Cero Suicidios (Jalisco): 075\nLínea de la Vida (Nacional): 800-911-2000',
          [
            { text: 'Llamar al 075', onPress: () => {  } },
            { text: 'Entendido', style: 'cancel', onPress: () => navigation.goBack() }
          ], { cancelable: false }
        );
      } else {
        Alert.alert('Guardado', `Tu nivel de energía vital actual es: ${mood}`);
        navigation.goBack();
      }
      
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Reflexión del Día</Text>
        <Text style={styles.subtitle}>Escribe libremente todo lo que sientes. La Inteligencia Artificial medirá tu energía emocional internamente.</Text>
        
        <TextInput
          style={styles.textArea}
          placeholder="Hoy me siento..."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Procesando Emoción con Inteligencia Artificial...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Sellar Memoria</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 25, lineHeight: 22 },
  textArea: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 16, padding: 20, fontSize: 17, minHeight: 250, borderWidth: 1, borderColor: '#334155', elevation: 2 },
  saveButton: { backgroundColor: '#6366F1', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 30, shadowColor: '#6366F1', shadowOffset: {width:0, height:4}, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18, letterSpacing: 0.5 },
  loadingBox: { marginTop: 30, alignItems: 'center' },
  loadingText: { color: '#818CF8', marginTop: 10, fontWeight: '600' }
});
