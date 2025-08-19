// assets/components/Auth/Signup/SignupFooter.jsx
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignupFooter() {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push('/')}>
      <Text className="text-[#AAAAAA] mt-6">
        Already have an account? <Text className="text-[#FFD100] font-bold">Log in</Text>
      </Text>
    </TouchableOpacity>
  );
}