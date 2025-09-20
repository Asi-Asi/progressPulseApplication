import {ScrollView, View} from 'react-native';

import AppLogo from "../assets/components/ui/AppLogo"; 

import LoginHeader from '../assets/components/screens/Auth/Login/LoginHeader';
import LoginForm from '../assets/components/screens/Auth/Login/LoginForm';
import LoginFooter from '../assets/components/screens/Auth/Login/LoginFooter';
import { Stack, useRouter} from 'expo-router';




export default function Login() {
  const router = useRouter();

  return (
    <ScrollView
          className="flex-1 bg-bg"                
          contentContainerClassName="flex-grow"  // ← NativeWind v4+ supports this; use it if available
        >

      <View  className="flex-1 justify-center items-center bg-bg px-6">
        <Stack.Screen
          options={{
            headerTitle: () => <AppLogo/>, 
            headerTitleAlign: "left",
            headerStyle: { backgroundColor: "#FDFBFA" },
          }}
          /> 
        {/* כותרת */}
        <LoginHeader/>

        {/*שדות הטופס*/}
        <LoginForm/>  

        <LoginFooter/>

      </View>
    </ScrollView>
  );
}