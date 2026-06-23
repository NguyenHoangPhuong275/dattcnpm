import type {
  User as UserType,
  Trip as TripType,
  Place as PlaceType,
  Hotel as HotelType,
  HotelReview as HotelReviewType,
  Review as ReviewType,
  ItineraryItem as ItineraryItemType,
  FavoritePlace as FavoritePlaceType,
  SearchHistory as SearchHistoryType,
  TripShare as TripShareType,
  Notification as NotificationType,
  Tag as TagType,
  UserPreference as UserPreferenceType,
  TripBudget as TripBudgetType,
  TripAccommodation as TripAccommodationType,
  TripChecklist as TripChecklistType,
  UserFollow as UserFollowType,
  ReviewReport as ReviewReportType,
  AuditLog as AuditLogType,
} from './schema';

import {
  User as UserModel,
  Trip as TripModel,
  Place as PlaceModel,
  Hotel as HotelModel,
  HotelReview as HotelReviewModel,
  Review as ReviewModel,
  ItineraryItem as ItineraryItemModel,
  FavoritePlace as FavoritePlaceModel,
  SearchHistory as SearchHistoryModel,
  TripShare as TripShareModel,
  Notification as NotificationModel,
  Tag as TagModel,
  UserPreference as UserPreferenceModel,
  TripBudget as TripBudgetModel,
  TripAccommodation as TripAccommodationModel,
  TripChecklist as TripChecklistModel,
  UserFollow as UserFollowModel,
  ReviewReport as ReviewReportModel,
} from './models/index';

import { AuditLog as AuditLogModel } from './audit';

type User = UserType;
const User = UserModel;

type Trip = TripType;
const Trip = TripModel;

type Place = PlaceType;
const Place = PlaceModel;

type Hotel = HotelType;
const Hotel = HotelModel;

type HotelReview = HotelReviewType;
const HotelReview = HotelReviewModel;

type Review = ReviewType;
const Review = ReviewModel;

type ItineraryItem = ItineraryItemType;
const ItineraryItem = ItineraryItemModel;

type FavoritePlace = FavoritePlaceType;
const FavoritePlace = FavoritePlaceModel;

type SearchHistory = SearchHistoryType;
const SearchHistory = SearchHistoryModel;

type TripShare = TripShareType;
const TripShare = TripShareModel;

type Notification = NotificationType;
const Notification = NotificationModel;

type Tag = TagType;
const Tag = TagModel;

type UserPreference = UserPreferenceType;
const UserPreference = UserPreferenceModel;

type TripBudget = TripBudgetType;
const TripBudget = TripBudgetModel;

type TripAccommodation = TripAccommodationType;
const TripAccommodation = TripAccommodationModel;

type TripChecklist = TripChecklistType;
const TripChecklist = TripChecklistModel;

type UserFollow = UserFollowType;
const UserFollow = UserFollowModel;

type ReviewReport = ReviewReportType;
const ReviewReport = ReviewReportModel;

type AuditLog = AuditLogType;
const AuditLog = AuditLogModel;

export {
  User,
  Trip,
  Place,
  Hotel,
  HotelReview,
  Review,
  ItineraryItem,
  FavoritePlace,
  SearchHistory,
  TripShare,
  Notification,
  Tag,
  UserPreference,
  TripBudget,
  TripAccommodation,
  TripChecklist,
  UserFollow,
  ReviewReport,
  AuditLog,
};

export type {
  MongoId,
  TripCollaborator,
  WeatherAlertThresholds,
  PlaceTag,
  ItineraryTransport,
  CachedGeoResult,
  CachedPOI,
  CachedWeather,
  RateLimitEntry,
  SessionData,
  BlacklistEntry,
  MongoDocument,
} from './schema';

export { RedisKey } from './schema';

export * from './connection';
export * from './collections';
export * from './models/index';
export * from './audit';
export * from './maintenance';
export * from './users';
export * from './trips';
export * from './redis';
