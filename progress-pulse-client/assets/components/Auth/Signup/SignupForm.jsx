// assets/components/Auth/Signup/SignupForm.jsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupForm({ onSubmit }) {
  const [firstName, setFirstName] = useState('');        // שם פרטי
  const [lastName, setLastName]   = useState('');        // שם משפחה
  const [birthDate, setBirthDate] = useState(new Date());// תאריך לידה
  const [showPicker, setShowPicker] = useState(false);   // הצגת בורר תאריך
  const [country, setCountry]     = useState('');        // מדינה
  const [phone, setPhone]         = useState('');        // טלפון
  const [email, setEmail]         = useState('');        // אימייל

  const handleSubmit = () => {
    onSubmit?.({ firstName, lastName, birthDate, country, phone, email }); // קריאה חיצונית אם צריך
    // TODO: ולידציה/שליחה לשרת
  };

  return (
    <View className="w-full">
      <TextInput
        value={firstName} onChangeText={setFirstName}
        placeholder="First Name" placeholderTextColor="#AAAAAA"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

      <TextInput
        value={lastName} onChangeText={setLastName}
        placeholder="Last Name" placeholderTextColor="#AAAAAA"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

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
            if (selectedDate) setBirthDate(selectedDate);
          }}
        />
      )}

      <TextInput
        value={country} onChangeText={setCountry}
        placeholder="Country" placeholderTextColor="#AAAAAA"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

      <TextInput
        value={phone} onChangeText={setPhone}
        placeholder="Phone Number" placeholderTextColor="#AAAAAA"
        keyboardType="phone-pad"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

      <TextInput
        value={email} onChangeText={setEmail}
        placeholder="Email" placeholderTextColor="#AAAAAA"
        keyboardType="email-address"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-6"
      />

      <TouchableOpacity onPress={handleSubmit} className="bg-action p-4 rounded-xl">
        <Text className="text-primaryText text-center font-bold text-base">
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}