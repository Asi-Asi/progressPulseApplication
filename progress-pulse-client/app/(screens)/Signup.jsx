import { View } from 'react-native';
import { Stack } from 'expo-router';

import SignupHeader from '../../assets/components/Auth/Signup/SignupHeader';  // כותרת
import SignupForm   from '../../assets/components/Auth/Signup/SignupForm';    // טופס
import SignupFooter from '../../assets/components/Auth/Signup/SignupFooter';  // תחתית

export default function Signup() {
  return (
    <View className="flex-1 justify-center items-center bg-darkBg px-6">
      {/* קונפיגורציית ההדר למסך הזה */}
      <Stack.Screen
        options={{
          title: 'Sign Up ',                          // טייטל
          headerStyle: { backgroundColor: '#1E1E1E' },// רקע סרגל עליון
          headerTintColor: '#FFD100',                 // צבע טקסט/אייקונים
          headerTitleStyle: { fontWeight: 'bold', fontSize: 26 }, // גודל/משקל
        }}
      />

      <SignupHeader />  {/* כותרת בתוך הדף אם רוצים בנוסף לכותרת הסרגל */}
      <SignupForm />    {/* הטופס */}
      <SignupFooter />  {/* קישורים/ניווט */}
    </View>
  );
}

