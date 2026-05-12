import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { EMOTIONS_MAP, getEmotionByName } from "../theme/emotions";
import { contactService } from "../services/contactService";
import RadarChart from "../components/RadarChart";
import { PieChart } from "react-native-gifted-charts";

export default function AdminDashboardScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [chartMode, setChartMode] = useState("pie");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: statsData, error: statsErr } =
        await supabase.rpc("get_admin_stats");
      if (statsErr) throw statsErr;
      setStats(statsData[0]);

      const { data: alarmsData, error: alarmsErr } =
        await supabase.rpc("get_admin_alarms");
      if (alarmsErr) throw alarmsErr;
      setAlarms(alarmsData);
    } catch (err) {
      console.error("[Admin] Fetch Error:", err);
      Alert.alert("Error", "No se pudieron cargar los datos administrativos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
  };

  const updateStatus = async (alarmId, currentStatus) => {
    const nextStatus = {
      active: "working",
      working: "resolved",
      resolved: "active",
    }[currentStatus];
    try {
      const { error } = await supabase
        .from("risk_log")
        .update({ status: nextStatus })
        .eq("id", alarmId);
      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      console.error("[Admin] Status Update Error:", err);
      Alert.alert("Error", "No se pudo actualizar el estado.");
    }
  };

  const handleContact = async (userId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    Alert.alert(
      "Iniciar Contacto",
      "¿Deseas enviar una invitación de contacto a este usuario?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: async () => {
            const { error } = await contactService.adminInitiateContact(
              userId,
              user.id,
              "Un administrador desea hablar contigo sobre tu bienestar.",
            );
            if (!error) {
              Alert.alert("Éxito", "Invitación enviada.");
            } else {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  const shareReport = async () => {
    if (!stats) return;
    const report = `Reporte MindMood - ${new Date().toLocaleDateString()}\nUsuarios: ${stats.total_users}\nAlertas: ${stats.crisis_entries}`;
    await Share.share({ message: report });
  };

  const totalEntries = stats ? stats.total_entries : 0;
  const chartData = stats
    ? EMOTIONS_MAP.map((emo) => {
        const keyMap = {
          Excelente: "excellent_entries",
          Feliz: "happy_entries",
          Sorpresa: "surprise_entries",
          Neutral: "neutral_entries",
          Enojo: "anger_entries",
          Asco: "disgust_entries",
          Miedo: "fear_entries",
          Triste: "sad_entries",
          Crisis: "crisis_entries",
        };
        const c = stats[keyMap[emo.name]] || 0;
        return {
          name: emo.name,
          value: c,
          color: emo.color,
          percentage:
            totalEntries > 0 ? Math.round((c / totalEntries) * 100) : 0,
        };
      }).filter((i) => i.value > 0)
    : [];

  const radarData = EMOTIONS_MAP.map((emo) => {
    const keyMap = {
      Excelente: "excellent_entries",
      Feliz: "happy_entries",
      Sorpresa: "surprise_entries",
      Neutral: "neutral_entries",
      Enojo: "anger_entries",
      Asco: "disgust_entries",
      Miedo: "fear_entries",
      Triste: "sad_entries",
      Crisis: "crisis_entries",
    };
    return { label: emo.name, value: stats ? stats[keyMap[emo.name]] || 0 : 0 };
  });

  const maxCount = Math.max(...radarData.map((d) => d.value), 1);
  const dominant = stats
    ? EMOTIONS_MAP.reduce((p, c) => {
        const keyP = {
          Excelente: "excellent_entries",
          Feliz: "happy_entries",
          Sorpresa: "surprise_entries",
          Neutral: "neutral_entries",
          Enojo: "anger_entries",
          Asco: "disgust_entries",
          Miedo: "fear_entries",
          Triste: "sad_entries",
          Crisis: "crisis_entries",
        }[p.name];
        const keyC = {
          Excelente: "excellent_entries",
          Feliz: "happy_entries",
          Sorpresa: "surprise_entries",
          Neutral: "neutral_entries",
          Enojo: "anger_entries",
          Asco: "disgust_entries",
          Miedo: "fear_entries",
          Triste: "sad_entries",
          Crisis: "crisis_entries",
        }[c.name];
        return (stats[keyC] || 0) > (stats[keyP] || 0) ? c : p;
      }, EMOTIONS_MAP[3])
    : EMOTIONS_MAP[3];

  const filteredAlarms = alarms.filter((a) =>
    (a.student_email || a.email || "")
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

  if (loading && !refreshing)
    return (
      <ActivityIndicator
        size="large"
        color={themeStyles.accent}
        style={{ flex: 1 }}
      />
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeStyles.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Panel Admin</Text>
            <Text style={styles.subtitle}>Gestión de Bienestar</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              supabase.auth.signOut();
              navigation.replace("Login");
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={26}
              color={themeStyles.error}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_users}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_entries}</Text>
            <Text style={styles.statLabel}>Diarios</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Distribución</Text>
            <View style={styles.toggle}>
              <TouchableOpacity onPress={() => setChartMode("pie")}>
                <Ionicons
                  name="pie-chart"
                  size={20}
                  color={chartMode === "pie" ? themeStyles.accent : "#94A3B8"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setChartMode("radar")}>
                <Ionicons
                  name="aperture"
                  size={20}
                  color={chartMode === "radar" ? themeStyles.accent : "#94A3B8"}
                />
              </TouchableOpacity>
            </View>
          </View>
          {chartMode === "pie" ? (
            <View style={{ alignItems: "center" }}>
              <PieChart
                data={chartData}
                donut
                radius={80}
                innerRadius={60}
                centerLabelComponent={() => (
                  <Ionicons
                    name={dominant.icon}
                    size={30}
                    color={dominant.color}
                  />
                )}
              />
            </View>
          ) : (
            <RadarChart data={radarData} maxValue={maxCount} size={250} />
          )}
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Buscar usuario..."
            value={searchText}
            onChangeText={setSearchText}
            style={styles.input}
          />
        </View>

        {filteredAlarms.map((item, i) => {
          const emotion = getEmotionByName(item.mood);
          const status = {
            active: { label: "Pendiente", color: "#EF4444" },
            working: { label: "En Proceso", color: "#F59E0B" },
            resolved: { label: "Resuelto", color: "#10B981" },
          }[item.status || "active"];
          const alarmKey = item.id ?? item.entry_id ?? i;
          return (
            <View key={alarmKey} style={styles.alarmCard}>
              <View style={styles.alarmHeader}>
                <Text style={styles.mail}>
                  {item.student_email || item.email}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    updateStatus(
                      item.id || item.entry_id,
                      item.status || "active",
                    )
                  }
                  style={{
                    backgroundColor: status.color + "20",
                    padding: 5,
                    borderRadius: 5,
                  }}
                >
                  <Text
                    style={{
                      color: status.color,
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.text}>{item.diary_text}</Text>
              <View style={styles.footer}>
                <Text style={{ color: emotion.color }}>{item.mood}</Text>
                <TouchableOpacity onPress={() => handleContact(item.user_id)}>
                  <Text style={{ color: themeStyles.accent }}>Contactar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.exportBtn} onPress={shareReport}>
          <Text style={{ color: "#FFF", fontWeight: "bold" }}>
            Exportar Reporte
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#94A3B8" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  statCard: { alignItems: "center", padding: 15 },
  statValue: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#94A3B8" },
  card: { backgroundColor: "#FFF", margin: 20, padding: 20, borderRadius: 20 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  toggle: { flexDirection: "row", gap: 15 },
  searchBox: { paddingHorizontal: 20, marginBottom: 10 },
  input: { backgroundColor: "#F1F5F9", padding: 10, borderRadius: 10 },
  alarmCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
  },
  alarmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mail: { fontWeight: "bold", fontSize: 12 },
  text: { fontSize: 14, color: "#475569", marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  exportBtn: {
    backgroundColor: "#6366F1",
    margin: 20,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
});
