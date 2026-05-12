import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { contactService } from '../services/contactService';

export default function InboxScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await contactService.getMyRequests();
    if (!error) {
      setRequests(data);
    } else {
      console.error('[Inbox] Fetch Error:', error);
      Alert.alert("Error de Conexión", "No se pudieron cargar tus mensajes.");
    }
    setLoading(false);
  };

  const handleAccept = async (requestId) => {
    const { error } = await contactService.acceptRequest(requestId);
    if (!error) {
      Alert.alert("Solicitud Aceptada", "Ahora puedes ver la información de contacto.");
      fetchRequests();
    }
  };

  const handleReject = async (requestId) => {
    Alert.alert(
      "Rechazar Solicitud",
      "¿Estás seguro de que deseas declinar esta invitación?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí, rechazar", 
          style: "destructive",
          onPress: async () => {
            const { error } = await contactService.rejectRequest(requestId);
            if (!error) fetchRequests();
          }
        }
      ]
    );
  };

  const handleAction = (item) => {
    if (item.status === 'accepted') {
      Alert.alert(
        "Contacto Profesional",
        "Información de contacto:\n\n📧 psicologo@holamundo.com\n📞 331549494\n\n¿Qué deseas hacer?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Llamar", onPress: () => Linking.openURL('tel:331549494') },
          { text: "Enviar Email", onPress: () => Linking.openURL('mailto:psicologo@holamundo.com?subject=MindMood Contacto') }
        ]
      );
    }
  };

  const renderItem = ({ item }) => {
    const isAccepted = item.status === 'accepted';
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: themeStyles.card, borderColor: isAccepted ? '#22C55E' : themeStyles.border }]}
        onPress={() => handleAction(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: isAccepted ? '#22C55E20' : (isPending ? '#EAB30820' : '#EF444420') }]}>
            <Text style={[styles.statusText, { color: isAccepted ? '#22C55E' : (isPending ? '#EAB308' : '#EF4444') }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        <Text style={[styles.message, { color: themeStyles.text }]}>
          {item.initiator === 'admin' ? "Mensaje del Administrador:" : "Tu solicitud:"}
        </Text>
        <Text style={[styles.body, { color: themeStyles.secondaryText }]} numberOfLines={3}>
          {item.message || "Sin mensaje adicional."}
        </Text>

        {isPending && item.initiator === 'admin' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.smallBtn, { backgroundColor: '#22C55E20' }]} 
              onPress={() => handleAccept(item.id)}
            >
              <Text style={[styles.smallBtnText, { color: '#22C55E' }]}>Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.smallBtn, { backgroundColor: '#EF444420' }]} 
              onPress={() => handleReject(item.id)}
            >
              <Text style={[styles.smallBtnText, { color: '#EF4444' }]}>Declinar</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <View style={styles.actionPrompt}>
            <Ionicons name="call-outline" size={16} color="#22C55E" />
            <Text style={styles.actionText}>Toca para ver contacto o llamar</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeStyles.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeStyles.text }]}>Bandeja de Entrada</Text>
        <TouchableOpacity onPress={fetchRequests} style={styles.backBtn}>
          <Ionicons name="refresh" size={24} color={themeStyles.accent} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={themeStyles.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-unread-outline" size={60} color={themeStyles.secondaryText} />
              <Text style={[styles.emptyText, { color: themeStyles.secondaryText }]}>No tienes mensajes aún.</Text>
              <TouchableOpacity 
                style={[styles.requestBtn, { backgroundColor: themeStyles.accent }]}
                onPress={() => contactService.requestContact(requests[0]?.user_id).then(() => fetchRequests())}
              >
                <Text style={styles.requestBtnText}>Solicitar Contacto</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: '900' },
  list: { padding: 20 },
  card: { padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900' },
  date: { fontSize: 12, color: '#94A3B8' },
  message: { fontSize: 14, fontWeight: '800', marginBottom: 5 },
  body: { fontSize: 14, lineHeight: 20 },
  actionPrompt: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 8 },
  actionText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  buttonRow: { flexDirection: 'row', marginTop: 15, gap: 10 },
  smallBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { fontSize: 13, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, fontWeight: '600' },
  requestBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20 },
  requestBtnText: { color: '#FFF', fontWeight: '800' }
});
