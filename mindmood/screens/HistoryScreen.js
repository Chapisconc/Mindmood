import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeStyles.background },
    list: { padding: 20, paddingBottom: 100 },
    
    entryCard: { backgroundColor: themeStyles.card, padding: 22, borderRadius: 28, marginBottom: 18, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {width:0, height:6}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: themeStyles.border + '30' },
    
    metaData: { flex: 1 },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    date: { color: themeStyles.secondaryText, fontSize: 12, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase' },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    time: { color: themeStyles.accent, fontSize: 11, fontWeight: '900', marginLeft: 6 },
    
    moodContainer: { alignItems: 'flex-end' },
    emoji: { fontSize: 26, marginBottom: 2 },
    moodName: { fontSize: 10, fontWeight: '900', color: themeStyles.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    
    entryText: { color: themeStyles.text, fontSize: 16, lineHeight: 26, fontWeight: '500', marginBottom: 15 },
    
    distributionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    distBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    primaryBadge: { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' },
    distText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    primaryText: { color: '#818CF8' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyEmoji: { fontSize: 72, marginBottom: 24 },
    emptyText: { color: themeStyles.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
    emptySub: { color: themeStyles.secondaryText, fontSize: 16, textAlign: 'center', marginTop: 12, fontWeight: '600' }
  });

  useEffect(() => {
    fetchHistory();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchHistory = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log(`[Bóveda] Sincronizadas ${data?.length} entradas.`);
      setEntries(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getEmoji = (mood) => {
    const map = {
      'Excelente': '🤩', 'Feliz': '😊', 'Agradecido': '🙏', 'Sorpresa': '😲',
      'Neutral': '😐', 'Enojo': '😠', 'Ansiedad': '😰', 'Miedo': '😨',
      'Triste': '😔', 'Crisis': '🆘'
    };
    return map[mood] || '😐';
  };

  const renderItem = ({ item }) => {
    const dateObj = new Date(item.created_at);
    const dateStr = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Sort distribution if present, or create a fallback list with just the primary mood
    let sortedMoods = [];
    if (item.distribution && Object.keys(item.distribution).length > 0) {
      sortedMoods = Object.entries(item.distribution).sort((a,b) => b[1] - a[1]);
    } else {
      // Fallback para entradas antiguas o sin distribución guardada
      sortedMoods = [[item.mood, 100]];
    }

    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.metaData}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={14} color={themeStyles.secondaryText} />
              <Text style={styles.date}>{dateStr}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time" size={14} color={themeStyles.accent} />
              <Text style={styles.time}>{timeStr}</Text>
            </View>
          </View>
          
          <View style={styles.moodContainer}>
            <Text style={styles.emoji}>{getEmoji(item.mood)}</Text>
            <Text style={styles.moodName}>{item.mood}</Text>
          </View>
        </View>

        <Text style={styles.entryText}>{item.text}</Text>

        <View style={styles.distributionContainer}>
          {sortedMoods.map(([name], idx) => (
            <View key={idx} style={[styles.distBadge, name === item.mood && styles.primaryBadge]}>
              <Text style={[styles.distText, name === item.mood && styles.primaryText]}>
                {name === item.mood ? `✨ ${name}` : name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeStyles.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>Bóveda vacía</Text>
          <Text style={styles.emptySub}>Tus reflexiones guardadas aparecerán aquí.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={themeStyles.accent}
              colors={[themeStyles.accent]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
