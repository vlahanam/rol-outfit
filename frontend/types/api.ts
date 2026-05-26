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
  slug: string;
  status: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  status?: number;
}

// Product
export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  default_price: number;
  description: string;
  status: number;
  attribute_names: string[];
  data?: unknown;
  avatar?: string;
  tags?: Tag[];
  discount_percent: number;
  discount_start_at: string | null;
  discount_end_at: string | null;
  sale_price: number;
  created_at: string;
  updated_at: string;
}

// ProductVariant
export interface ProductVariant {
  id: string;
  product_id: string;
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
  user_id: string;
  shipping_address: string;
  phone: string;
  total_price: number;
  status: number;
  note?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

// User
export interface User {
  id: string;
  full_name: string;
  email: string;
  address: string;
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
  address: string;
  phone: string;
  role?: number;
  status?: number;
}

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  address?: string;
  phone?: string;
  role?: number;
  status?: number;
}

// Product mutation payloads
export interface CreateProductPayload {
  category_id: string;
  name: string;
  default_price: number;
  description?: string;
  avatar: string;
  attribute_names: string[];
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}

export interface UpdateProductPayload {
  category_id?: string;
  name?: string;
  default_price?: number;
  description?: string;
  avatar?: string;
  status?: number;
  attribute_names?: string[];
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}

export interface CreateVariantPayload {
  attributes: Record<string, string>;
  price: number;
  stock: number;
  avatar?: string;
  discount_percent?: number;
  discount_start_at?: string | null;
  discount_end_at?: string | null;
}

export interface UpdateVariantPayload {
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
  slug: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTagPayload {
  name: string;
  start_at?: string | null;
  end_at?: string | null;
}

export interface UpdateTagPayload {
  name?: string;
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
  type: WidgetType;
  status: number;
}

export interface UpdateWidgetPayload {
  name?: string;
  display_order?: number;
  status?: number;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Error response from backend
export interface ApiErrorBody {
  error: string;
  reason?: string;
  details?: Record<string, string>;
}
