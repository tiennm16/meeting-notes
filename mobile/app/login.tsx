import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/src/hooks/auth";
import { CustomizedButton } from "@/src/components/CustomizedButton";
import { CustomizedText } from "@/src/components/CustomizedText";
import { STRINGS } from "@/src/constant";
import { colors } from "@/src/theme";

export default function LoginScreen() {
  const { login, loggingIn, error } = useAuth();
  const [username, setUsername] = useState("tiennm0311@gmail.com");
  const [password, setPassword] = useState("123@123aA");

  useEffect(() => {
    if (error) Alert.alert(STRINGS.login.failedTitle, error);
  }, [error]);

  const onSubmit = async () => {
    if (!username.trim() || !password) {
      Alert.alert(STRINGS.login.missingTitle, STRINGS.login.missingBody);
      return;
    }
    const ok = await login(username.trim(), password);
    if (ok) router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <CustomizedText variant="h1">{STRINGS.login.title}</CustomizedText>
        <CustomizedText
          variant="bodySmall"
          color="secondary"
          style={styles.subtitle}
        >
          {STRINGS.login.subtitle}
        </CustomizedText>

        <TextInput
          style={styles.input}
          placeholder={STRINGS.login.usernamePlaceholder}
          placeholderTextColor={colors.text.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          editable={!loggingIn}
        />
        <TextInput
          style={styles.input}
          placeholder={STRINGS.login.passwordPlaceholder}
          placeholderTextColor={colors.text.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loggingIn}
          onSubmitEditing={onSubmit}
        />

        <CustomizedButton
          variant="primary"
          size="lg"
          fullWidth
          loading={loggingIn}
          onPress={onSubmit}
          style={styles.button}
        >
          <CustomizedText variant="button" color="onAccent">
            {STRINGS.login.submit}
          </CustomizedText>
        </CustomizedButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.default,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  subtitle: { marginBottom: 8 },
  input: {
    backgroundColor: colors.bg.input,
    borderRadius: 8,
    padding: 14,
    color: colors.text.primary,
    fontSize: 16,
  },
  button: { marginTop: 8 },
});
