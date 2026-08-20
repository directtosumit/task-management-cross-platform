import { LogOutButton, ThemeChangeButton } from "@/components/commonComponents";
import { auth } from "@/config/firebase";
import { appPages, taskForm } from "@/constants/constants";
import {
  subscribeToCloudTasks,
  syncLocalChangesToCloud,
} from "@/database/firestore/taskSync";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUserTasks, saveTask, softDeleteTask } from "@/store/taskSlice";
import { Task } from "@/types/task";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Badge,
  Card,
  Chip,
  FAB,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();

  const dispatch = useAppDispatch();
  const { tasks, currentTask, status, error } = useAppSelector(
    (state) => state.tasks,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Completed" | "Pending">("All");
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<
    "Synced" | "Offline" | "Syncing"
  >("Synced");

  // Load tasks from local SQLite on mount and setup sync listeners
  useEffect(() => {
    let unsubscribeCloud: (() => void) | undefined;

    if (auth.currentUser?.uid) dispatch(fetchUserTasks(auth.currentUser.uid));

    // 2. Monitor network connection state
    let unsubscribeNetInfo = NetInfo.addEventListener(async (state) => {
      const online = !!state.isInternetReachable;
      setIsOnline(online);
      if (online && auth.currentUser) {
        setSyncStatus("Syncing");
        await syncLocalChangesToCloud(auth.currentUser?.uid);
        setSyncStatus("Synced");
      } else {
        setSyncStatus("Offline");
      }
    });

    // 3. Setup real-time Firestore sync if user is authenticated
    if (auth.currentUser) {
      unsubscribeCloud = subscribeToCloudTasks(
        auth.currentUser?.uid,
        async () => {
          if (auth.currentUser?.uid)
            await dispatch(fetchUserTasks(auth.currentUser.uid)).unwrap();
          setSyncStatus("Synced");
        },
      );
    }

    return () => {
      if (unsubscribeCloud) unsubscribeCloud();
      unsubscribeNetInfo();
    };
  }, [auth.currentUser?.uid, dispatch]);

  // Handle task completion toggle
  const handleToggleComplete = useCallback(
    async (task: Task) => {
      const updatedTask: Task = {
        ...task,
        completed: !task.completed,
        synced: false, // Flag for background sync
        updatedAt: Date.now(),
      };

      await dispatch(saveTask(updatedTask)).unwrap();

      // Attempt immediate sync if online
      if (isOnline && auth.currentUser) {
        syncLocalChangesToCloud(auth.currentUser?.uid);
      }
    },
    [isOnline, auth.currentUser, dispatch],
  );

  // Handle task deletion
  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      await dispatch(softDeleteTask(taskId)).unwrap();

      if (isOnline && auth.currentUser) {
        syncLocalChangesToCloud(auth.currentUser?.uid);
      }
    },
    [isOnline, auth.currentUser, dispatch],
  );

  const handleEdit = useCallback((id) => {
    router.push(`/${appPages}/${taskForm}?id=${id}`);
  }, []);

  // Filtered tasks computation
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (filter === "Completed") return matchesSearch && task.completed;
      if (filter === "Pending") return matchesSearch && !task.completed;
      return matchesSearch;
    });
  }, [tasks, searchQuery, filter]);

  /* const memoizedData = useMemo(() => {
    return enlargeArray(filteredTasks, 500).map((task, index) => {
      return { ...task, id: `${task?.id || 'task'}-${index}` }; // Stable ID based on index
    });
  }, [filteredTasks]);*/

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top Bar / Header */}
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
          <Text
            variant="titleLarge"
            style={[styles.appTitle, { color: theme.colors.onSurface }]}
          >
            Tasks
          </Text>
          <View style={styles.badgeContainer}>
            <Badge
              style={[
                styles.syncBadge,
                {
                  backgroundColor:
                    syncStatus === "Synced"
                      ? theme.colors.primary
                      : syncStatus === "Syncing"
                        ? theme.colors.tertiary
                        : theme.colors.error,
                },
              ]}
            >
              {syncStatus}
            </Badge>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeChangeButton />
          <LogOutButton />
        </View>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.filterSection}>
        <TextInput
          label="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          dense
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
        />

        <View style={styles.chipContainer}>
          {(["All", "Pending", "Completed"] as const).map((item) => (
            <Chip
              key={item}
              selected={filter === item}
              onPress={() => setFilter(item)}
              style={styles.chip}
              showSelectedCheck
            >
              {item}
            </Chip>
          ))}
        </View>
      </View>

      {/* Main Content Area: Optimized FlatList */}
      <FlatList
        data={filteredTasks}
        //data={memoizedData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        getItemLayout={(data, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        // removeClippedSubviews={true}
        renderItem={({ item }) => (
          <TaskItem
            item={item}
            onToggle={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDeleteTask}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={64}
              color={theme.colors.outline}
            />
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.outline }]}
            >
              No tasks found. Tap '+' to create one.
            </Text>
          </View>
        }
      />

      {/* Floating Action Button (FAB) */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => router.push(`/${appPages}/${taskForm}`)}
      />
    </View>
  );
}

const TaskItem = React.memo(({ item, onToggle, onEdit, onDelete }) => {
  const theme = useTheme();
  const isPastDue = item.dueDate
    ? new Date(item.dueDate).getTime() < Date.now() && !item.completed
    : false;

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <IconButton
            icon={
              item.completed
                ? "checkbox-marked-circle"
                : "checkbox-blank-circle-outline"
            }
            iconColor={
              item.completed
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant
            }
            size={24}
            onPress={() => onToggle(item)}
            style={styles.checkboxIcon}
          />
          <View style={styles.titleDescriptionContainer}>
            <Text
              variant="titleMedium"
              numberOfLines={1}
              style={[
                styles.taskTitle,
                {
                  color: theme.colors.onSurface,
                  textDecorationLine: item.completed ? "line-through" : "none",
                },
              ]}
            >
              {item.title}
            </Text>
            <Text
              variant="bodyMedium"
              numberOfLines={2}
              style={[
                styles.taskDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.dueDate ? (
            <Chip
              icon="clock-outline"
              style={[
                styles.dateChip,
                {
                  backgroundColor: isPastDue
                    ? theme.colors.errorContainer
                    : theme.colors.elevation.level2,
                },
              ]}
              textStyle={{
                color: isPastDue
                  ? theme.colors.onErrorContainer
                  : theme.colors.onSurface,
              }}
            >
              {new Date(item.dueDate).toLocaleString()}
            </Chip>
          ) : (
            <View />
          )}

          <View style={styles.actionIcons}>
            <IconButton
              icon="pencil-outline"
              size={20}
              onPress={() => onEdit(item.id)}
            />
            <IconButton
              icon="delete-outline"
              iconColor={theme.colors.error}
              size={20}
              onPress={() => onDelete(item.id)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appTitle: {
    fontWeight: "bold",
    marginRight: 8,
  },
  badgeContainer: {
    justifyContent: "center",
  },
  syncBadge: {
    fontSize: 10,
    height: 20,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterSection: {
    padding: 16,
  },
  searchInput: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    marginRight: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxIcon: {
    margin: 0,
    marginRight: 8,
  },
  titleDescriptionContainer: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingLeft: 32,
  },
  dateChip: {
    //height: 28,
  },
  actionIcons: {
    flexDirection: "row",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 64,
  },
  emptyText: {
    marginTop: 12,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});
