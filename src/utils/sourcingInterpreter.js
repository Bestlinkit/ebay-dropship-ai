/**
 * AliExpress DS API Case Interpreter (v1.2.5)
 */
export const interpretSupplierResponse = (result) => {
  const { status } = result;

  switch (status) {
    case 'SUCCESS':
      return 'ALIEXPRESS_SUCCESS';
    case 'EMPTY':
      return 'ALIEXPRESS_EMPTY';
    case 'BLOCKED':
      return 'ALIEXPRESS_BLOCKED';
    case 'API_ERROR':
    case 'NETWORK_ERROR':
    case 'ERROR':
      return 'ALIEXPRESS_ERROR';
    default:
      return 'ALIEXPRESS_ERROR';
  }
};
