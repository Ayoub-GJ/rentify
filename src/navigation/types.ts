import { NavigatorScreenParams } from '@react-navigation/native';
import type { MockItem } from '../data/mockItems';

export type ChatScreenParams = {
  conversationId: string;
  itemTitre: string;
  itemImage: string;
  otherUserName: string;
  itemId?: string;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  Messages: undefined;
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
  RentalDetail: { rentalId: string; role: 'locataire' | 'proprietaire' };
  ItemDetail: { item: MockItem };
  Reservation: { item: MockItem };
  Chat: ChatScreenParams;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  MesFavoris: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Recherche: NavigatorScreenParams<SearchStackParamList>;
  AddItem: { itemId?: string } | undefined;
  Locations: NavigatorScreenParams<LocationsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
