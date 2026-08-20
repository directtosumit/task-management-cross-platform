import {Icon, IconButton, List, useTheme} from "react-native-paper";
import React, {useState} from "react";
import {useThemeContext} from "@/components/ThemeContext";
import {router} from "expo-router";
import {StyleSheet, TouchableOpacity, ViewStyle} from "react-native";
import {DatePickerModal} from "react-native-paper-dates";
import {formatDateToString} from "@/functions/commonFunctions";
import {auth} from "@/config/firebase";
import {signOut} from "firebase/auth";


function ThemeChangeButton() {
    const {isDark, toggleTheme} = useThemeContext();

    return (
        <IconButton
            icon={isDark ? "weather-sunny" : "weather-night"}
            //size={24}
            onPress={toggleTheme}
            accessibilityLabel="Toggle Theme"
        />
    );
}

// Handle user logout
const handleLogout = async () => {
    try {
        await signOut(auth);
        router.replace(`/`);
    } catch (error) {
        console.error('Logout error:', error);
    }
};

function LogOutButton() {

    return (
        <IconButton
            icon={"logout"}
            //size={24}
            onPress={() => handleLogout()}
            accessibilityLabel="Log Out"
        />
    );
}


function DatePicker(props: {
    placeHolder?: string;
    valueHolder: object;
    path: string;
    onSelect?: (value: Date | undefined | null) => void;
    style?: ViewStyle;
}) {
    const theme = useTheme();
    let [state, setState] = useState({v: {}});
    const {placeHolder, valueHolder, path, onSelect, style} = props;
    const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

    let selectedDate = valueHolder?.[path];

    return (
        <>
            <List.Item
                onPress={() => setIsDatePickerOpen(true)}
                titleStyle={{textAlign: "center"}}
                style={[
                    styles.pickerButton,
                    {borderColor: theme.colors.outline},
                    style,
                ]}
                title={
                    selectedDate
                        ? `Date: ${formatDateToString(selectedDate)}`
                        : (placeHolder ?? "Select Date (YYYY-MM-DD)")
                }
                left={(p) => <Icon size={24} {...p} source={"calendar"}/>}
                right={(p) => (
                    <TouchableOpacity
                        onPress={() => {
                            if (valueHolder) {
                                valueHolder[path] = undefined;
                            }
                            onSelect?.(undefined);
                            setState({...state});
                        }}
                    >
                        <Icon size={24} {...p} source={"delete"}/>
                    </TouchableOpacity>
                )}
            />

            <DatePickerModal
                locale="en"
                mode="single"
                visible={isDatePickerOpen}
                onDismiss={() => setIsDatePickerOpen(false)}
                date={selectedDate}
                onConfirm={(params) => {
                    setIsDatePickerOpen(false);

                    if (valueHolder) {
                        valueHolder[path] = params?.date;
                    }
                    onSelect?.(params?.date);
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    pickerButton: {
        borderWidth: 1,
        paddingLeft: 14,
        borderRadius: 5,
    },
});

function getFunctionData(functionElement) {
    return functionElement();
}

export {getFunctionData, handleLogout, ThemeChangeButton, LogOutButton, DatePicker};
