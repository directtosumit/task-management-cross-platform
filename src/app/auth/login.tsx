import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View,} from "react-native";
import {Button, HelperText, Text, TextInput, useTheme,} from "react-native-paper";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "@/config/firebase";
import {appPages, authPages, dashboard, register} from "@/constants/constants";
import {ThemeChangeButton} from "@/components/commonComponents"; // Ensure your firebase config path is correct

export default function LoginScreen() {
    const theme = useTheme();
    const router = useRouter();

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [secureText, setSecureText] = useState(true);

    // UI feedback states
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async () => {
        // Basic validation check
        if (!email.trim() || !password.trim()) {
            setErrorMessage("Please enter both email and password.");
            return;
        }

        setErrorMessage("");
        setLoading(true);

        try {
            // Trigger Firebase Authentication[cite: 7]
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password,
            );
            const user = userCredential.user;

            // TODO: Dispatch session data to Redux if required by your store architecture[cite: 7]
            // dispatch(setUser({ uid: user.uid, email: user.email }));

            // Navigate to main application stack upon successful login
            router.replace(`/${appPages}/${dashboard}`);
        } catch (error: any) {
            // Handle authentication error messages gracefully
            console.error("Login error:", error);
            setErrorMessage(
                error.message || "Failed to sign in. Please check your credentials.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, {backgroundColor: theme.colors.background}]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <MaterialCommunityIcons
                        name="check-decagram"
                        size={64}
                        color="#6200ee"
                        style={styles.logoIcon}
                    />
                    <Text variant="headlineMedium" style={styles.title}>
                        Welcome Back
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Log in to continue managing your tasks
                    </Text>
                </View>

                {/* Error Banner / Text */}
                {errorMessage ? (
                    <HelperText
                        type="error"
                        visible={!!errorMessage}
                        style={styles.errorText}
                    >
                        {errorMessage}
                    </HelperText>
                ) : null}

                {/* Form Section */}
                <View style={styles.formContainer}>
                    {/* Email Input Textbox */}
                    <TextInput
                        label="Email Address"
                        value={email}
                        onChangeText={(text) => setEmail(text)}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        style={styles.input}
                        left={<TextInput.Icon icon="email-outline"/>}
                    />

                    {/* Password Input Textbox */}
                    <TextInput
                        label="Password"
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                        mode="outlined"
                        secureTextEntry={secureText}
                        autoCapitalize="none"
                        style={styles.input}
                        left={<TextInput.Icon icon="lock-outline"/>}
                        right={
                            <TextInput.Icon
                                icon={secureText ? "eye-outline" : "eye-off-outline"}
                                onPress={() => setSecureText(!secureText)}
                            />
                        }
                    />
                </View>

                {/* Action Section */}
                <View style={styles.actionContainer}>
                    <Button
                        mode="contained"
                        loading={loading}
                        disabled={loading}
                        onPress={handleLogin}
                        style={styles.loginButton}
                        contentStyle={styles.loginButtonContent}
                    >
                        Log In
                    </Button>

                    {/* Switch to Sign Up Link */}
                    <Button
                        mode="text"
                        onPress={() => router.push(`/${authPages}/${register}`)}
                        style={styles.switchButton}
                    >
                        Don't have an account? Sign Up
                    </Button>
                </View>
            </ScrollView>
            <View style={styles.themeLogOutContainer}>
                <ThemeChangeButton/>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    themeLogOutContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        alignContent: "center",
        alignItems: "center",
        paddingHorizontal: 10
    },
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    headerContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    logoIcon: {
        marginBottom: 12,
    },
    title: {
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        textAlign: "center",
        color: "#666",
    },
    formContainer: {
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: "transparent",
    },
    errorText: {
        textAlign: "center",
        marginBottom: 8,
    },
    actionContainer: {
        marginTop: 8,
    },
    loginButton: {
        borderRadius: 8,
        marginBottom: 12,
    },
    loginButtonContent: {
        paddingVertical: 6,
    },
    switchButton: {
        marginTop: 4,
    },
});
