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
  data?: unknown;
  avatar?: string;
  created_at: string;
  updated_at: string;
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

// Error response from backend
export interface ApiErrorBody {
  error: string;
  reason?: string;
  details?: Record<string, string>;
}
