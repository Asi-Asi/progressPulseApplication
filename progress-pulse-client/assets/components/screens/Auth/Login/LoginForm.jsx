// assets/components/Auth/Login/LoginForm.jsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, Alert, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const PROD_URL = 'https://progresspulseapplication.onrender.com';
const DEV_URL  = Platform.select({
  web:     'http://localhost:5500',
  ios:     'http://localhost:5500',
  android: 'http://10.0.2.2:5500',
  default: 'http://192.168.137.1:5500',
});

// החלף ל-true כשאתה רוצה לעבוד מול Render
const USE_PROD = true;

const BASE_URL = USE_PROD ? PROD_URL : DEV_URL;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState('');     // אימייל
  const [password, setPassword] = useState('');     // סיסמה
  const [loading, setLoading]   = useState(false);  // מצב טעינה (לספינר)

  const alertFn = (title, msg = '') => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n${msg}`);
    } else {
      // רינדור בצד שרת – לא להשתמש ב-window
      console.warn('alert (SSR):', title, msg);
    }
  } else {
    Alert.alert(title, msg);
  }
};

  const handleLogin = async () => {
  if (!email || !password) {
    alertFn('Error', 'Please fill in both fields');
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const ct   = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : {};

    if (!res.ok) {
      // נקה טוקן ישן אם קיים
      await AsyncStorage.multiRemove(['token','roleLevel','userId']);
      alertFn('Login Failed', data?.message || `HTTP ${res.status}`);
      return;
    }

    const accessToken = data.accessToken ?? data.token ?? '';
    const user        = data.user ?? {};
    const roleLevel   = Number(user.roleLevel);  // 10 admin, 20 trainee, 30 coach (לפי הזיכרון)
    const userId      = user.id ?? user._id ?? '';

    // שמירה ל-AsyncStorage
    await AsyncStorage.multiSet([
      ['token',     accessToken],
      ['roleLevel', String(roleLevel || '')],
      ['userId',    String(userId || '')],
    ]);

    // שם לברכה עם fallback חכם
    const greetName =
      user.firstName ||
      (typeof user.name === 'string' && user.name.trim() ? user.name.split(' ')[0] : null) ||
      'User';

    // ניתוב לפי תפקיד
    if (roleLevel === 10) {
      alertFn('Welcome Admin!', 'Redirecting to admin dashboard…');
      router.replace('/AdminPage');
    } else {
      alertFn('Login Successful!', `Welcome, ${greetName}!`);
      router.replace('/(screens)/plan');
    }
  } catch (e) {
    console.error(e);
    alertFn('Error', 'Something went wrong. Please try again later.');
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      {/* Email */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#667085" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="w-full px-4 py-3 rounded-xl mb-4 bg-field border border-fieldBorder text-text"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#667085"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="w-full px-4 py-3 rounded-xl mb-6 bg-field border border-fieldBorder text-text"
      />

      {/* Button + Spinner */}
      <TouchableOpacity
        className="w-full py-3 rounded-xl bg-primary disabled:opacity-60 active:opacity-90"
        onPress={handleLogin}
        disabled={loading}
        accessibilityState={{ disabled: loading }}
      >
        <Text className="text-center text-white font-bold text-base">
          {loading ? "Logging in…" : "Login"}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 10 }} color={"#FFFFFF"} />
        ) : null}
      </TouchableOpacity>
    </>
  );
}
