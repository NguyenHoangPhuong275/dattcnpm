



export {
  authCookieName,
  getAuthUserId,
  signAuthToken,
  verifyAuthToken,
} from './auth';

export {
  getApiErrorMessage,
  apiRequest,
  readJson,
  type ApiErrorPayload,
  type ApiRequestOptions,
} from './api-client';

export {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
  updateStoredUser,
} from './user';

export {
  formatDateRange,
  formatMoney,
  formatTripDayDate,
  getDuration,
  getTripCities,
  getTripImage,
  normalizeText,
  type TripDisplayInfo,
  type TripDuration,
} from './trip-utils';
