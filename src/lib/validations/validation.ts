export {
  sendOtpSchema,
  verifyOtpSchema,
  loginSchema,
  changePasswordSchema,
  passwordChangeSchema,
} from './auth';
export type {
  SendOtpInput,
  VerifyOtpInput,
  LoginInput,
  PasswordChangeInput,
} from './auth';

export {
  objectIdSchema,
  paginationSchema,
  latLngSchema,
  optionalLatLngSchema,
  dateStringSchema,
  trimString,
  optionalTrimString,
} from './common';
export type { ObjectIdInput } from './common';

export { createFavoriteSchema } from './favorite';
export type { FavoriteInput } from './favorite';

export {
  placesSearchSchema,
  placesPoiSchema,
  weatherSchema,
} from './place';
export type {
  PlacesSearchInput,
  PlacesPoiInput,
  WeatherInput,
} from './place';

export { updateProfileSchema } from './profile';
export type { ProfileUpdateInput } from './profile';

export { searchHistoryCreateSchema } from './search';
export type { SearchHistoryCreateInput } from './search';

export {
  createTripSchema,
  updateTripSchema,
  createItineraryItemSchema,
  updateItineraryItemSchema,
  deleteItineraryItemSchema,
} from './trip';
export type {
  TripCreateInput,
  TripUpdateInput,
  ItineraryItemInput,
} from './trip';
