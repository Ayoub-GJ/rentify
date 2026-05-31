import { NavigatorScreenParams } from '@react-navigation/native';
import type { MockItem } from '../data/items';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ItemDetail: { item: MockItem };
  Reservation: { item: MockItem };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Search: undefined;
  AddItem: undefined;
  Locations: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
