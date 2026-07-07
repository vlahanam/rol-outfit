// Generic API response shape from backend
export interface ApiResponse<T> {
  data: T;
  paging?: Paging;
  extra?: unknown;
}

export interface Paging {
  page: number;
  limit: number;
  total: number;
  cursor?: string;
  next_cursor?: string;
}

// Auth
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// JWT payload claims
export interface JwtClaims {
  sub: string;
  email: string;
  role: number;
  exp: number;
  iat: number;
}

// Category
export interface Category {
  id: string;
  name: string;
  name_ja?: string;
  slug: string;
  status: number;
  description: string;
  description_ja?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryPayload {
  name: string;
  name_ja?: string;
  description?: string;
  description_ja?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  name_ja?: string;
  description?: string;
  description_ja?: string;
  status?: number;
}

// Size guide entry format: [{size, height, weight}, ...]
export interface SizeGuideEntry {
  size: string;
  height: string;
  weight: string;
}

// Delivery info entry format: [{region, time}, ...]
export interface DeliveryInfoEntry {
  region: string;
  time: string;
}

// Product
export interface Product {
  id: string;
  category_id: string;
  name: string;
  name_ja?: string;
  slug: string;
  default_price: number;
  shipping_cost: number;
  description: string;
  description_ja?: string;
  status: number;
  product_type: number;
  attribute_names: string[];
  data?: unknown;
  avatar?: string;
  tags?: Tag[];
  discount_percent: number;
  discount_start_at: string | null;
  discount_end_at: string | null;
  sale_price: number;
  size_guide?: SizeGuideEntry[] | null;
  delivery_info?: DeliveryInfoEntry[] | null;
  created_at: string;
  updated_at: string;
}

// ProductVariant
export interface ProductVariant {
  id: string;
  product_id: string;
  name?: string;
  name_ja?: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  sold: number;
  avatar?: string;
  status: number;
  discount_percent: number;
  discount_start_at: string | null;
  discount_end_at: string | null;
  sale_price: number;
  created_at: string;
  updated_at: string;
}

// Admin product (product + aggregated stats + variants + tags)
export interface AdminProduct extends Product {
  total_stock: number;
  total_sold: number;
  variant_count: number;
  variants: ProductVariant[];
  tags: Tag[];
  size_guide_ja?: SizeGuideEntry[] | null;
  delivery_info_ja?: DeliveryInfoEntry[] | null;
}

// Cart
export interface CartItem {
  id: string;
  product_id: string;
  attr_id?: string;
  price_at_add: number;
  quantity: number;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
}

// Admin Cart
export interface AdminCartListItem {
  id: string;
  user_id: string;
  user_full_name: string;
  user_email: string;
  item_count: number;
  total: number;
  updated_at: string;
}

export interface AdminCartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  attr_id?: string;
  attr_name?: string;
  price_at_add: number;
  quantity: number;
  subtotal: number;
}

export interface AdminCartDetail {
  id: string;
  user_id: string;
  user_full_name: string;
  user_email: string;
  items: AdminCartItem[];
  total: number;
  created_at: string;
  updated_at: string;
}

// Order
export interface OrderItem {
  id: string;
  product_id: string;
  attr_id?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_code?: string;
  user_id: string;
  shipping_address: string;
  phone: string;
  total_price: number;
  shipping_cost: number;
  currency_type?: number;
  status: number;
  note?: string;
  items?: OrderItem[];
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at: string;
}

// User
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: number; // 1=admin, 2=customer
  status: number; // 1=active, 0=locked
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role?: number;
  status?: number;
}

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: number;
  status?: number;
}

// Product mutation payloads
export interface CreateProductPayload {
  category_id: string;
  name: string;
  name_ja?: string;
  default_price: number;
  shipping_cost: number;
  description?: string;
  description_ja?: string;
  avatar: string;
  attribute_names: string[];
  product_type?: number;
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}

export interface UpdateProductPayload {
  category_id?: string;
  name?: string;
  name_ja?: string;
  default_price?: number;
  shipping_cost?: number;
  description?: string;
  description_ja?: string;
  avatar?: string;
  status?: number;
  product_type?: number;
  attribute_names?: string[];
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
  size_guide?: SizeGuideEntry[];
  size_guide_ja?: SizeGuideEntry[];
  delivery_info?: DeliveryInfoEntry[];
  delivery_info_ja?: DeliveryInfoEntry[];
}

export interface CreateVariantPayload {
  name?: string;
  name_ja?: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  avatar?: string;
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}

export interface UpdateVariantPayload {
  name?: string;
  name_ja?: string;
  attributes?: Record<string, string>;
  price?: number;
  stock?: number;
  avatar?: string;
  status?: number;
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}

// Tag
export interface Tag {
  id: string;
  name: string;
  name_ja?: string;
  slug: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTagPayload {
  name: string;
  name_ja?: string;
  start_at?: string | null;
  end_at?: string | null;
}

export interface UpdateTagPayload {
  name?: string;
  name_ja?: string;
  start_at?: string | null;
  end_at?: string | null;
}

// Widget
export type WidgetType = "banner-slider" | "collection-grid" | "new-product" | "trend-hot";

export interface BannerSlide {
  id: string;
  image: string;
  label: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
  text_x?: number;
  text_y?: number;
  font_scale?: number;
}

export interface BannerSliderMetadata {
  slides: BannerSlide[];
}

export interface BannerSliderSettings {
  autoPlayInterval?: number; // milliseconds, default 5000
}

export interface CollectionItem {
  id: string;
  title: string;
  image: string;
  link: string;
  cta_text: string;
}

export interface CollectionGridMetadata {
  items: CollectionItem[];
}

export interface CollectionGridSettings {
  cardHeight?: number; // pixels, default 400
}

// Trend Hot Widget (reuses CollectionItem for items)
export type TrendHotMetadata = CollectionGridMetadata; // { items: CollectionItem[] }

export interface TrendHotSettings {
  cardHeight?: number; // pixels, default 400
  showBadge?: boolean; // show "HOT" badge on cards
}

// New Product Widget (Hàng Mới Về)
export interface NewProductMetadata {
  tag_ids: string[];
}

export interface NewProductSettings {
  quantity: number; // 5-20, default 10
  columns: number; // 2-5, default 5
}

export interface Widget {
  id: string;
  parent_id: string | null;
  name: string;
  name_ja?: string;
  type: WidgetType;
  display_order: number;
  depth: number;
  status: number; // 1=HIDDEN, 2=ACTIVE
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWidgetPayload {
  name: string;
  name_ja?: string;
  type: WidgetType;
  status: number;
}

export interface UpdateWidgetPayload {
  name?: string;
  name_ja?: string;
  display_order?: number;
  status?: number;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// User Address
export interface UserAddress {
  id: string;
  recipient_name: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressPayload {
  recipient_name: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateAddressPayload {
  recipient_name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// Error response from backend
export interface ApiErrorBody {
  error: string;
  reason?: string;
  details?: Record<string, string>;
}

// Dashboard
export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  total_products: number;
  recent_orders: RecentOrder[];
  top_products: TopProduct[];
  orders_by_status: OrderStatusCount[];
}

export interface RecentOrder {
  id: string;
  order_code: string;
  customer: string;
  total_price: number;
  status: number;
  created_at: string;
}

export interface TopProduct {
  id: string;
  name: string;
  avatar: string;
  sold: number;
  revenue: number;
}

export interface OrderStatusCount {
  status: number;
  count: number;
}
