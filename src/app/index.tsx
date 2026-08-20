import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useRouter} from 'expo-router';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from '@/config/firebase';
import {appPages, authPages, dashboard, login} from "@/constants/constants";
import {useTheme} from "react-native-paper"; // Adjust path to your firebase config

export default function Index() {
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        // Listen for Firebase auth state changes to route appropriately on startup
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is logged in, send them to the main app dashboard
                router.replace(`/${appPages}/${dashboard}`);
            } else {
                // User is not logged in, send them to the login screen
                router.replace(`/${authPages}/${login}`);
            }
        });

        return () => unsubscribe();
    }, []);

    // Show a loading spinner while checking auth state to prevent flash of content
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.colors.primary}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});