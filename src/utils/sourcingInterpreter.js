import { SourcingStatus, SourcingUIState } from '../constants/sourcing';

/**
 * Truth-Based Sourcing Interpreter (v2.0)
 * The sole authority for mapping supplier responses to UI states.
 * 
 * CORE RULE: NEVER downgrade errors or blocking signals to "Empty".
 */
export const interpretSupplierResponse = (result, platform) => {
  const { status } = result;

  if (platform === 'eprolo') {
    switch (status) {
      case SourcingStatus.SUCCESS:
        return SourcingUIState.EPROLO_SUCCESS;
      case SourcingStatus.EMPTY:
        return SourcingUIState.EPROLO_EMPTY;
      case SourcingStatus.API_ERROR:
      case SourcingStatus.NETWORK_ERROR:
      case SourcingStatus.PARSE_ERROR:
        return SourcingUIState.EPROLO_ERROR;
      default:
        return SourcingUIState.EPROLO_ERROR;
    }
  }

  if (platform === 'aliexpress') {
    switch (status) {
      case SourcingStatus.SUCCESS:
        return SourcingUIState.ALIEXPRESS_SUCCESS;
      case SourcingStatus.EMPTY:
        return SourcingUIState.ALIEXPRESS_EMPTY;
      case SourcingStatus.BLOCKED:
        return SourcingUIState.ALIEXPRESS_BLOCKED;
      case SourcingStatus.PARSE_ERROR:
      case SourcingStatus.API_ERROR:
      case SourcingStatus.NETWORK_ERROR:
        return SourcingUIState.ALIEXPRESS_ERROR;
      default:
        return SourcingUIState.ALIEXPRESS_ERROR;
    }
  }

  return SourcingUIState.IDLE;
};
