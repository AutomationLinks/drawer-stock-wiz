export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          billing_address: string | null
          created_at: string
          customer_id: string
          customer_name: string
          email: string | null
          id: string
          phone: string | null
          shipping_address: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          email?: string | null
          id?: string
          phone?: string | null
          shipping_address?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          email?: string | null
          id?: string
          phone?: string | null
          shipping_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          campaign: string
          created_at: string
          email: string
          frequency: string
          id: string
          name: string
          organization: string | null
          phone: string
          processing_fee: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          campaign: string
          created_at?: string
          email: string
          frequency: string
          id?: string
          name: string
          organization?: string | null
          phone: string
          processing_fee?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign?: string
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          name?: string
          organization?: string | null
          phone?: string
          processing_fee?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string | null
          id: string
          item_name: string
          item_type: string | null
          opening_stock: number | null
          status: string | null
          stock_on_hand: number
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          item_name: string
          item_type?: string | null
          opening_stock?: number | null
          status?: string | null
          stock_on_hand?: number
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          item_name?: string
          item_type?: string | null
          opening_stock?: number | null
          status?: string | null
          stock_on_hand?: number
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          category: string
          created_at: string | null
          id: string
          inventory_id: string
          item_name: string
          quantity_change: number
          stock_after: number
          transaction_type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          inventory_id: string
          item_name: string
          quantity_change: number
          stock_after: number
          transaction_type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          inventory_id?: string
          item_name?: string
          quantity_change?: number
          stock_after?: number
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_url: string
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_url: string
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_url?: string
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          account: string | null
          created_at: string
          discount: number
          discount_amount: number
          id: string
          inventory_id: string | null
          item_description: string | null
          item_name: string
          item_price: number
          item_total: number
          product_id: string | null
          quantity_cancelled: number
          quantity_fulfilled: number
          quantity_invoiced: number
          quantity_ordered: number
          quantity_packed: number
          sales_order_id: string
          sku: string | null
          updated_at: string
          usage_unit: string
        }
        Insert: {
          account?: string | null
          created_at?: string
          discount?: number
          discount_amount?: number
          id?: string
          inventory_id?: string | null
          item_description?: string | null
          item_name: string
          item_price?: number
          item_total?: number
          product_id?: string | null
          quantity_cancelled?: number
          quantity_fulfilled?: number
          quantity_invoiced?: number
          quantity_ordered?: number
          quantity_packed?: number
          sales_order_id: string
          sku?: string | null
          updated_at?: string
          usage_unit?: string
        }
        Update: {
          account?: string | null
          created_at?: string
          discount?: number
          discount_amount?: number
          id?: string
          inventory_id?: string | null
          item_description?: string | null
          item_name?: string
          item_price?: number
          item_total?: number
          product_id?: string | null
          quantity_cancelled?: number
          quantity_fulfilled?: number
          quantity_invoiced?: number
          quantity_ordered?: number
          quantity_packed?: number
          sales_order_id?: string
          sku?: string | null
          updated_at?: string
          usage_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          adjustment: number
          adjustment_description: string | null
          created_at: string
          currency_code: string
          customer_id: string
          discount_type: string
          entity_discount_amount: number
          entity_discount_percent: number
          exchange_rate: number
          expected_shipment_date: string | null
          id: string
          invoice_status: string
          is_discount_before_tax: boolean
          notes: string | null
          order_date: string
          order_status: string
          payment_status: string
          payment_terms: string | null
          payment_terms_label: string | null
          sales_channel: string | null
          sales_order_number: string
          shipment_status: string
          shipping_charge: number
          source: string | null
          subtotal: number
          template_name: string | null
          total: number
          updated_at: string
        }
        Insert: {
          adjustment?: number
          adjustment_description?: string | null
          created_at?: string
          currency_code?: string
          customer_id: string
          discount_type?: string
          entity_discount_amount?: number
          entity_discount_percent?: number
          exchange_rate?: number
          expected_shipment_date?: string | null
          id?: string
          invoice_status?: string
          is_discount_before_tax?: boolean
          notes?: string | null
          order_date: string
          order_status?: string
          payment_status?: string
          payment_terms?: string | null
          payment_terms_label?: string | null
          sales_channel?: string | null
          sales_order_number: string
          shipment_status?: string
          shipping_charge?: number
          source?: string | null
          subtotal?: number
          template_name?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          adjustment?: number
          adjustment_description?: string | null
          created_at?: string
          currency_code?: string
          customer_id?: string
          discount_type?: string
          entity_discount_amount?: number
          entity_discount_percent?: number
          exchange_rate?: number
          expected_shipment_date?: string | null
          id?: string
          invoice_status?: string
          is_discount_before_tax?: boolean
          notes?: string | null
          order_date?: string
          order_status?: string
          payment_status?: string
          payment_terms?: string | null
          payment_terms_label?: string | null
          sales_channel?: string | null
          sales_order_number?: string
          shipment_status?: string
          shipping_charge?: number
          source?: string | null
          subtotal?: number
          template_name?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_events: {
        Row: {
          capacity: number
          created_at: string
          event_date: string
          id: string
          location: string
          location_address: string
          slots_filled: number
          time_slot: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          event_date: string
          id?: string
          location: string
          location_address: string
          slots_filled?: number
          time_slot: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          event_date?: string
          id?: string
          location?: string
          location_address?: string
          slots_filled?: number
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_signups: {
        Row: {
          comment: string | null
          created_at: string
          email: string
          event_id: string
          first_name: string
          id: string
          last_name: string
          quantity: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          email: string
          event_id: string
          first_name: string
          id?: string
          last_name: string
          quantity?: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          email?: string
          event_id?: string
          first_name?: string
          id?: string
          last_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "volunteer_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
