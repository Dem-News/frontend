import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { StatusBar } from 'expo-status-bar';
import { Bell, House, Plus, User } from 'phosphor-react-native';
import { View } from 'react-native';
// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import CreateNewsScreen from './src/screens/main/CreateNewsScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import NewsDetailScreen from './src/screens/main/NewsDetailScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#F20D33',
        tabBarInactiveTintColor: '#000',
        tabBarPosition: 'bottom',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          marginHorizontal: 40,
          borderRadius: 24,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 5,
          height: 70,
        },
        tabBarItemStyle: {
          paddingTop: 16,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <House size={size} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
          tabBarLabel: () => null, 
        }}
      />
      <Tab.Screen 
        name="Notifiation" 
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Bell size={size} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
          tabBarLabel: () => null, 
        }}
      />
       <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size} color={color} weight={focused ? 'fill' : 'regular'}/>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateNewsScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <View
              style={{
                width: 60,
                height: 60,
                backgroundColor: '#000',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Plus size={size} color='#fff' weight='regular' />
            </View>
          ),
          tabBarLabel: () => null,
          tabBarStyle: { display: 'none' }
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="NewsDetail" 
            component={NewsDetailScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
} 
