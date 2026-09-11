import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, type NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "@/hooks/useAuth";

import OnboardingScreen from "@/screens/OnboardingScreen";
import AuthScreen from "@/screens/auth/AuthScreen";
import SearchScreen from "@/screens/SearchScreen";
import ListingDetailScreen from "@/screens/ListingDetailScreen";
import AddListingScreen from "@/screens/AddListingScreen";
import MyListingsScreen from "@/screens/MyListingsScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SendTipScreen from "@/screens/SendTipScreen";
import WriteReviewScreen from "@/screens/WriteReviewScreen";

const ONBOARDING_KEY = "nyumba-finder:has-onboarded";

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ListingDetail: { listingId: string };
  SendTip: { listingId: string; posterName: string };
  WriteReview: { listingId: string; listingTitle: string };
};

export type TabParamList = {
  Search: undefined;
  AddListing: undefined;
  MyListings: undefined;
  Subscription: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Home" }} />
      <Tab.Screen name="AddListing" component={AddListingScreen} options={{ title: "List a place" }} />
      <Tab.Screen name="MyListings" component={MyListingsScreen} options={{ title: "Listings" }} />
      <Tab.Screen name="Subscription" component={SubscriptionScreen} options={{ title: "Plan" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session, initializing } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => setHasOnboarded(value === "true"));
  }, []);

  if (initializing || hasOnboarded === null) return null;

  if (!hasOnboarded) {
    return (
      <OnboardingScreen
        onDone={() => {
          AsyncStorage.setItem(ONBOARDING_KEY, "true");
          setHasOnboarded(true);
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: "Listing" }} />
          <Stack.Screen name="SendTip" component={SendTipScreen} options={{ title: "Send a tip" }} />
          <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: "Write a review" }} />
        </Stack.Navigator>
      ) : (
        <AuthScreen />
      )}
    </NavigationContainer>
  );
}
