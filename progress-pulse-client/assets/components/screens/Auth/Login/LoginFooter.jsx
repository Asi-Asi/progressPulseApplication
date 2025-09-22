import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';


export default function LoginFooter() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/auth/signup")}
      className="mt-6"
      accessibilityRole="button"
    >
      <Text className="text-muted text-center">
        Don’t have an account?{" "}
        <Text className="text-primary font-semibold">Sign Up</Text>
      </Text>
    </TouchableOpacity>
  );
}
