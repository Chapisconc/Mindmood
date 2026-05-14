/* ==========================================================================
   Icon.jsx — COMPONENTE DE ÍCONOS UNIVERSAL para MindMood
   Traduce nombres de íconos (compatibles con Ionicons / Material)
   a componentes de lucide-react mediante un diccionario MAPPING.
   Renderiza <Icon name="heart-outline" size={20} color="#xxx" />.
   ========================================================================== */

/* Importación de todos los íconos de lucide-react usados en la app */
import {
  Heart, Moon, Sun, Mail, Lock, Eye, EyeOff, PlusCircle,
  ChevronRight, Menu, Calendar, Clock, LogOut, Users, BookOpen,
  PieChart, BarChart3, ChevronDown, MessageCircle, CheckCircle,
  Flame, TrendingUp, Maximize2, XCircle, AlertCircle,
  Phone, Sparkles, UserCircle, CloudOff, RefreshCw,
  ChevronLeft, Star, Zap, MinusCircle, HeartPulse,
  CloudRain, Frown, HelpCircle, Check, MessageSquare,
  ArrowRight, Activity, AlertTriangle, Bell, BellOff,
  FileText, Share2, Search, Filter, Home, Smile,
  Send, Trash2, Edit3, Info, Settings,
} from "lucide-react";

/**
 * MAPPING — Diccionario que asigna nombres de íconos
 * (estilo Ionicons, ej. "heart-outline") a componentes de lucide-react.
 * Permite mantener compatibilidad con código previo.
 */
const MAPPING = {
  "heart-outline": Heart,
  "moon-outline": Moon,
  "sunny-outline": Sun,
  "white-balance-sunny": Sun,
  "weather-night": Moon,
  "email-outline": Mail,
  "mail-outline": Mail,
  "lock-outline": Lock,
  "lock-closed-outline": Lock,
  "lock-closed": Lock,
  "eye-outline": Eye,
  "eye-off-outline": EyeOff,
  "plus-circle": PlusCircle,
  "chevron-right": ChevronRight,
  "chevron-forward": ChevronRight,
  "chevron-left": ChevronLeft,
  "chevron-back": ChevronLeft,
  "chevron-down": ChevronDown,
  "menu": Menu,
  "calendar-month-outline": Calendar,
  "calendar-outline": Calendar,
  "clock-outline": Clock,
  time: Clock,
  "time-outline": Clock,
  logout: LogOut,
  "log-out-outline": LogOut,
  "account-group-outline": Users,
  people: Users,
  "notebook-outline": BookOpen,
  book: BookOpen,
  "chart-donut": PieChart,
  pie: PieChart,
  "chart-timeline-variant": BarChart3,
  aperture: BarChart3,
  "stats-chart": TrendingUp,
  "chat-question-outline": MessageCircle,
  "chatbubble-ellipses": MessageCircle,
  "checkmark-circle": CheckCircle,
  "check-circle-outline": CheckCircle,
  fire: Flame,
  flame: Flame,
  "expand-outline": Maximize2,
  "arrows-expand": Maximize2,
  "close-circle-outline": XCircle,
  "close-circle": XCircle,
  "alert-circle": AlertCircle,
  "alert-circle-outline": AlertCircle,
  "phone-outline": Phone,
  call: Phone,
  "call-outline": Phone,
  sparkles: Sparkles,
  "auto-fix": Sparkles,
  "person-outline": UserCircle,
  "account-circle-outline": UserCircle,
  "cloud-off-outline": CloudOff,
  "cloud-off": CloudOff,
  "refresh-circle": RefreshCw,
  refresh: RefreshCw,
  star: Star,
  "star-outline": Star,
  "happy-outline": Smile,
  flash: Zap,
  "flash-outline": Zap,
  "remove-circle": MinusCircle,
  "minus-circle-outline": MinusCircle,
  "pulse-outline": HeartPulse,
  "rainy-outline": CloudRain,
  "weather-rainy-outline": CloudRain,
  "sad-outline": Frown,
  "emoticon-sad-outline": Frown,
  "help-circle": HelpCircle,
  "help-circle-outline": HelpCircle,
  checkmark: Check,
  mail: Send,
  "email": Send,
  "notifications-off": BellOff,
  "notifications": Bell,
  "report": FileText,
  "share-social": Share2,
  search: Search,
  filter: Filter,
  home: Home,
  "trash-outline": Trash2,
  "pencil-outline": Edit3,
  "information-outline": Info,
  "settings-outline": Settings,
  "message-text-outline": MessageSquare,
  "arrow-forward": ArrowRight,
  "warning-outline": AlertTriangle,
};

/**
 * Icon — Componente que renderiza un ícono de lucide-react
 * a partir de un nombre "compatible Ionicons".
 *
 * @prop {string} name      — Nombre del ícono (ej. "heart-outline")
 * @prop {number} size      — Tamaño en píxeles (default: 20)
 * @prop {string} color     — Color CSS (default: "currentColor")
 * @prop {string} className — Clases adicionales Tailwind
 */
export default function Icon({ name, size = 20, color = "currentColor", className = "" }) {
  const mapped = MAPPING[name] || MAPPING[name.toLowerCase()];
  if (!mapped) return null;
  const Component = mapped;
  return <Component size={size} color={color} className={className} />;
}
