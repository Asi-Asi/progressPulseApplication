import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupForm({ onSubmit }) {
  const [firstName, setFirstName]   = useState('');        // שם פרטי
  const [lastName, setLastName]     = useState('');        // שם משפחה
  const [birthDate, setBirthDate]   = useState(new Date());// תאריך לידה
  const [showPicker, setShowPicker] = useState(false);     // הצגת בורר תאריך
  const [sex, setSex]               = useState('');        // מין: 'male' | 'female'
  const [phone, setPhone]           = useState('');        // טלפון
  const [email, setEmail]           = useState('');        // אימייל
  const [password, setPassword]     = useState('');        // סיסמה

  const handleSubmit = () => {
    // TODO: אפשר להוסיף ולידציה לפני השליחה (אימייל/טלפון/סיסמה)
    onSubmit?.({ firstName, lastName, birthDate, sex, phone, email, password }); // קריאה חיצונית אם צריך
  };

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

      {/* Birth Date */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-secondaryBg p-4 rounded-xl mb-4"
      >
        <Text className="text-lightGray">{birthDate.toDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setBirthDate(selectedDate);  // עדכון תאריך אם נבחר
          }}
        />
      )}

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
        >
          {sex === 'female' && (
            <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#FFD100]" />
          )}
          <Text className={`font-bold ${sex === 'female' ? 'text-[#FFD100]' : 'text-primaryText'}`}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phone */}
      <TextInput
        value={phone} onChangeText={setPhone}
        placeholder="Phone Number" placeholderTextColor="#AAAAAA"
        keyboardType="phone-pad" textContentType="telephoneNumber"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

      {/* Email */}
      <TextInput
        value={email} onChangeText={setEmail}
        placeholder="Email" placeholderTextColor="#AAAAAA"
        keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

      {/* Password */}
      <TextInput
        value={password} onChangeText={setPassword}
        placeholder="Password" placeholderTextColor="#AAAAAA"
        secureTextEntry autoCapitalize="none" textContentType="password"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-6"
      />

      {/* Submit */}
      <TouchableOpacity onPress={handleSubmit} className="bg-action p-4 rounded-xl">
        <Text className="text-primaryText text-center font-bold text-base">
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}