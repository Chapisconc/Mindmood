import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import EmotionModal from '../components/EmotionModal';
import Constants from 'expo-constants';

const MAX_CHARS = 2000;

export default function NewEntryScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ type: 'normal', summary: '', distribution: null });
  const [apiStatus, setApiStatus] = useState('connecting');

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // URLs de la IA (Local y Remota en Render)
  const RENDER_URL = "https://mindmood-ai.onrender.com/analyze";

  // Detectar IP local del servidor Expo para fallback
  const getApiUrls = () => {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localIp = debuggerHost ? debuggerHost.split(':')[0] : null;
    const urls = [];
    if (localIp) {
      urls.push(`http://${localIp}:8000/analyze`);
    }
    urls.push(RENDER_URL);
    return urls;
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    checkApiStatus();
    loadDraft();

    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulsing dot animation for status indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkApiStatus = async () => {
    const urls = getApiUrls();
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url.replace('/analyze', '/'), { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok || res.status === 404) {
          setApiStatus(url.includes('render.com') ? 'cloud' : 'local');
          return;
        }
      } catch (_e) { /* silently try next */ }
    }
    setApiStatus('offline');
  };

  const loadDraft = async () => {
    const draft = await AsyncStorage.getItem('entry_draft');
    if (draft) setText(draft);
  };

  const saveDraft = async (val) => {
    if (val.length <= MAX_CHARS) {
      setText(val);
      await AsyncStorage.setItem('entry_draft', val);
    }
  };

  const onPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Cuidado', 'El diario no puede estar vacío.');
      return;
    }

    setLoading(true);
    try {
      let aiData = { mood: 'Neutral', score: 0, requires_help: false, summary: '', emotions_distribution: null };

      if (!isOffline) {
        const urls = getApiUrls();
        let connected = false;

        for (const url of urls) {
          if (connected) break;
          try {
            console.log(`Intentando conectar a IA: ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), url.includes('render.com') ? 30000 : 5000);

            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: text }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              aiData = await response.json();
              setApiStatus(url.includes('render.com') ? 'cloud' : 'local');
              connected = true;
            } else {
              console.log(`❌ Falló conexión con ${url} (status: ${response.status})`);
            }
          } catch (_err) {
            console.log(`❌ Falló conexión con ${url}`);
          }
        }

        if (!connected) {
          setApiStatus('offline');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { mood, score, requires_help, summary, emotions_distribution } = aiData;

      let { error: entryError } = await supabase
        .from('entries')
        .insert([{
          user_id: user.id,
          text,
          mood,
          score,
          distribution: emotions_distribution
        }]);

      if (entryError && entryError.message.includes('distribution')) {
        const fallback = await supabase
          .from('entries')
          .insert([{ user_id: user.id, text, mood, score }]);
        entryError = fallback.error;
      }

      if (entryError) throw entryError;

      await updateStreak(user.id);
      await AsyncStorage.removeItem('entry_draft');

      setModalData({
        type: requires_help ? 'crisis' : 'normal',
        summary: isOffline ? 'Guardado localmente (Modo Offline)' : summary,
        distribution: emotions_distribution,
        primaryMood: mood
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
      if (diffDays === 1) newStreak = (profile.streak || 0) + 1;
      else if (diffDays === 0) newStreak = profile.streak || 1;
    }

    await supabase
      .from('profiles')
      .update({ streak: newStreak, last_entry_at: now.toISOString() })
      .eq('id', userId);
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'local': return '#10B981';
      case 'cloud': return '#3B82F6';
      case 'connecting': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const getStatusLabel = () => {
    switch (apiStatus) {
      case 'local': return '⚡ Local';
      case 'cloud': return '☁️ Cloud';
      case 'connecting': return '⏳ Conectando';
      default: return '⛔ Offline';
    }
  };

  const charProgress = text.length / MAX_CHARS;
  const charColor = charProgress > 0.9 ? '#EF4444' : charProgress > 0.7 ? '#F59E0B' : themeStyles.accent;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { padding: 25 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    title: { fontSize: 30, fontWeight: '900', color: themeStyles.text, letterSpacing: -0.5, flex: 1 },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: themeStyles.border, shadowColor: getStatusColor(), shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: '900', color: themeStyles.secondaryText, textTransform: 'uppercase', letterSpacing: 0.5 },
    subtitle: { fontSize: 16, color: themeStyles.secondaryText, marginBottom: 25, lineHeight: 24, fontWeight: '500' },
    textAreaWrapper: { marginBottom: 8 },
    textArea: { backgroundColor: themeStyles.card, color: themeStyles.text, borderRadius: 28, padding: 25, fontSize: 17, minHeight: 350, borderWidth: 1.5, borderColor: themeStyles.border, textAlignVertical: 'top', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4, lineHeight: 28 },
    charCountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginTop: 10 },
    charCountText: { fontSize: 12, fontWeight: '800' },
    progressBarBg: { flex: 1, height: 4, backgroundColor: themeStyles.border, borderRadius: 2, marginLeft: 12 },
    progressBarFill: { height: 4, borderRadius: 2 },
    saveButton: { padding: 22, borderRadius: 22, alignItems: 'center', marginTop: 30, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10 },
    saveButtonText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1, textTransform: 'uppercase' },
    offlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: 14, borderRadius: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
    offlineText: { color: '#EF4444', fontSize: 14, marginLeft: 10, fontWeight: '700' }
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Reflexión del Día</Text>
              <View style={styles.statusIndicator}>
                <Animated.View style={[styles.statusDot, { backgroundColor: getStatusColor(), opacity: pulseAnim }]} />
                <Text style={styles.statusText}>{getStatusLabel()}</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>Escribe libremente. Tu diario es un espacio seguro para descargar tu mente.</Text>

            {isOffline && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline" size={18} color="#EF4444" />
                <Text style={styles.offlineText}>Sin conexión — se guardará localmente.</Text>
              </View>
            )}

            <View style={styles.textAreaWrapper}>
              <TextInput
                testID="entry_input"
                style={styles.textArea}
                placeholder="Hoy mi mente se siente..."
                placeholderTextColor={themeStyles.secondaryText}
                multiline
                value={text}
                onChangeText={saveDraft}
                maxLength={MAX_CHARS}
              />
              <View style={styles.charCountRow}>
                <Text style={[styles.charCountText, { color: charColor }]}>{text.length}/{MAX_CHARS}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(charProgress * 100, 100)}%`, backgroundColor: charColor }]} />
                </View>
              </View>
            </View>

            {loading ? (
              <View style={{ marginTop: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={themeStyles.accent} />
                <Text style={{ color: themeStyles.secondaryText, marginTop: 12, fontWeight: '700', fontSize: 14 }}>Analizando emociones...</Text>
              </View>
            ) : (
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  testID="save_button"
                  style={[styles.saveButton, { backgroundColor: themeStyles.accent, shadowColor: themeStyles.accent }]}
                  onPress={handleSave}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  activeOpacity={0.9}
                >
                  <Text style={styles.saveButtonText}>✦ Guardar en la Bóveda</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <EmotionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalData.type}
        summary={modalData.summary}
        distribution={modalData.distribution}
        primaryMood={modalData.primaryMood}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}
