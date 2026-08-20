import { auth } from "@/config/firebase";
import { syncLocalChangesToCloud } from "@/database/firestore/taskSync";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCurrentTask, fetchTaskById, saveTask } from "@/store/taskSlice";
import { Task } from "@/types/task";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  HelperText,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";

export default function TaskFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const taskId = params.id as string | undefined;

  const isEditing = !!taskId;

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 86400000)); // Default to tomorrow

  // Picker Modals Visibility States
  const [visibleDatePicker, setVisibleDatePicker] = useState(false);
  const [visibleTimePicker, setVisibleTimePicker] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useAppDispatch();
  const currentTask = useAppSelector((state) => state.tasks.currentTask);

  useEffect(() => {
    if (isEditing && taskId) {
      // Dispatch the Redux thunk instead of calling getLocalTaskById directly
      dispatch(fetchTaskById(taskId));
    }

    // Cleanup: clear currentTask when unmounting or leaving edit mode
    return () => {
      dispatch(clearCurrentTask());
    };
  }, [isEditing, taskId, dispatch]);

  // Watch for changes in Redux's currentTask and populate the form fields
  useEffect(() => {
    if (currentTask && isEditing) {
      setTitle(currentTask.title);
      setDescription(currentTask.description ?? "");
      if (currentTask.dueDate) {
        setDueDate(new Date(currentTask.dueDate));
      }
    }
  }, [currentTask, isEditing]);

  // Date Picker Handlers
  const onDismissDatePicker = React.useCallback(() => {
    setVisibleDatePicker(false);
  }, []);

  const onConfirmDatePicker = React.useCallback(
    (params: { date?: Date | undefined }) => {
      setVisibleDatePicker(false);
      if (params.date) {
        const updatedDate = new Date(params.date);
        // Preserve current time fields
        updatedDate.setHours(dueDate.getHours());
        updatedDate.setMinutes(dueDate.getMinutes());
        updatedDate.setSeconds(0);
        setDueDate(updatedDate);
      }
    },
    [dueDate],
  );

  // Time Picker Handlers
  const onDismissTimePicker = React.useCallback(() => {
    setVisibleTimePicker(false);
  }, []);

  const onConfirmTimePicker = React.useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setVisibleTimePicker(false);
      const updatedDate = new Date(dueDate);
      updatedDate.setHours(hours);
      updatedDate.setMinutes(minutes);
      updatedDate.setSeconds(0);
      setDueDate(updatedDate);
    },
    [dueDate],
  );

  // Handle Save (Create or Update)
  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage("Task title is mandatory.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      if (!auth.currentUser?.uid) {
        router.replace("/");
        return;
      }
      const userId = auth.currentUser?.uid;
      const id =
        isEditing && taskId
          ? taskId
          : `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const task: Task = {
        id,
        userId,
        title: title.trim(),
        description: description.trim(),
        completed: false,
        dueDate: dueDate.toISOString(),
        synced: false, // Initially false until cloud write succeeds or sync runs
        updatedAt: Date.now(),
      };

      // 1. Save locally to SQLite first (offline-first foundation)
      await dispatch(saveTask(task)).unwrap();

      // 2. Check network state and trigger immediate cloud sync if online
      const netState = await NetInfo.fetch();
      // console.log({isConnected: netState.isInternetReachable, currentUser: auth.currentUser, netState})
      if (netState.isInternetReachable && auth.currentUser) {
        await syncLocalChangesToCloud(auth.currentUser.uid);
      }

      // 3. Return to Dashboard
      router.back();
    } catch (error: any) {
      console.error("Error saving task:", error);
      setErrorMessage(error.message || "Failed to save task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
          />
          <Text
            variant="titleLarge"
            style={[styles.headerTitle, { color: theme.colors.onSurface }]}
          >
            {isEditing ? "Edit Task" : "Create Task"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Error Banner */}
        {errorMessage ? (
          <HelperText
            type="error"
            visible={!!errorMessage}
            style={styles.errorText}
          >
            {errorMessage}
          </HelperText>
        ) : null}

        {/* Input Form Container */}
        <View style={styles.formContainer}>
          {/* Title TextInput */}
          <TextInput
            label="Task Title *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="format-title" />}
          />

          {/* Description TextInput */}
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
            left={<TextInput.Icon icon="text-box-outline" />}
          />

          {/* Due Date & Time Picker Controls */}
          <View
            style={[
              styles.dateContainer,
              {
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <View style={styles.dateLabelContainer}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={22}
                color={theme.colors.primary}
              />
              <View>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.dateSubtext,
                    { color: theme.colors.secondary },
                  ]}
                >
                  Due Deadline
                </Text>
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.dateLabelText,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {dueDate.toLocaleDateString()}{" "}
                  {dueDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.pickerButtonsGroup}>
              <Button
                mode="outlined"
                onPress={() => setVisibleDatePicker(true)}
                compact
                style={styles.pickerBtn}
              >
                Date
              </Button>
              <Button
                mode="outlined"
                onPress={() => setVisibleTimePicker(true)}
                compact
                style={styles.pickerBtn}
              >
                Time
              </Button>
            </View>
          </View>

          {/* react-native-paper-dates Modals */}
          <DatePickerModal
            locale="en"
            mode="single"
            visible={visibleDatePicker}
            onDismiss={onDismissDatePicker}
            date={dueDate}
            onConfirm={onConfirmDatePicker}
          />

          <TimePickerModal
            visible={visibleTimePicker}
            onDismiss={onDismissTimePicker}
            onConfirm={onConfirmTimePicker}
            hours={dueDate.getHours()}
            minutes={dueDate.getMinutes()}
          />
        </View>

        {/* Footer Action Container */}
        <View style={styles.footerContainer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={handleSave}
            style={styles.saveButton}
          >
            Save Task
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
    marginLeft: 4,
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  dateLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dateSubtext: {
    fontSize: 12,
  },
  dateLabelText: {
    fontWeight: "600",
  },
  pickerButtonsGroup: {
    flexDirection: "row",
    gap: 8,
  },
  pickerBtn: {
    minWidth: 60,
  },
  errorText: {
    textAlign: "center",
    marginBottom: 12,
  },
  footerContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
  },
});
