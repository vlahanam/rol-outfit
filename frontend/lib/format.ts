// Product type constants
export const PRODUCT_TYPE_JAPANESE = 1;
export const PRODUCT_TYPE_VIETNAMESE = 2;

// Format price based on product type
export function formatPrice(price: number, productType?: number): string {
  if (productType === PRODUCT_TYPE_JAPANESE) {
    return `¥${price.toLocaleString("ja-JP")}`;
  }
  return `${price.toLocaleString("vi-VN")}₫`;
}

// Get currency symbol based on product type
export function getCurrencySymbol(productType?: number): string {
  return productType === PRODUCT_TYPE_JAPANESE ? "¥" : "₫";
}

// Get currency label based on product type
export function getCurrencyLabel(productType?: number): string {
  return productType === PRODUCT_TYPE_JAPANESE ? "¥" : "₫";
}

// Determine cart currency type from items
// Returns PRODUCT_TYPE_JAPANESE if all items are Japanese, otherwise PRODUCT_TYPE_VIETNAMESE
export function getCartCurrencyType(items: { productType: number }[]): number {
  if (items.length === 0) return PRODUCT_TYPE_VIETNAMESE;
  const allJapanese = items.every(item => item.productType === PRODUCT_TYPE_JAPANESE);
  return allJapanese ? PRODUCT_TYPE_JAPANESE : PRODUCT_TYPE_VIETNAMESE;
}

// Free shipping thresholds
export const FREE_SHIPPING_THRESHOLD_JAPANESE = 15000;
export const FREE_SHIPPING_THRESHOLD_VIETNAMESE = 500000;

// Get the effective shipping cost after applying free shipping threshold
export function getEffectiveShipping(
  subtotal: number,
  rawShipping: number,
  currencyType: number
): number {
  if (currencyType === PRODUCT_TYPE_JAPANESE) {
    return subtotal >= FREE_SHIPPING_THRESHOLD_JAPANESE ? 0 : rawShipping;
  }
  return subtotal >= FREE_SHIPPING_THRESHOLD_VIETNAMESE ? 0 : rawShipping;
}

// Get the free shipping threshold for a given currency type
export function getFreeShippingThreshold(currencyType: number): number {
  return currencyType === PRODUCT_TYPE_JAPANESE
    ? FREE_SHIPPING_THRESHOLD_JAPANESE
    : FREE_SHIPPING_THRESHOLD_VIETNAMESE;
}
