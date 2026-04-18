/**
 * CJ Dropshipping Case Interpreter (v2.0.0)
 */
export const interpretSupplierResponse = (result) => {
  const { status } = result;

  switch (status) {
    case 'SUCCESS':
      return 'CJ_SUCCESS';
    case 'EMPTY':
      return 'CJ_EMPTY';
    case 'API_ERROR':
    case 'NETWORK_ERROR':
    case 'ERROR':
      return 'CJ_ERROR';
    default:
      return 'CJ_ERROR';
  }
};
