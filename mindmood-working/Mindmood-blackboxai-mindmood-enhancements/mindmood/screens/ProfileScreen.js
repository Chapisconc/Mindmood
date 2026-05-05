import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/I18nContext';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NoticeModal from '../components/NoticeModal';

export default function ProfileScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const { lang, t, toggleLang } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [notice, setNotice] = useState({ visible: false, title: '', message: '', icon: 'checkmark-circle', color: '#10B981' });
  
  const [date, setDate] = useState(new Date(new Date().setHours(20, 0, 0, 0)));

  useEffect(() => {
    fetchProfile();
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios Diarios',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#818CF8',
      });
    }
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
        .upsert({ 
          id: user.id, 
          display_name: displayName.trim() 
        }, { 
          onConflict: 'id' 
        });

      if (error) throw error;
      
      if (reminderEnabled) {
        await scheduleNotification();
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      setNotice({
        visible: true,
        title: t('success'),
        message: t('profileUpdated'),
        icon: 'checkmark-circle',
        color: '#10B981'
      });
    } catch (error) {
      setNotice({
        visible: true,
        title: 'Error',
        message: error.message,
        icon: 'alert-circle',
        color: '#EF4444'
      });
    } finally {
      setSaving(false);
    }
  };

  const scheduleNotification = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        setNotice({
          visible: true,
          title: 'Permiso denegado',
          message: 'No pudimos activar los recordatorios.',
          icon: 'notifications-off',
          color: '#F97316'
        });
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "MindMood ❤️",
          body: lang === 'es' ? "¿Cómo te sientes hoy? No olvides registrar tu diario." : "How are you feeling today? Don't forget your log.",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          hour: date.getHours(),
          minute: date.getMinutes(),
          repeats: true,
          channelId: 'reminders',
        },
      });
    } catch (error) {
      console.log("Error en notificaciones:", error);
    }
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
    timeDisplay: { backgroundColor: themeStyles.itemBg, padding: 15, borderRadius: 16, alignItems: 'center', marginTop: 10 },
    timeText: { fontSize: 24, fontWeight: '800', color: themeStyles.accent },
    saveButton: { backgroundColor: themeStyles.accent, padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 10, shadowColor: themeStyles.accent, shadowOffset: {height:4, width:0}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
    logoutButton: { padding: 20, alignItems: 'center', marginTop: 20, marginBottom: 60 },
    logoutText: { color: themeStyles.error, fontSize: 16, fontWeight: 'bold' }
  });

  return (
    <View style={{ flex: 1, backgroundColor: themeStyles.background }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('settings')}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>{t('displayName')}</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={lang === 'es' ? "Tu nombre" : "Your name"}
            placeholderTextColor={themeStyles.secondaryText}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('languageSection')}</Text>
          <View style={styles.langSelector}>
            <TouchableOpacity 
              style={[styles.langBtn, lang === 'es' && styles.langBtnActive]} 
              onPress={() => lang !== 'es' && toggleLang()}
            >
              <Text style={[styles.langText, lang === 'es' && styles.langTextActive]}>🇲🇽 Español</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} 
              onPress={() => lang !== 'en' && toggleLang()}
            >
              <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>🇺🇸 English</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('dailyReminder')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('toggleReminder')}</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
              thumbColor={reminderEnabled ? "#6366F1" : "#F4F3F4"}
            />
          </View>
          {reminderEnabled && (
            <View>
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

      <NoticeModal 
        visible={notice.visible}
        onClose={() => setNotice({ ...notice, visible: false })}
        title={notice.title}
        message={notice.message}
        icon={notice.icon}
        color={notice.color}
      />
    </View>
  );
}
