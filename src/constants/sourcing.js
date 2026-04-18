/**
 * Standardized Sourcing States & Statuses (v21.2 API-STRICT)
 */
export const SourcingStatus = {
  SUCCESS: 'SUCCESS',
  EMPTY: 'EMPTY',
  EMPTY_CATALOG_RESULT: 'EMPTY_CATALOG_RESULT',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_FAILURE: 'AUTH_FAILURE'
};

export const SourcingUIState = {
  IDLE: 'IDLE',
  // CJ Dropshipping States
  CJ_SEARCHING: 'CJ_SEARCHING',
  CJ_SUCCESS: 'CJ_SUCCESS',
  CJ_EMPTY: 'CJ_EMPTY',
  CJ_ERROR: 'CJ_ERROR'
};
