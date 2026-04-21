import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import EmotionModal from '../components/EmotionModal';

export default function NewEntryScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ type: 'normal', summary: '' });

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
      let aiData = { mood: 'Neutral', score: 0, requires_help: false, summary: '' };

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
      const { mood, score, requires_help, summary } = aiData;

      // Save Entry
      const { error: entryError } = await supabase
        .from('entries')
        .insert([{ user_id: user.id, text, mood, score }]);
      
      if (entryError) throw entryError;

      // Update Streak Logic
      await updateStreak(user.id);

      // Clear Draft
      await AsyncStorage.removeItem('entry_draft');

      setModalData({
        type: requires_help ? 'crisis' : 'normal',
        summary: isOffline ? 'Guardado localmente (Modo Offline)' : summary
      });
      setModalVisible(true);
      
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
    scroll: { padding: 25 },
    title: { fontSize: 30, fontWeight: '900', color: themeStyles.text, marginBottom: 10, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: themeStyles.secondaryText, marginBottom: 30, lineHeight: 24, fontWeight: '500' },
    textArea: { backgroundColor: themeStyles.card, color: themeStyles.text, borderRadius: 30, padding: 25, fontSize: 18, minHeight: 400, borderWidth: 1, borderColor: themeStyles.border, textAlignVertical: 'top', shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    saveButton: { backgroundColor: themeStyles.accent, padding: 22, borderRadius: 22, alignItems: 'center', marginTop: 35, shadowColor: themeStyles.accent, shadowOffset: {width:0, height:10}, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
    saveButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' },
    offlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.itemBg, padding: 12, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderColor: themeStyles.border + '20' },
    offlineText: { color: themeStyles.secondaryText, fontSize: 14, marginLeft: 10, fontWeight: '700' }
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
      
      <EmotionModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalData.type}
        summary={modalData.summary}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}
