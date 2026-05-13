# RN to Web Migration Skill

## Purpose
Mapea patrones de React Native a React web puro (Vite + React). Usa esta skill cuando necesites convertir código RN a web sin perder funcionalidad.

## RN → Web Mapping Table

### Core Components
| RN | Web |
|---|---|
| `<View>` | `<div>` |
| `<Text>` | `<p>` / `<span>` |
| `<TextInput>` | `<input>` / `<textarea>` |
| `<TouchableOpacity>` | `<button>` / `<div onClick>` |
| `<ScrollView>` | `<div className="overflow-y-auto">` |
| `<FlatList>` | `array.map()` + CSS grid/flex |
| `<SafeAreaView>` | CSS `padding-top: env(safe-area-inset-top)` |
| `<Modal>` | portal overlay (`createPortal`) + div |
| `<ActivityIndicator>` | SVG spinner / `<div className="animate-spin">` |
| `<Switch>` | `<input type="checkbox">` / styled toggle |
| `<Image>` | `<img>` |
| `<KeyboardAvoidingView>` | No necesario en web |

### Style System
| RN | Web |
|---|---|
| `StyleSheet.create({...})` | TailwindCSS classes |
| `StyleSheet.absoluteFillObject` | `className="absolute inset-0"` |
| `flex: 1` | `className="flex-1"` |
| `paddingHorizontal: X` | `className="px-X"` |
| `paddingVertical: X` | `className="py-X"` |
| `marginHorizontal: X` | `className="mx-X"` |
| `{ backgroundColor: theme.foo }` | `style={{ backgroundColor: theme.foo }}` or CSS variable |
| `shadowOffset/Opacity/Radius` | `className="shadow-lg shadow-black/20"` |
| `elevation: X` | `className="shadow-md"` |
| `borderWidth: X` | `className="border border-X"` |
| `borderRadius: X` | `className="rounded-X"` |

### Navigation (React Navigation → React Router)
| RN | Web |
|---|---|
| `navigation.navigate("Screen")` | `navigate("/screen")` |
| `navigation.goBack()` | `navigate(-1)` |
| `navigation.replace("Screen")` | `navigate("/screen", { replace: true })` |
| `navigation.addListener("focus", cb)` | `useEffect` with location or `useEffect(cb, [])` |
| `route.params` | `useParams()` or `useLocation().state` |
| `<Stack.Navigator>` | `<Routes><Route>` |
| `headerShown: false` | No header in page component |
| `initialRouteName` | React Router default route |

### Animations (RN Animated → Framer Motion)
| RN | Web |
|---|---|
| `new Animated.Value(0)` | Framer Motion `initial={{ opacity: 0 }}` |
| `Animated.timing(value, { toValue, duration })` | `animate={{ opacity: 1 }} transition={{ duration: 0.8 }}` |
| `Animated.spring(value, { friction })` | `transition={{ type: "spring", stiffness: 300 }}` |
| `Animated.sequence([...])` | Nested motion elements with stagger |
| `Animated.parallel([...])` | Simultaneous animation props |
| `useNativeDriver: true` | Native DOM animations (always on) |
| `Animated.View` | `<motion.div>` |
| `Animated.Text` | `<motion.p>` |
| `Animated.loop` | `animate` with `repeat: Infinity` |

### Platform APIs
| RN | Web |
|---|---|
| `AsyncStorage.getItem/setItem` | `localStorage.getItem/setItem` |
| `NetInfo.addEventListener` | `window.addEventListener("online"/"offline")` + `navigator.onLine` |
| `Linking.openURL(url)` | `window.open(url, "_blank")` |
| `Alert.alert(title, msg)` | Custom modal / `window.alert(msg)` |
| `Share.share({ message })` | `navigator.share({ text: msg })` |
| `useWindowDimensions()` | `window.innerWidth/innerHeight` + resize listener |
| `useColorScheme()` | `window.matchMedia("(prefers-color-scheme: dark)")` |
| `Platform.OS` | `typeof window !== "undefined"` or `navigator.platform` |
| `__DEV__` | `import.meta.env.DEV` |

### Expo-specific
| Expo | Web |
|---|---|
| `expo-linear-gradient` | `className="bg-gradient-to-r from-X to-Y"` (Tailwind) |
| `expo-notifications` | Web Notification API (`Notification.requestPermission()`) |
| `expo-constants` | `import.meta.env` for app config |
| `@expo/vector-icons` | `lucide-react` or `react-icons` |
| `expo-status-bar` | Not needed |
| `DateTimePicker` | `<input type="time">` / `<input type="date">` |

### Charts (react-native-gifted-charts → Recharts)

| RN | Web |
|---|---|
| `<LineChart data={...}>` | `<LineChart data={...}><Line>` (Recharts) |
| `<PieChart data={...} donut>` | `<PieChart><Pie innerRadius={X}>` (Recharts) |
| `dataPointText` | Custom label renderer |
| Custom colors | `fill` / `stroke` props |

### Offline Support
| RN | Web |
|---|---|
| `@react-native-community/netinfo` | `navigator.onLine` + event listeners |
| Offline badge | Conditional render based on `isOnline` state |
| Cache with AsyncStorage | Cache with localStorage |

## Migration Process

For each file to migrate:
1. Read the original RN file
2. Read any files it imports that also need migration
3. Create web equivalent with above mappings
4. Verify imports resolve correctly
5. Test in browser

## Context Migration Notes

- `ThemeContext.jsx` → Replace `useColorScheme()` with dark mode media query
- `I18nContext.jsx` → Same pattern, remove RN dependencies
- `supabase.js` → Replace `AsyncStorage` with `localStorage`, remove `react-native-url-polyfill`
- `cache.js` → Replace `AsyncStorage` with `localStorage`
- `Icon.jsx` → Replace `@expo/vector-icons` with `lucide-react`
- `ErrorBoundary.jsx` → Convert to function component or keep class, use web styles
- All screen files → Replace RN components with HTML, use Tailwind, Framer Motion, Recharts
