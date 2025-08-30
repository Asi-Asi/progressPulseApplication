import { View, Text,  TextInput, TouchableOpacity } from 'react-native';


import LoginHeader from '../assets/components/Auth/Login/LoginHeader';
import LoginForm from '../assets/components/Auth/Login/LoginForm';
import LoginFooter from '../assets/components/Auth/Login/LoginFooter';
import { Stack, useRouter} from 'expo-router';




export default function Login() {
  const router = useRouter();

  return (
    <View  className="flex-1 justify-center items-center bg-[#1E1E1E] px-6">
      <Stack.Screen name='Login' options={{  title: 'Login ',
        headerStyle: {
        backgroundColor: '#1E1E1E' // צבע הרקע של הסרגל העליון
        },
        headerTintColor: '#FFD100', // צבע הטקסט וכפתורי חזור
        headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 26, // גודל הטקסט של הכותרת
        } }}
      />
      {/* כותרת */}
      <LoginHeader/>

      {/*שדות הטופס*/}
      <LoginForm/>  
      


      <TouchableOpacity onPress={() => router.push('/categories/MusclesCategoryScreen')}>
        <Text>Go to Muscles Category</Text>
      </TouchableOpacity>
      

     <TouchableOpacity onPress={() => router.push('/Profile')} style={{ marginTop: 6 }}>
      <Text style={{ color: '#FF5A2C', fontWeight: '700' }}>Go to Profile</Text>
      </TouchableOpacity>

      <LoginFooter/>

    </View>
  );
}