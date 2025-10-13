import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 


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



// ===== Helpers: validation rules =====
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function validateEmail(v) {
  if (!v?.trim()) return 'Email is required.';
  if (!emailRegex.test(v.trim())) return 'Enter a valid email address.';
  return '';
}

function validatePassword(v) {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'At least 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Include at least one uppercase letter.';
  if (!/[a-z]/.test(v)) return 'Include at least one lowercase letter.';
  if (!/[0-9]/.test(v)) return 'Include at least one number.';
  if (!/[^\w\s]/.test(v)) return 'Include at least one symbol.';
  return '';
}

export default function SignupForm({ onSubmit }) {
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [gender, setGender]         = useState('');
  const [email, setEmail]           = useState('');        
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false); 
  
  const [emailErr, setEmailErr]       = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const [showPassword, setShowPassword] = useState(false);       

  const alertFn = Platform.OS === 'web' ? window.alert : Alert.alert;



  async function handleSubmit() {
    // ולידציה בסיסית
    if (!firstName || !lastName || !email || !password) {
      alertFn('Missing info', 'Please fill first name, last name, email and password.');
      return;
    }
    if (!gender) {
      alertFn('Missing info', 'Please choose Male or Female.');
      return;
    }

    // Validate email & password
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr);
    setPasswordErr(pErr);
    if (eErr || pErr) return;


    try {
      setLoading(true);


      const payload = {
        name: `${firstName} ${lastName}`.trim(),   // ← add this
        firstName: firstName.trim(),
        lastName : lastName.trim(),
        gender,
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

  // Live validation helpers (optional but nice UX)
  const onEmailChange = (v) => {
    setEmail(v);
    if (emailErr) setEmailErr(validateEmail(v)); // re-validate to clear as user fixes it
  };
  const onPasswordChange = (v) => {
    setPassword(v);
    if (passwordErr) setPasswordErr(validatePassword(v)); // re-validate to clear as user fixes it
  };

  return (
    <>
      {/* First Name */}
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        placeholderTextColor="#667085"
        autoCapitalize="words"
        textContentType="givenName"
        className="w-full px-4 py-3 rounded-xl mb-4 bg-field border border-fieldBorder text-text"
        editable={!loading}
      />

      {/* Last Name */}
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        placeholderTextColor="#667085"
        autoCapitalize="words"
        textContentType="familyName"
        className="w-full px-4 py-3 rounded-xl mb-4 bg-field border border-fieldBorder text-text"
        editable={!loading}
      />

      {/* gender (Male / Female) – styled like inputs */}
      <View className="w-full flex-row gap-3 mb-4">
        <TouchableOpacity
          onPress={() => setGender('male')}
          disabled={loading}
          activeOpacity={0.9}
          className={`flex-1 px-4 py-3 rounded-xl border 
            ${gender === 'male'
              ? 'bg-field border-primary'
              : 'bg-field border-fieldBorder'}`}
        >
          <Text className={`${gender === 'male' ? 'text-primary' : 'text-text'} font-bold text-center`}>
            Male
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setGender('female')}
          disabled={loading}
          activeOpacity={0.9}
          className={`flex-1 px-4 py-3 rounded-xl border 
            ${gender === 'female'
              ? 'bg-field border-primary'
              : 'bg-field border-fieldBorder'}`}
        >
          <Text className={`${gender === 'female' ? 'text-primary' : 'text-text'} font-bold text-center`}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {/* Email */}
        {!!emailErr && (
          <Text className="text-xs text-[#EF4444]">{emailErr}</Text>
        )}
      <View className="w-full mb-2">
        <TextInput
          value={email}
          onChangeText={onEmailChange}
          onEndEditing={() => setEmailErr(validateEmail(email))}
          placeholder="Email"
          placeholderTextColor="#667085"
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoCorrect={false}
          className="w-full px-4 py-3 rounded-xl mb-4 bg-field border border-fieldBorder text-text"
          editable={!loading}
        />
      </View>


      {/* Password + toggle */}

      {!!passwordErr && (
        <Text className="text-xs text-[#EF4444]">{passwordErr}</Text>
      )}
      <View className="w-full mb-2 relative">
        <TextInput
          value={password}
          onChangeText={onPasswordChange}
          onEndEditing={() => setPasswordErr(validatePassword(password))}
          placeholder="Password"
          placeholderTextColor="#667085"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          textContentType="password"
          className="w-full px-4 py-3 rounded-xl bg-field border border-fieldBorder text-text pr-10"
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-3.5"
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <MaterialCommunityIcons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#667085"
          />
        </TouchableOpacity>
      </View>
      

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        accessibilityState={{ disabled: loading }}
        className="w-full py-3 rounded-xl bg-primary disabled:opacity-60 active:opacity-90"
        activeOpacity={0.9}
      >
        <Text className="text-center text-white font-bold text-base">
          {loading ? 'Creating Account…' : 'Create Account'}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 10 }} color="#FFFFFF" />
        ) : null}
      </TouchableOpacity>
    </>
  );


}