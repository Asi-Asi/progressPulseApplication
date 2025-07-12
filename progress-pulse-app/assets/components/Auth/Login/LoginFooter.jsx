import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';


export default function LoginFooter() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/Signup')}>

    <Text className="text-[#AAAAAA] mt-6">
        Don’t have an account? <Text className="text-[#FFD100] font-bold">Sign Up</Text>
      </Text>
    </TouchableOpacity>
  );
}
