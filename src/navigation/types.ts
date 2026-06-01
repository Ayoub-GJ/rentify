import { NavigatorScreenParams } from '@react-navigation/native';
import type { MockItem } from '../data/mockItems';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ItemDetail: { item: MockItem };
  Reservation: { item: MockItem };
  Search: { openFilters?: boolean };
};

export type LocationsStackParamList = {
  MesLocations: undefined;
  Chat: { rentalId: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Search: undefined;
  AddItem: undefined;
  Locations: NavigatorScreenParams<LocationsStackParamList>;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
