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
  created_at: string;
  updated_at: string;
}

// Admin product (product + aggregated stats + variants)
export interface AdminProduct extends Product {
  total_stock: number;
  total_sold: number;
  variant_count: number;
  variants: ProductVariant[];
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
  avatar?: string;
  attribute_names: string[];
}

export interface UpdateProductPayload {
  category_id?: string;
  name?: string;
  default_price?: number;
  description?: string;
  avatar?: string;
  status?: number;
  attribute_names?: string[];
}

export interface CreateVariantPayload {
  attributes: Record<string, string>;
  price: number;
  stock: number;
  avatar?: string;
}

export interface UpdateVariantPayload {
  attributes?: Record<string, string>;
  price?: number;
  stock?: number;
  avatar?: string;
  status?: number;
}

// Error response from backend
export interface ApiErrorBody {
  error: string;
  reason?: string;
  details?: Record<string, string>;
}
