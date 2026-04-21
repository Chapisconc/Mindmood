import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/I18nContext';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const { theme, themeStyles, toggleTheme } = useTheme();
  const { lang, t, toggleLang } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');

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
    const [hours, minutes] = reminderTime.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "MindMood ❤️",
        body: lang === 'es' ? "¿Cómo te sientes hoy? No olvides registrar tu diario." : "How are you feeling today? Don't forget your log.",
      },
      trigger: {
        hour: hours,
        minute: minutes,
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
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('language')}: {lang.toUpperCase()}</Text>
          <Switch
            value={lang === 'en'}
            onValueChange={toggleLang}
            trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
            thumbColor={lang === 'en' ? "#6366F1" : "#F4F3F4"}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('dailyReminder')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Activar</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
            thumbColor={reminderEnabled ? "#6366F1" : "#F4F3F4"}
          />
        </View>
        {reminderEnabled && (
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: themeStyles.border, pt: 15, mt: 10 }]}>
            <Text style={styles.rowLabel}>Hora</Text>
            <TextInput
              style={[styles.input, { width: 90, marginBottom: 0, textAlign: 'center' }]}
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="20:00"
            />
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
