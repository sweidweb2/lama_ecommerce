export type JSON =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSON | undefined }
  | JSON[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          brand_id: string | null
          category_id: string | null
          sku: string | null
          price: number
          min_effective_price: number
          max_effective_price: number
          is_featured: boolean
          is_trending: boolean
          is_active: boolean
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          brand_id?: string | null
          category_id?: string | null
          sku?: string | null
          price: number
          min_effective_price?: number
          max_effective_price?: number
          is_featured?: boolean
          is_trending?: boolean
          is_active?: boolean
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slug?: string
          brand_id?: string | null
          category_id?: string | null
          sku?: string | null
          price?: number
          min_effective_price?: number
          max_effective_price?: number
          is_featured?: boolean
          is_trending?: boolean
          is_active?: boolean
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string | null
          logo_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          logo_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          logo_image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          id: string
          name: string
          type: "full" | "incremental"
          size: string | null
          storage_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: "full" | "incremental"
          size?: string | null
          storage_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: "full" | "incremental"
          size?: string | null
          storage_path?: string | null
          created_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url_image: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url_image: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url_image?: string
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          color: string | null
          size: string | null
          material: string | null
          quantity_stock: number
          sku_variant: string | null
          price_override: number | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          color?: string | null
          size?: string | null
          material?: string | null
          quantity_stock?: number
          sku_variant?: string | null
          price_override?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          color?: string | null
          size?: string | null
          material?: string | null
          quantity_stock?: number
          sku_variant?: string | null
          price_override?: number | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          role: 'user' | 'admin'
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          customised_product_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          customised_product_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          customised_product_id?: string
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_customised_product_id_fkey"
            columns: ["customised_product_id"]
            isOneToOne: false
            referencedRelation: "customised_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          status: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
          subtotal: number | null
          shipping_fee: number | null
          discount: number | null
          total: number | null
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          promo_code_id: string | null
          address_snapshot: JSON | null
          phone: string | null
          email: string | null
          shipping_zone_id: string | null
          shipping_zone_name: string | null
          stock_restored: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          status: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
          subtotal?: number | null
          shipping_fee?: number | null
          discount?: number | null
          total?: number | null
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          promo_code_id?: string | null
          address_snapshot?: JSON | null
          phone?: string | null
          email?: string | null
          shipping_zone_id?: string | null
          shipping_zone_name?: string | null
          stock_restored?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          status?: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
          subtotal?: number | null
          shipping_fee?: number | null
          discount?: number | null
          total?: number | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          promo_code_id?: string | null
          address_snapshot?: JSON | null
          phone?: string | null
          email?: string | null
          shipping_zone_id?: string | null
          shipping_zone_name?: string | null
          stock_restored?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_zone_id_fkey"
            columns: ["shipping_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          customised_product_id: string | null
          quantity: number
          price_snapshot: number | null
          product_name_snapshot: string | null
          size_snapshot: string | null
          material_snapshot: string | null
          color_snapshot: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          customised_product_id?: string | null
          quantity: number
          price_snapshot?: number | null
          product_name_snapshot?: string | null
          size_snapshot?: string | null
          material_snapshot?: string | null
          color_snapshot?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          customised_product_id?: string | null
          quantity?: number
          price_snapshot?: number | null
          product_name_snapshot?: string | null
          size_snapshot?: string | null
          material_snapshot?: string | null
          color_snapshot?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_customised_product_id_fkey"
            columns: ["customised_product_id"]
            isOneToOne: false
            referencedRelation: "customised_products"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number | null
          expires_at: string | null
          max_uses: number | null
          use_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value?: number | null
          expires_at?: string | null
          max_uses?: number | null
          use_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number | null
          expires_at?: string | null
          max_uses?: number | null
          use_count?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          transaction_id: string | null
          paid_at: string | null
          amount: number | null
          currency: string | null
          gateway: string | null
          payment_method: string | null
          payment_url: string | null
          callback_payload: JSON | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          transaction_id?: string | null
          paid_at?: string | null
          amount?: number | null
          currency?: string | null
          gateway?: string | null
          payment_method?: string | null
          payment_url?: string | null
          callback_payload?: JSON | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          transaction_id?: string | null
          paid_at?: string | null
          amount?: number | null
          currency?: string | null
          gateway?: string | null
          payment_method?: string | null
          payment_url?: string | null
          callback_payload?: JSON | null
          created_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          id: string
          order_id: string
          carrier_name: string | null
          tracking_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          carrier_name?: string | null
          tracking_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          carrier_name?: string | null
          tracking_number?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          rating: number
          title: string | null
          comment: string | null
          review_status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          rating: number
          title?: string | null
          comment?: string | null
          review_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          rating?: number
          title?: string | null
          comment?: string | null
          review_status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          customised_product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          customised_product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          customised_product_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_customised_product_id_fkey"
            columns: ["customised_product_id"]
            isOneToOne: false
            referencedRelation: "customised_products"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_us: {
        Row: {
          id: string
          subject: string | null
          message: string | null
          full_name: string | null
          phone: string | null
          email: string | null
          status: 'new' | 'read' | 'replied' | 'resolved'
          created_at: string
        }
        Insert: {
          id?: string
          subject?: string | null
          message?: string | null
          full_name?: string | null
          phone?: string | null
          email?: string | null
          status?: 'new' | 'read' | 'replied' | 'resolved'
          created_at?: string
        }
        Update: {
          id?: string
          subject?: string | null
          message?: string | null
          full_name?: string | null
          phone?: string | null
          email?: string | null
          status?: 'new' | 'read' | 'replied' | 'resolved'
          created_at?: string
        }
        Relationships: []
      }
      customised_products: {
        Row: {
          id: string
          product_id: string
          color: string | null
          size: string | null
          material: string | null
          quantity_stock: number
          sku_variant: string | null
          price_override: number | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          color?: string | null
          size?: string | null
          material?: string | null
          quantity_stock?: number
          sku_variant?: string | null
          price_override?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          color?: string | null
          size?: string | null
          material?: string | null
          quantity_stock?: number
          sku_variant?: string | null
          price_override?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customised_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          id: string
          email: string
          user_id: string | null
          status: string
          source: string
          unsubscribed_at: string | null
          unsubscribe_token: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          user_id?: string | null
          status?: string
          source?: string
          unsubscribed_at?: string | null
          unsubscribe_token?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          user_id?: string | null
          status?: string
          source?: string
          unsubscribed_at?: string | null
          unsubscribe_token?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          question: string
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          question: string
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          question?: string
          is_approved?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_answers: {
        Row: {
          id: string
          product_question_id: string
          admin_id: string | null
          answer: string
          created_at: string
        }
        Insert: {
          id?: string
          product_question_id: string
          admin_id?: string | null
          answer: string
          created_at?: string
        }
        Update: {
          id?: string
          product_question_id?: string
          admin_id?: string | null
          answer?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_answers_product_question_id_fkey"
            columns: ["product_question_id"]
            isOneToOne: false
            referencedRelation: "product_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          session_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          session_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          session_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      product_stats: {
        Row: {
          product_id: string
          views_count: number
          add_to_cart_count: number
          purchase_count: number
        }
        Insert: {
          product_id: string
          views_count?: number
          add_to_cart_count?: number
          purchase_count?: number
        }
        Update: {
          product_id?: string
          views_count?: number
          add_to_cart_count?: number
          purchase_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_stats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_form_rate_limit: {
        Args: {
          p_key: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      upsert_cart_item: {
        Args: {
          p_cart_id: string
          p_customised_product_id: string
          p_quantity: number
        }
        Returns: {
          id: string
          cart_id: string
          customised_product_id: string
          quantity: number
          created_at: string
        }[]
      }
      process_checkout: {
        Args: {
          p_cart_id: string
          p_shipping_zone_id: string
          p_user_id?: string | null
          p_session_id?: string | null
          p_phone?: string | null
          p_email?: string | null
          p_address_snapshot?: JSON
          p_promo_code?: string | null
        }
        Returns: string
      }
      get_admin_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          full_name: string | null
          role: 'user' | 'admin'
          created_at: string
          is_active: boolean
          email: string | null
        }[]
      }
      admin_orders_revenue_sum: {
        Args: {
          p_from?: string | null
          p_to_exclusive?: string | null
        }
        Returns: number
      }

      increment_product_stat: {
        Args: {
          p_product_id: string
          p_column: string
          p_delta?: number
        }
        Returns: undefined
      }
      get_category_product_counts: {
        Args: {
          p_category_ids?: string[] | null
          p_active_only?: boolean
        }
        Returns: {
          category_id: string
          product_count: number
        }[]
      }
      get_home_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          slug: string
          product_count: number
          image_url: string | null
        }[]
      }
      admin_order_status_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: Database["public"]["Enums"]["order_status"]
          count: number
        }[]
      }
      admin_payment_status_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: Database["public"]["Enums"]["payment_status"]
          count: number
        }[]
      }
      admin_orders_by_month: {
        Args: {
          p_from: string
          p_to_exclusive: string
        }
        Returns: {
          month: string
          orders: number
          sales: number
        }[]
      }
      admin_users_by_month: {
        Args: {
          p_from: string
          p_to_exclusive: string
        }
        Returns: {
          month: string
          users: number
        }[]
      }
      admin_top_products_by_revenue: {
        Args: {
          p_limit?: number
          p_from?: string | null
          p_to_exclusive?: string | null
        }
        Returns: {
          product_id: string
          product_name: string
          revenue: number
          order_count: number
        }[]
      }
      upsert_payment_for_order: {
        Args: {
          p_order_id: string
          p_status: Database["public"]["Enums"]["payment_status"]
          p_amount?: number | null
          p_currency?: string | null
          p_transaction_id?: string | null
          p_paid_at?: string | null
          p_gateway?: string | null
          p_payment_method?: string | null
          p_payment_url?: string | null
        }
        Returns: Database["public"]["Tables"]["payments"]["Row"]
      }
      admin_update_order: {
        Args: {
          p_order_id: string
          p_patch?: JSON
          p_carrier_name?: string | null
          p_tracking_number?: string | null
        }
        Returns: Database["public"]["Tables"]["orders"]["Row"]
      }
      merge_guest_cart_to_user: {
        Args: {
          p_user_id: string
          p_session_id: string
        }
        Returns: JSON
      }
      claim_wishlist_by_session: {
        Args: {
          p_session_id: string
          p_user_id: string
        }
        Returns: number
      }
      set_primary_product_image: {
        Args: {
          p_product_id: string
          p_image_id: string
        }
        Returns: undefined
      }
      create_shipping_zone_with_fee: {
        Args: {
          p_name: string
          p_estimated_time?: string | null
          p_fee?: number | null
        }
        Returns: {
          id: string
          name: string
          estimated_time: string | null
          created_at: string
          fee: number | null
        }[]
      }
      update_shipping_zone_with_fee: {
        Args: {
          p_id: string
          p_name: string
          p_estimated_time?: string | null
          p_fee?: number | null
        }
        Returns: {
          id: string
          name: string
          estimated_time: string | null
          created_at: string
          fee: number | null
        }[]
      }
    }
    Enums: {
      profile_role: 'user' | 'admin'
      order_status:
        | 'pending'
        | 'processing'
        | 'packed'
        | 'shipped'
        | 'delivered'
        | 'returned'
        | 'cancelled'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      review_status: 'pending' | 'approved' | 'rejected'
      contact_status: 'new' | 'read' | 'replied' | 'resolved'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
