// assets/components/Auth/Signup/SignupFooter.jsx
import { Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignupFooter() {
  const router = useRouter();

  return (
    <View className="w-full items-center mt-6">
      <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.9}>
        <Text className="text-muted text-center">
          Already have an account?{' '}
          <Text className="text-primary font-bold">Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}