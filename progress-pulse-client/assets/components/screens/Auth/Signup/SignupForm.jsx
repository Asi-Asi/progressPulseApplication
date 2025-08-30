import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';

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

export default function   SignupForm({ onSubmit }) {
  const [firstName, setFirstName]   = useState('');       
  const [lastName, setLastName]     = useState('');          
  const [sex, setSex]               = useState('');        
  const [email, setEmail]           = useState('');        
  const [password, setPassword]     = useState('');        
  const [loading, setLoading]       = useState(false);     

  const alertFn = Platform.OS === 'web' ? window.alert : Alert.alert;



  async function handleSubmit() {
    // ולידציה בסיסית
    if (!firstName || !lastName || !email || !password) {
      alertFn('Missing info', 'Please fill first name, last name, email and password.');
      return;
    }
    if (!sex) {
      alertFn('Missing info', 'Please choose Male or Female.');
      return;
    }

    try {
      setLoading(true);


      const payload = {
        name: `${firstName} ${lastName}`.trim(),   // ← add this
        firstName: firstName.trim(),
        lastName : lastName.trim(),
        sex,
        email    : email.trim().toLowerCase(),
        password,
      };

      // נתיב השרת — עדכן אם אצלך זה /api/users
      const res = await fetch(`${BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body  : JSON.stringify(payload),
      });

      const ct   = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : await res.text();

      if (!res.ok) {
        const msg = typeof body === 'object' ? body?.message : body;
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const okMsg = typeof body === 'object' ? (body.message || 'Account created successfully') : 'Account created successfully';
      alertFn('Success', okMsg);

      // קריאה חיצונית אם ההורה צריך לדעת שנרשם
      onSubmit?.(payload);

      // איפוס שדות רגישים (אופציונלי)
      setPassword('');
    } catch (e) {
      alertFn('Signup failed', String(e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="w-full">
      {/* First Name */}
      <TextInput
        value={firstName} onChangeText={setFirstName}
        placeholder="First Name" placeholderTextColor="#AAAAAA"
        autoCapitalize="words" textContentType="givenName"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

      {/* Last Name */}
      <TextInput
        value={lastName} onChangeText={setLastName}
        placeholder="Last Name" placeholderTextColor="#AAAAAA"
        autoCapitalize="words" textContentType="familyName"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

     
      {/* Sex (Male/Female) */}
      <View className="flex-row gap-3 mb-4">
        {/* Male */}
        <TouchableOpacity
          onPress={() => setSex('male')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityState={{ selected: sex === 'male' }}
          className={`relative flex-1 items-center justify-center p-4 rounded-2xl border
            ${sex === 'male'
              ? 'bg-secondaryBg border-[#FFD100] shadow-2xl'
              : 'bg-secondaryBg border-[#333533] opacity-80'}`}
          disabled={loading}
        >
          {sex === 'male' && (
            <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#FFD100]" />
          )}
          <Text className={`font-bold ${sex === 'male' ? 'text-[#FFD100]' : 'text-primaryText'}`}>
            Male
          </Text>
        </TouchableOpacity>

        {/* Female */}
        <TouchableOpacity
          onPress={() => setSex('female')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityState={{ selected: sex === 'female' }}
          className={`relative flex-1 items-center justify-center p-4 rounded-2xl border
            ${sex === 'female'
              ? 'bg-secondaryBg border-[#FFD100] shadow-2xl'
              : 'bg-secondaryBg border-[#333533] opacity-80'}`}
          disabled={loading}
        >
          {sex === 'female' && (
            <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#FFD100]" />
          )}
          <Text className={`font-bold ${sex === 'female' ? 'text-[#FFD100]' : 'text-primaryText'}`}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {/* Email */}
      <TextInput
        value={email} onChangeText={setEmail}
        placeholder="Email" placeholderTextColor="#AAAAAA"
        keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
        editable={!loading}
      />

      {/* Password */}
      <TextInput
        value={password} onChangeText={setPassword}
        placeholder="Password" placeholderTextColor="#AAAAAA"
        secureTextEntry autoCapitalize="none" textContentType="password"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-6"
        editable={!loading}
      />

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-action p-4 rounded-xl"
        disabled={loading}
      >
        <Text className="text-primaryText text-center font-bold text-base">
          {loading ? 'Creating Account…' : 'Create Account'}
        </Text>
        {loading ? <ActivityIndicator style={{ marginTop: 10 }} /> : null}
      </TouchableOpacity>
    </View>
  );
}