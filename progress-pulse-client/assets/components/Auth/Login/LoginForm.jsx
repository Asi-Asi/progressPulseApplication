import { TextInput, TouchableOpacity, Text} from 'react-native';

export default function  LoginForm() {
  return (
    <>
        {/* שדה אימייל */}
        <TextInput
            placeholder="Email"
            placeholderTextColor="#CCCCCC"
            className="w-full bg-secondaryBg text-[#F4F4F4] px-4 py-3 rounded-xl mb-4 border border-[#000000]"
        />

        {/* שדה סיסמה */}
        <TextInput
            placeholder="Password"
            placeholderTextColor="lightGray"
            secureTextEntry
            className="w-full bg-secondaryBg text-primaryText px-4 py-3 rounded-xl mb-6 border border-[#000000]"
        />

        {/* כפתור התחברות */}
        <TouchableOpacity className="w-full bg-action py-3 rounded-xl">
            <Text className="text-center text-primaryText font-bold text-base">Login</Text>
        </TouchableOpacity>
        </>
  );
}