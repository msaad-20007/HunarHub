import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-native-navigation/native';
import { createNativeStackNavigator } from '@react-native-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/Theme';

// Import Screens (to be created)
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import CustomerHomeScreen from '../screens/customer/HomeScreen';
import WorkerDetailsScreen from '../screens/customer/WorkerDetailsScreen';
import BookingScreen from '../screens/customer/BookingScreen';
import ChatScreen from '../screens/customer/ChatScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import SearchScreen from '../screens/customer/SearchScreen';
import WorkerDashboard from '../screens/worker/WorkerDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';

const Stack = createNativeStackNavigator();

const NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
  },
};

const AppNavigator = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role); // 'CUSTOMER', 'WORKER', 'ADMIN', or null
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Or a Splash Screen component
  }

  return (
    <NavigationContainer theme={NavigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userRole === null ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} initialParams={{ setUserRole }} />
            <Stack.Screen name="Signup" component={SignupScreen} initialParams={{ setUserRole }} />
          </>
        ) : userRole === 'CUSTOMER' ? (
          // Customer Stack
          <>
            <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} initialParams={{ setUserRole }} />
            <Stack.Screen name="WorkerDetails" component={WorkerDetailsScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
          </>
        ) : userRole === 'WORKER' ? (
          // Worker Stack
          <Stack.Screen name="WorkerDashboard" component={WorkerDashboard} initialParams={{ setUserRole }} />
        ) : userRole === 'ADMIN' ? (
          // Admin Stack
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} initialParams={{ setUserRole }} />
        ) : (
          <Stack.Screen name="Placeholder" component={CustomerHomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
