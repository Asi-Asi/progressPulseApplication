// import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
// import { Stack } from 'expo-router';
// import { useState } from 'react';
// import DateTimePicker from '@react-native-community/datetimepicker';

// export default function Signup() {
//   const [birthDate, setBirthDate] = useState(new Date());
//   const [showPicker, setShowPicker] = useState(false);

//   return (
//     <ScrollView className="flex-1 bg-darkBg px-6 py-12">
//       <Stack.Screen name='Signup' options={{  title: 'Sign Up ',
//         headerStyle: {
//         backgroundColor: '#1E1E1E' // צבע הרקע של הסרגל העליון
//         },
//         headerTintColor: '#FFD100', // צבע הטקסט וכפתורי חזור
//         headerTitleStyle: {
//         fontWeight: 'bold',
//         fontSize: 26, // גודל הטקסט של הכותרת 
//         } }}
//       />
//       {/* <Text className="text-highlight text-2xl font-bold text-center mb-8">Sign Up</Text> */}

//       <TextInput
//         placeholder="First Name"
//         placeholderTextColor="#AAAAAA"
//         className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
//       />

//       <TextInput
//         placeholder="Last Name"
//         placeholderTextColor="#AAAAAA"
//         className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
//       />

//       <TouchableOpacity
//         onPress={() => setShowPicker(true)}
//         className="bg-secondaryBg p-4 rounded-xl mb-4"
//       >
//         <Text className="text-lightGray">{birthDate.toDateString()}</Text>
//       </TouchableOpacity>

//       {showPicker && (
//         <DateTimePicker
//           value={birthDate}
//           mode="date"
//           display="default"
//           onChange={(event, selectedDate) => {
//             setShowPicker(false);
//             if (selectedDate) setBirthDate(selectedDate);
//           }}
//           maximumDate={new Date()}
//         />
//       )}

//       <TextInput
//         placeholder="Country"
//         placeholderTextColor="#AAAAAA"
//         className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
//       />

//       <TextInput
//         placeholder="Phone Number"
//         placeholderTextColor="#AAAAAA"
//         keyboardType="phone-pad"
//         className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
//       />

//       <TextInput
//         placeholder="Email"
//         placeholderTextColor="#AAAAAA"
//         keyboardType="email-address"
//         className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-6"
//       />

//       <TouchableOpacity className="bg-action p-4 rounded-xl">
//         <Text className="text-primaryText text-center font-bold text-base">Create Account</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }



// app/(screens)/Signup.jsx
import React from "react";
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";

import SignupHeader from "../../assets/components/Auth/Signup/SignupHeader";
import SignupForm from "../../assets/components/Auth/Signup/SignupForm";
import SignupFooter from "../../assets/components/Auth/Signup/SignupFooter";

export default function Signup() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#1E1E1E" }}>
      <Stack.Screen
        options={{
          title: "Login", // keep header style identical to login
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "bold", fontSize: 26 },
        }}
      />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 32,
          backgroundColor: "#1E1E1E",
        }}
      >
        <SignupHeader />
        <SignupForm />
        <SignupFooter />
      </View>
    </ScrollView>
  );
}


