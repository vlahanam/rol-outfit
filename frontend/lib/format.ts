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
