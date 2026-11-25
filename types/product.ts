// Product & catalog domain types derived from the database schema.
// These are lightweight interfaces meant for use in the app layer
// (server actions, React components, API clients, etc.).

export type UUID = string;

// ---------- Enums ----------

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

// ---------- Core catalog tables ----------

export interface Brand {
  id: UUID;
  name: string;
  slug: string | null;
  logo_image_url: string | null;
  created_at: string; // timestamptz ISO string
}

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  parent_id: UUID | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: UUID;
  name: string;
  description: string | null;
  slug: string;
  brand_id: UUID | null;
  category_id: UUID | null;
  sku: string | null;
  price: number; // numeric(10,2)
  /** Min COALESCE(variant price_override, base) — used for list/filter/sort */
  min_effective_price: number;
  /** Max COALESCE(variant price_override, base) — used for list filter overlap */
  max_effective_price: number;
  is_featured: boolean;
  is_trending: boolean;
  is_active: boolean;
  owner_id: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: UUID;
  product_id: UUID;
  url_image: string;
  is_primary: boolean;
  /** Optional link to a variant; image still belongs to the product gallery. */
  customised_product_id: UUID | null;
  created_at: string;
}

// Customised product = variant (size/color/material/stock)
export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  color: string | null;
  size: string | null;
  material: string | null;
  quantity_stock: number;
  sku_variant: string | null;
  price_override: number | null;
  created_at: string;
}

export interface WishlistItem {
  id: UUID;
  user_id: UUID | null;
  customised_product_id: UUID;
  created_at: string;
}

export interface Review {
  id: UUID;
  product_id: UUID;
  user_id: UUID | null;
  rating: number; // 1–5
  title: string | null;
  comment: string | null;
  review_status: ReviewStatus;
  created_at: string;
}

export interface ProductQuestion {
  id: UUID;
  product_id: UUID;
  user_id: UUID | null;
  question: string;
  is_approved: boolean;
  created_at: string;
}

export interface ProductAnswer {
  id: UUID;
  product_question_id: UUID;
  admin_id: UUID | null;
  answer: string;
  created_at: string;
}

// ---------- Analytics ----------

export interface ProductView {
  id: UUID;
  product_id: UUID;
  user_id: UUID | null;
  session_id: string | null;
  viewed_at: string;
}

export interface ProductStats {
  product_id: UUID;
  views_count: number;
  add_to_cart_count: number;
  purchase_count: number;
}

// ---------- Helpful composite types ----------

export interface ProductWithRelations extends Product {
  brand?: Brand | null;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  stats?: ProductStats | null;
  /** True when no variant has quantity_stock > 0 (including no variants). */
  is_out_of_stock?: boolean;
}

