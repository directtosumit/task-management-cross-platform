import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View,} from "react-native";
import {Button, HelperText, Text, TextInput, useTheme,} from "react-native-paper";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "@/config/firebase";
import {appPages, authPages, dashboard, login} from "@/constants/constants";
import {ThemeChangeButton} from "@/components/commonComponents";

export default function RegisterScreen() {
    const theme = useTheme();
    const router = useRouter();

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [secureText, setSecureText] = useState(true);
    const [secureConfirmText, setSecureConfirmText] = useState(true);

    // UI feedback states
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleRegister = async () => {
        // Basic validation checks
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            setErrorMessage("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password should be at least 6 characters long.");
            return;
        }

        setErrorMessage("");
        setLoading(true);

        try {
            // Trigger Firebase Registration
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password,
            );
            const user = userCredential.user;

            // TODO: Initialize user state or local profile if required

            // Navigate to main application stack upon successful signup
            router.replace(`/${appPages}/${dashboard}`);
        } catch (error: any) {
            // Handle registration error messages gracefully
            console.error("Registration error:", error);
            setErrorMessage(
                error.message || "Failed to create account. Please try again.",
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
                        name="account-plus-outline"
                        size={64}
                        color={theme.colors.primary}
                        style={styles.logoIcon}
                    />
                    <Text variant="headlineMedium" style={[styles.title, {color: theme.colors.onBackground}]}>
                        Create Account
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subtitle, {color: theme.colors.secondary}]}>
                        Sign up to sync tasks across all devices
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

                    {/* Confirm Password Input Textbox */}
                    <TextInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={(text) => setConfirmPassword(text)}
                        mode="outlined"
                        secureTextEntry={secureConfirmText}
                        autoCapitalize="none"
                        style={styles.input}
                        left={<TextInput.Icon icon="lock-check-outline"/>}
                        right={
                            <TextInput.Icon
                                icon={secureConfirmText ? "eye-outline" : "eye-off-outline"}
                                onPress={() => setSecureConfirmText(!secureConfirmText)}
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
                        onPress={handleRegister}
                        style={styles.registerButton}
                        contentStyle={styles.registerButtonContent}
                    >
                        Sign Up
                    </Button>

                    {/* Switch to Login Link */}
                    <Button
                        mode="text"
                        onPress={() => router.push(`/${authPages}/${login}`)}
                        style={styles.switchButton}
                    >
                        Already have an account? Log In
                    </Button>
                </View>
            </ScrollView>

            {/* Footer Theme Switcher Container */}
            <View style={styles.themeLogOutContainer}>
                <ThemeChangeButton/>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
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
    registerButton: {
        borderRadius: 8,
        marginBottom: 12,
    },
    registerButtonContent: {
        paddingVertical: 6,
    },
    switchButton: {
        marginTop: 4,
    },
    themeLogOutContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        alignContent: "center",
        alignItems: "center",
        paddingHorizontal: 10
    },
});