import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/I18nContext';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ProfileScreen({ navigation }) {
  const { theme, themeStyles, toggleTheme } = useTheme();
  const { lang, t, toggleLang } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  // Initialize date object for picker based on 20:00 default
  const [date, setDate] = useState(new Date(new Date().setHours(20, 0, 0, 0)));

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setDisplayName(data.display_name || user.email.split('@')[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeTime = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;
      
      if (reminderEnabled) {
        await scheduleNotification();
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      Alert.alert(t('success') || 'Éxito', t('save') || 'Perfil actualizado');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const scheduleNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No pudimos activar los recordatorios.');
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "MindMood ❤️",
        body: lang === 'es' ? "¿Cómo te sientes hoy? No olvides registrar tu diario." : "How are you feeling today? Don't forget your log.",
      },
      trigger: {
        hour: date.getHours(),
        minute: date.getMinutes(),
        repeats: true,
      },
    });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background, padding: 20 },
    title: { fontSize: 32, fontWeight: '900', color: themeStyles.text, marginBottom: 30, marginTop: 40 },
    section: { backgroundColor: themeStyles.card, borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border },
    label: { fontSize: 11, fontWeight: '900', color: themeStyles.secondaryText, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: themeStyles.background, borderRadius: 16, padding: 16, color: themeStyles.text, fontSize: 16, borderWidth: 1, borderColor: themeStyles.border, marginBottom: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
    rowLabel: { fontSize: 17, color: themeStyles.text, fontWeight: '600' },
    langSelector: { flexDirection: 'row', gap: 10, marginTop: 5 },
    langBtn: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: themeStyles.border },
    langBtnActive: { backgroundColor: themeStyles.accent, borderColor: themeStyles.accent },
    langText: { fontWeight: '700', color: themeStyles.secondaryText },
    langTextActive: { color: '#FFF' },
    timeDisplay: { backgroundColor: themeStyles.itemBg, padding: 15, borderRadius: 16, alignItems: 'center' },
    timeText: { fontSize: 24, fontWeight: '800', color: themeStyles.accent },
    saveButton: { backgroundColor: themeStyles.accent, padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10, shadowColor: themeStyles.accent, shadowOffset: {height:4, width:0}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    logoutButton: { padding: 20, alignItems: 'center', marginTop: 20, marginBottom: 60 },
    logoutText: { color: themeStyles.error, fontSize: 16, fontWeight: 'bold' }
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('settings')}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t('displayName')}</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Tu nombre"
          placeholderTextColor={themeStyles.secondaryText}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('appearance')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('darkMode')}</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
            thumbColor={theme === 'dark' ? "#6366F1" : "#F4F3F4"}
          />
        </View>
        <Text style={[styles.label, {marginTop: 10}]}>{t('language')}</Text>
        <View style={styles.langSelector}>
          <TouchableOpacity 
            style={[styles.langBtn, lang === 'es' && styles.langBtnActive]} 
            onPress={() => lang !== 'es' && toggleLang()}
          >
            <Text style={[styles.langText, lang === 'es' && styles.langTextActive]}>Español</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} 
            onPress={() => lang !== 'en' && toggleLang()}
          >
            <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>English</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('dailyReminder')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('activate') || 'Activar'}</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
            thumbColor={reminderEnabled ? "#6366F1" : "#F4F3F4"}
          />
        </View>
        {reminderEnabled && (
          <View style={{ mt: 10 }}>
            <TouchableOpacity style={styles.timeDisplay} onPress={() => setShowPicker(true)}>
              <Text style={styles.timeText}>
                {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            
            {(showPicker || Platform.OS === 'ios') && (
              <DateTimePicker
                value={date}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeTime}
              />
            )}
            {showPicker && Platform.OS === 'android' && (
              <TouchableOpacity onPress={() => setShowPicker(false)} style={{alignItems: 'center', marginTop: 10}}>
                <Text style={{color: themeStyles.accent, fontWeight: 'bold'}}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? '...' : t('save')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={async () => {
        await supabase.auth.signOut();
        navigation.replace('Login');
      }}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
