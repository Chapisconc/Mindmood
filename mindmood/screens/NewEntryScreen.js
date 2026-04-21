import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function NewEntryScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // URL of our local AI Backend
  const API_URL = "http://192.168.1.70:8000/analyze"; 

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    loadDraft();
    return () => unsubscribe();
  }, []);

  const loadDraft = async () => {
    const draft = await AsyncStorage.getItem('entry_draft');
    if (draft) setText(draft);
  };

  const saveDraft = async (val) => {
    setText(val);
    await AsyncStorage.setItem('entry_draft', val);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Cuidado', 'El diario no puede estar vacío.');
      return;
    }

    setLoading(true);
    try {
      let aiData = { mood: 'Neutral', score: 0, requires_help: false };

      if (!isOffline) {
        try {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
          });
          if (response.ok) {
            aiData = await response.json();
          }
        } catch (e) {
          console.log("AI Backend unreachable, using defaults.");
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { mood, score, requires_help } = aiData;

      // Save Entry
      const { error: entryError } = await supabase
        .from('entries')
        .insert([{ user_id: user.id, text, mood, score }]);
      
      if (entryError) throw entryError;

      // Update Streak Logic
      await updateStreak(user.id);

      // Clear Draft
      await AsyncStorage.removeItem('entry_draft');

      if (requires_help) {
        Alert.alert(
          'No estás solo ❤️',
          'Hemos notado que estás pasando por un momento difícil. Por favor, considera hablar con alguien.\n\nLínea Cero Suicidios: 075\nLínea de la Vida: 800-911-2000',
          [{ text: 'Entendido', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Guardado', isOffline ? 'Guardado localmente (Modo Offline)' : `Energía detectada: ${mood}`);
        navigation.goBack();
      }
      
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak, last_entry_at')
      .eq('id', userId)
      .single();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let newStreak = 1;
    if (profile?.last_entry_at) {
      const lastDate = new Date(profile.last_entry_at);
      const lastTime = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
      
      const diffDays = (today - lastTime) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        newStreak = (profile.streak || 0) + 1;
      } else if (diffDays === 0) {
        newStreak = profile.streak || 1;
      }
    }

    await supabase
      .from('profiles')
      .update({ streak: newStreak, last_entry_at: now.toISOString() })
      .eq('id', userId);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { padding: 20 },
    title: { fontSize: 28, fontWeight: '900', color: themeStyles.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: themeStyles.secondaryText, marginBottom: 25, lineHeight: 22, fontWeight: '500' },
    textArea: { backgroundColor: themeStyles.card, color: themeStyles.text, borderRadius: 24, padding: 20, fontSize: 18, minHeight: 300, borderWidth: 1, borderColor: themeStyles.border, textAlignVertical: 'top' },
    saveButton: { backgroundColor: themeStyles.accent, padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 30, shadowColor: themeStyles.accent, shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18, letterSpacing: 0.5 },
    offlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.itemBg, padding: 10, borderRadius: 12, marginBottom: 20 },
    offlineText: { color: themeStyles.secondaryText, fontSize: 13, marginLeft: 8, fontWeight: '600' }
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Reflexión del Día</Text>
          <Text style={styles.subtitle}>Escribe libremente. Tu diario es un espacio seguro para descargar tu mente.</Text>
          
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={18} color={themeStyles.secondaryText} />
              <Text style={styles.offlineText}>Modo Offline activado. Se guardará localmente.</Text>
            </View>
          )}

          <TextInput
            style={styles.textArea}
            placeholder="Hoy mi mente se siente..."
            placeholderTextColor={themeStyles.secondaryText}
            multiline
            value={text}
            onChangeText={saveDraft}
          />

          {loading ? (
            <ActivityIndicator size="large" color={themeStyles.accent} style={{ marginTop: 30 }} />
          ) : (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Guardar en la Bóveda</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
