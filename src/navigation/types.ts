import { NavigatorScreenParams } from '@react-navigation/native';
import type { MockItem } from '../data/mockItems';

export type ChatScreenParams = {
  conversationId: string;
  itemTitre: string;
  itemImage: string;
  otherUserName: string;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ItemDetail: { item: MockItem };
  Reservation: { item: MockItem };
  Chat: ChatScreenParams;
};

export type SearchStackParamList = {
  SearchScreen: { openFilters?: boolean };
  ItemDetail: { item: MockItem };
  Reservation: { item: MockItem };
  Chat: ChatScreenParams;
};

export type LocationsStackParamList = {
  MesLocations: { initialTab?: 'encours' | 'annonces' | 'demandes' } | undefined;
  ItemDetail: { item: MockItem };
  Reservation: { item: MockItem };
  Chat: ChatScreenParams;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Recherche: NavigatorScreenParams<SearchStackParamList>;
  AddItem: { itemId?: string } | undefined;
  Locations: NavigatorScreenParams<LocationsStackParamList>;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
