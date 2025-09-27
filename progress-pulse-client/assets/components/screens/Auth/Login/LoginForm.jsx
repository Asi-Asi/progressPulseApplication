// assets/components/Auth/Login/LoginForm.jsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, Alert, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../../api/client';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const alertFn = (title, msg = '') => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(`${title}\n${msg}`);
      else console.warn('alert (SSR):', title, msg);
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

      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: String(email).trim().toLowerCase(),
          password,
        }),
      });

      const ct   = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : {};

      if (!res.ok) {
        // clear previous tokens/role/user on failed login
        await AsyncStorage.multiRemove(['accessToken','refreshToken','token','roleLevel','userId','user']);
        alertFn('Login Failed', data?.message || `HTTP ${res.status}`);
        return;
      }

      // Expecting: { message, accessToken, refreshToken, user: { id, roleLevel, ... } }
      const accessToken = data?.accessToken ?? data?.token ?? '';
      const refreshToken = data?.refreshToken ?? '';
      const user = data?.user ?? {};
      const roleLevel = Number(user?.roleLevel ?? NaN);
      const userId = user?.id ?? user?._id ?? '';

      if (!accessToken) {
        // defensive – server should always send accessToken
        alertFn('Login Failed', 'Missing access token in response');
        return;
      }

      // Persist auth/session (store BOTH "accessToken" and legacy "token")
      const kv = [
        ['accessToken', accessToken],
        ['token', accessToken],               // backward compatibility
        ['roleLevel', isNaN(roleLevel) ? '' : String(roleLevel)],
        ['userId', String(userId || '')],
      ];
      if (refreshToken) kv.push(['refreshToken', refreshToken]);
      try { kv.push(['user', JSON.stringify(user || {})]); } catch {}
      await AsyncStorage.multiSet(kv);

      // Friendly greeting
      const greetName =
        user?.firstName ||
        (typeof user?.name === 'string' && user.name.trim() ? user.name.split(' ')[0] : null) ||
        'User';

      // Navigate by role (adjust if your mapping differs)
      // In your app we treat: 30 = Coach, 10/other = non-coach (update as needed)
      if (roleLevel === 30) {
        alertFn('Login Successful!', `Welcome, ${greetName}!`);
        router.replace('/(screens)/coach');
      } else if (roleLevel === 10) {
        // If 10 is Admin in your project, route accordingly; otherwise remove this branch
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

      {/* Password */}
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
