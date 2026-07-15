import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: boolean, icon: IoniconsName, iconOutline: IoniconsName) {
  return <Ionicons name={focused ? icon : iconOutline} size={24} color={focused ? Colors.brand[500] : Colors.gray[400]} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand[500],
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray[100],
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ focused }) => tabIcon(focused, "home", "home-outline"),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: "Clientes",
          tabBarIcon: ({ focused }) => tabIcon(focused, "people", "people-outline"),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Agenda",
          tabBarIcon: ({ focused }) => tabIcon(focused, "calendar", "calendar-outline"),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ focused }) => tabIcon(focused, "bar-chart", "bar-chart-outline"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Config.",
          tabBarIcon: ({ focused }) => tabIcon(focused, "settings", "settings-outline"),
        }}
      />
    </Tabs>
  );
}
