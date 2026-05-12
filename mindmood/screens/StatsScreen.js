import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Modal,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-gifted-charts";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { EMOTIONS_MAP, getEmotionByName } from "../theme/emotions";
import RadarChart from "../components/RadarChart";

export default function StatsScreen() {
  const { themeStyles } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scrollContent: { paddingBottom: 60 },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },

    header: {
      padding: 25,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: { fontSize: 28, fontWeight: "900", color: themeStyles.text },
    subtitle: {
      fontSize: 15,
      color: themeStyles.secondaryText,
      fontWeight: "600",
    },
    badgeCount: {
      backgroundColor: themeStyles.itemBg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "800",
      color: themeStyles.secondaryText,
    },

    kpiRow: {
      flexDirection: "row",
      paddingHorizontal: 25,
      gap: 12,
      marginBottom: 20,
    },
    kpiCard: {
      flex: 1,
      padding: 16,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: themeStyles.border,
    },
    kpiValue: {
      fontSize: 16,
      fontWeight: "900",
      color: themeStyles.text,
      marginTop: 8,
    },
    kpiLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: themeStyles.secondaryText,
    },

    mainCard: {
      marginHorizontal: 25,
      backgroundColor: themeStyles.card,
      borderRadius: 28,
      padding: 20,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: themeStyles.border,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    cardTitle: { fontSize: 16, fontWeight: "800", color: themeStyles.text },
    smallTitle: { fontSize: 13, fontWeight: "800", color: themeStyles.text },
    chartBox: { alignItems: "center" },
    axisText: {
      color: themeStyles.secondaryText,
      fontSize: 10,
      fontWeight: "700",
    },

    row: { flexDirection: "row", paddingHorizontal: 25, marginBottom: 10 },
    flex1: { flex: 1, marginHorizontal: 0 },
    pieWrapper: { alignItems: "center", justifyContent: "center", height: 140 },
    legendContainer: { gap: 8 },
    legendItem: { flexDirection: "row", alignItems: "center" },
    dot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
    legendLabel: {
      flex: 1,
      fontSize: 11,
      color: themeStyles.secondaryText,
      fontWeight: "700",
    },
    legendPerc: { fontSize: 11, fontWeight: "900", color: themeStyles.text },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      justifyContent: "center",
      alignItems: "center",
    },
    dismissArea: { ...StyleSheet.absoluteFillObject },
    popoutCard: {
      backgroundColor: themeStyles.card,
      borderRadius: 32,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeStyles.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: themeStyles.text,
      marginLeft: 10,
    },
    modalBody: {
      paddingVertical: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    modalSummary: {
      marginTop: 25,
      padding: 16,
      backgroundColor: themeStyles.itemBg,
      borderRadius: 20,
      width: "100%",
    },
    modalSummaryTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: themeStyles.text,
      marginBottom: 5,
    },
    modalSummaryText: {
      fontSize: 13,
      color: themeStyles.secondaryText,
      lineHeight: 18,
    },
    modalLegend: { marginTop: 25, width: "100%", gap: 10 },
    modalLegendItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeStyles.itemBg,
      padding: 12,
      borderRadius: 15,
    },
    modalLegendLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: themeStyles.secondaryText,
    },
    modalLegendPerc: {
      fontSize: 13,
      fontWeight: "900",
      color: themeStyles.text,
    },
    fullPieBox: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    centerAlign: { alignItems: "center" },
    dominantLabel: {
      fontSize: 15,
      fontWeight: "900",
      color: themeStyles.text,
      marginTop: 5,
    },

    emptyEmoji: { fontSize: 60, marginBottom: 16 },
    emptyText: {
      fontSize: 18,
      fontWeight: "800",
      color: themeStyles.text,
      textAlign: "center",
    },
  });

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popout, setPopout] = useState({ visible: false, type: null });

  const fetchHistory = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", userData.user.id)
        .gte("created_at", lastWeek.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("[Stats] Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fetchHistory, fadeAnim]);

  const processedStats = useMemo(() => {
    if (entries.length === 0) return null;

    const totalCount = entries.length;

    const lineData = entries.map((e) => {
      const d = new Date(e.created_at);
      const emotion = getEmotionByName(e.mood);
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return {
        value: e.score,
        label: days[d.getDay()],
        dataPointColor: emotion.color,
        dataPointText: e.mood,
        mood: e.mood,
      };
    });

    const counts = {};
    entries.forEach((e) => (counts[e.mood] = (counts[e.mood] || 0) + 1));

    const pieData = EMOTIONS_MAP.map((emo) => {
      const count = counts[emo.name] || 0;
      if (count === 0) return null;
      return {
        value: count,
        color: emo.color,
        text: "",
        emotionName: emo.name,
        valueCount: count,
      };
    }).filter(Boolean);

    const dominantName =
      Object.values(counts).length > 0
        ? Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
        : "Neutral";
    const dominant = getEmotionByName(dominantName);

    const radarData = EMOTIONS_MAP.map((emo) => ({
      label: emo.name,
      value: counts[emo.name] || 0,
      icon: emo.icon,
    }));

    const maxCount = Math.max(...radarData.map((d) => d.value), 1);

    return { totalCount, lineData, pieData, radarData, maxCount, dominant };
  }, [entries]);

  const renderYAxisLabels = (val) => {
    if (val === 1) return "E";
    if (val === 0.5) return "F";
    if (val === 0) return "N";
    if (val === -0.5) return "T";
    if (val === -1) return "C";
    return "";
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeStyles.accent} />
      </View>
    );

  if (!processedStats || processedStats.totalCount === 0)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>
            Registra tu primera entrada para ver estadísticas.
          </Text>
        </View>
      </SafeAreaView>
    );

  const { totalCount, lineData, pieData, radarData, maxCount, dominant } =
    processedStats;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.title}>Estadísticas</Text>
            <Text style={styles.subtitle}>Resumen Semanal</Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeText}>{totalCount} Registros</Text>
          </View>
        </Animated.View>

        <View style={styles.kpiRow}>
          <LinearGradient
            colors={[dominant.color + "20", themeStyles.card]}
            style={styles.kpiCard}
          >
            <Ionicons name={dominant.icon} size={24} color={dominant.color} />
            <Text style={styles.kpiValue}>{dominant.name}</Text>
            <Text style={styles.kpiLabel}>Ánimo Frecuente</Text>
          </LinearGradient>
          <LinearGradient
            colors={[themeStyles.accent + "20", themeStyles.card]}
            style={styles.kpiCard}
          >
            <Ionicons name="stats-chart" size={24} color={themeStyles.accent} />
            <Text style={styles.kpiValue}>{totalCount}</Text>
            <Text style={styles.kpiLabel}>Total Semanal</Text>
          </LinearGradient>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Balance Emocional (Red)</Text>
          </View>
          <View style={styles.chartBox}>
            <RadarChart
              data={radarData}
              maxValue={maxCount}
              size={windowWidth - 100}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.mainCard, styles.flex1, { marginRight: 6 }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.smallTitle}>Distribución</Text>
              <TouchableOpacity
                onPress={() => setPopout({ visible: true, type: "pie" })}
              >
                <Ionicons
                  name="expand-outline"
                  size={16}
                  color={themeStyles.accent}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.pieWrapper}>
              <PieChart
                data={pieData}
                donut
                showText={false}
                innerRadius={45}
                radius={65}
                innerCircleColor={themeStyles.card}
                centerLabelComponent={() => (
                  <Ionicons
                    name={dominant.icon}
                    size={24}
                    color={dominant.color}
                  />
                )}
              />
            </View>
          </View>

          <View style={[styles.mainCard, styles.flex1, { marginLeft: 6 }]}>
            <Text style={styles.smallTitle}>Estados Detectados</Text>
            <View style={styles.legendContainer}>
              {pieData.map((item, idx) => (
                <View
                  key={`${item.emotionName}-${idx}`}
                  style={styles.legendItem}
                >
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {item.emotionName}
                  </Text>
                  <Text style={styles.legendPerc}>
                    {Math.round((item.valueCount / totalCount) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Modal
          visible={popout.visible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setPopout({ visible: false, type: null })}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.dismissArea}
              activeOpacity={1}
              onPress={() => setPopout({ visible: false, type: null })}
            />
            <View style={[styles.popoutCard, { width: windowWidth * 0.94 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {popout.type === "line"
                    ? "Trayectoria Semanal"
                    : "Distribución Detallada"}
                </Text>
                <TouchableOpacity
                  onPress={() => setPopout({ visible: false, type: null })}
                >
                  <Ionicons
                    name="close-circle"
                    size={32}
                    color={themeStyles.accent}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {popout.type === "line" ? (
                  <>
                    <LineChart
                      data={lineData}
                      width={windowWidth * 0.78}
                      height={200}
                      spacing={50}
                      initialSpacing={20}
                      color={themeStyles.accent}
                      thickness={4}
                      showValuesAsDataPointsText
                      focusedDataPointIndex={-1}
                      textColor={themeStyles.text}
                      textFontSize={10}
                      dataPointsRadius={5}
                      dataPointsColor={themeStyles.accent}
                      yAxisTextStyle={styles.axisText}
                      xAxisLabelTextStyle={styles.axisText}
                      noOfSections={4}
                      maxValue={1}
                      minValue={-1}
                      stepValue={0.5}
                      formatYLabel={renderYAxisLabels}
                      curved
                      areaChart
                      startFillColor={themeStyles.accent}
                      startOpacity={0.1}
                    />
                    <View style={styles.modalSummary}>
                      <Text style={styles.modalSummaryTitle}>
                        Resumen de Tendencia
                      </Text>
                      <Text style={styles.modalSummaryText}>
                        Tu ánimo predominante ha sido{" "}
                        <Text
                          style={{ color: dominant.color, fontWeight: "900" }}
                        >
                          {dominant.name}
                        </Text>
                        . Se han registrado {totalCount} momentos esta semana.
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.fullPieBox}>
                    <PieChart
                      data={pieData}
                      donut
                      showText={false}
                      innerRadius={80}
                      radius={120}
                      innerCircleColor={themeStyles.card}
                      centerLabelComponent={() => (
                        <View style={styles.centerAlign}>
                          <Ionicons
                            name={dominant.icon}
                            size={40}
                            color={dominant.color}
                          />
                          <Text style={styles.dominantLabel}>
                            {dominant.name}
                          </Text>
                        </View>
                      )}
                    />
                    <View style={styles.modalLegend}>
                      {pieData.map((item, idx) => (
                        <View
                          key={`${item.emotionName}-${idx}`}
                          style={styles.modalLegendItem}
                        >
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text style={styles.modalLegendLabel}>
                            {item.emotionName}
                          </Text>
                          <Text style={styles.modalLegendPerc}>
                            {Math.round((item.valueCount / totalCount) * 100)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
