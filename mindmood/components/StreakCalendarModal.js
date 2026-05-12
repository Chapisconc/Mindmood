import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { supabase } from "../services/supabase";

const { width } = Dimensions.get("window");

export default function StreakCalendarModal({ visible, onClose, userId }) {
  const { themeStyles } = useTheme();
  const [activeDates, setActiveDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (visible && userId) {
      fetchActiveDates();
    }
  }, [visible, userId, currentMonth]);

  const fetchActiveDates = async () => {
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    const { data, error } = await supabase
      .from("entries")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    if (!error && data) {
      const dates = data.map((item) => new Date(item.created_at).getDate());
      setActiveDates([...new Set(dates)]); // Días únicos
    }
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    // Espacios vacíos para el inicio del mes
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isActive = activeDates.includes(i);
      days.push(
        <View key={i} style={styles.dayCell}>
          <View
            style={[
              styles.dayCircle,
              isActive && { backgroundColor: "#F97316" }, // Naranja racha
              i === new Date().getDate() &&
                month === new Date().getMonth() && {
                  borderColor: themeStyles.accent,
                  borderWidth: 2,
                },
            ]}
          >
            <Text
              style={[
                styles.dayText,
                { color: isActive ? "#FFF" : themeStyles.text },
              ]}
            >
              {i}
            </Text>
            {isActive && (
              <Ionicons
                name="flame"
                size={8}
                color="#FFF"
                style={styles.miniFlame}
              />
            )}
          </View>
        </View>,
      );
    }
    return days;
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: themeStyles.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeStyles.text }]}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close-circle"
                size={28}
                color={themeStyles.secondaryText}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekLabels}>
            {["D", "L", "M", "M", "J", "V", "S"].map((d, idx) => (
              <Text
                key={`${d}-${idx}`}
                style={[styles.weekText, { color: themeStyles.secondaryText }]}
              >
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderDays()}</View>

          <View style={styles.footer}>
            <View style={styles.legend}>
              <View style={[styles.dot, { backgroundColor: "#F97316" }]} />
              <Text
                style={[
                  styles.legendText,
                  { color: themeStyles.secondaryText },
                ]}
              >
                Días con actividad
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: width - 40,
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "900" },
  weekLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  weekText: {
    fontSize: 12,
    fontWeight: "800",
    width: (width - 88) / 7,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: (width - 88) / 7,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  dayCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: { fontSize: 14, fontWeight: "700" },
  miniFlame: { position: "absolute", bottom: 2 },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 15,
  },
  legend: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: "600" },
});
