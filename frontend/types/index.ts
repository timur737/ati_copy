// ─── Enums ────────────────────────────────────────
export type UserRole = 'shipper' | 'carrier' | 'dispatcher';
export type CargoStatus = 'open' | 'assigned' | 'completed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

// ─── User ─────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  role: UserRole;
  company_name?: string;
  phone?: string;
  rating: number;
  is_active: boolean;
  created_at: string;
}

// ─── Auth ─────────────────────────────────────────
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  company_name?: string;
  phone?: string;
}

// ─── Cargo ────────────────────────────────────────
export interface Cargo {
  id: number;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  weight: number;
  volume?: number;
  price?: number;
  currency: string;
  loading_date: string;
  status: CargoStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CargoCreate {
  title: string;
  description?: string;
  origin: string;
  destination: string;
  weight: number;
  volume?: number;
  price?: number;
  currency?: string;
  loading_date: string;
}

export interface CargoFilters {
  origin?: string;
  destination?: string;
  loading_date_from?: string;
  loading_date_to?: string;
  price_min?: number;
  price_max?: number;
  weight_min?: number;
  weight_max?: number;
}

export interface PaginatedCargo {
  items: Cargo[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ─── Bid ──────────────────────────────────────────
export interface Bid {
  id: number;
  cargo_id: number;
  carrier_id: number;
  price: number;
  message?: string;
  status: BidStatus;
  created_at: string;
  updated_at: string;
}

export interface BidCreate {
  cargo_id: number;
  price: number;
  message?: string;
}

// ─── Message ──────────────────────────────────────
export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  is_read: number;
  created_at: string;
}

// ─── Review ───────────────────────────────────────
export interface Review {
  id: number;
  reviewer_id: number;
  reviewee_id: number;
  cargo_id?: number;
  rating: number;
  comment?: string;
  created_at: string;
}

// ─── Company ──────────────────────────────────────
export interface Company {
  id: number;
  name: string;
  country?: string;
  verification_status: VerificationStatus;
  owner_id: number;
  created_at: string;
}

// ─── Driver ───────────────────────────────────────
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Driver {
  id: number;
  user_id: number;
  full_name: string;
  license_number: string;
  passport_front_url: string;
  passport_back_url: string;
  moderation_status: ModerationStatus;
  rejection_reason?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverCreate {
  full_name: string;
  license_number: string;
  passport_front_url: string;
  passport_back_url: string;
}
