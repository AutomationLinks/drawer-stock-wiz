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
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_amount: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          current_uses?: number | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_amount?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_amount?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          billing_address: string | null
          city: string | null
          country: string | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_sub_type: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          shipping_address: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          billing_address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          customer_sub_type?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          shipping_address?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          billing_address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_sub_type?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          shipping_address?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          address: string | null
          address_line_1: string | null
          address_line_2: string | null
          alternate_email: string | null
          alternate_phone: string | null
          amount: number
          campaign: string
          city: string | null
          comments: string | null
          country: string | null
          coupon_code: string | null
          created_at: string
          email: string
          first_name: string | null
          first_transaction_date: string | null
          fiscal_ytd_gift_total: number | null
          formal_name: string | null
          frequency: string
          id: string
          is_organization: boolean | null
          is_test_mode: boolean | null
          join_date: string | null
          largest_gift_amount: number | null
          largest_gift_date: string | null
          last_fiscal_year_gift_total: number | null
          last_gift_amount: number | null
          last_gift_date: string | null
          last_name: string | null
          last_year_gift_total: number | null
          lifetime_contribution_total: number | null
          lifetime_gift_total: number | null
          lifetime_non_cash_gift_total: number | null
          lifetime_soft_credit_total: number | null
          mobile_phone: string | null
          name: string
          number_of_gifts: number | null
          organization: string | null
          phone: string
          postal_code: string | null
          preferred_name: string | null
          processing_fee: number | null
          spouse_name: string | null
          state: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          total_amount: number
          total_pledge_balance: number | null
          updated_at: string
          work_phone: string | null
          ytd_gift_total: number | null
        }
        Insert: {
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          alternate_email?: string | null
          alternate_phone?: string | null
          amount: number
          campaign: string
          city?: string | null
          comments?: string | null
          country?: string | null
          coupon_code?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          first_transaction_date?: string | null
          fiscal_ytd_gift_total?: number | null
          formal_name?: string | null
          frequency: string
          id?: string
          is_organization?: boolean | null
          is_test_mode?: boolean | null
          join_date?: string | null
          largest_gift_amount?: number | null
          largest_gift_date?: string | null
          last_fiscal_year_gift_total?: number | null
          last_gift_amount?: number | null
          last_gift_date?: string | null
          last_name?: string | null
          last_year_gift_total?: number | null
          lifetime_contribution_total?: number | null
          lifetime_gift_total?: number | null
          lifetime_non_cash_gift_total?: number | null
          lifetime_soft_credit_total?: number | null
          mobile_phone?: string | null
          name: string
          number_of_gifts?: number | null
          organization?: string | null
          phone: string
          postal_code?: string | null
          preferred_name?: string | null
          processing_fee?: number | null
          spouse_name?: string | null
          state?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          total_amount: number
          total_pledge_balance?: number | null
          updated_at?: string
          work_phone?: string | null
          ytd_gift_total?: number | null
        }
        Update: {
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          alternate_email?: string | null
          alternate_phone?: string | null
          amount?: number
          campaign?: string
          city?: string | null
          comments?: string | null
          country?: string | null
          coupon_code?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          first_transaction_date?: string | null
          fiscal_ytd_gift_total?: number | null
          formal_name?: string | null
          frequency?: string
          id?: string
          is_organization?: boolean | null
          is_test_mode?: boolean | null
          join_date?: string | null
          largest_gift_amount?: number | null
          largest_gift_date?: string | null
          last_fiscal_year_gift_total?: number | null
          last_gift_amount?: number | null
          last_gift_date?: string | null
          last_name?: string | null
          last_year_gift_total?: number | null
          lifetime_contribution_total?: number | null
          lifetime_gift_total?: number | null
          lifetime_non_cash_gift_total?: number | null
          lifetime_soft_credit_total?: number | null
          mobile_phone?: string | null
          name?: string
          number_of_gifts?: number | null
          organization?: string | null
          phone?: string
          postal_code?: string | null
          preferred_name?: string | null
          processing_fee?: number | null
          spouse_name?: string | null
          state?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          total_amount?: number
          total_pledge_balance?: number | null
          updated_at?: string
          work_phone?: string | null
          ytd_gift_total?: number | null
        }
        Relationships: []
      }
      incoming_donation_items: {
        Row: {
          created_at: string | null
          donation_id: string | null
          id: string
          inventory_id: string | null
          item_name: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          donation_id?: string | null
          id?: string
          inventory_id?: string | null
          item_name: string
          quantity?: number
        }
        Update: {
          created_at?: string | null
          donation_id?: string | null
          id?: string
          inventory_id?: string | null
          item_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "incoming_donation_items_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "incoming_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incoming_donation_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_donations: {
        Row: {
          company_id: string | null
          created_at: string | null
          donation_date: string
          id: string
          notes: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          donation_date?: string
          id?: string
          notes?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          donation_date?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incoming_donations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category: string
          created_at: string | null
          id: string
          item_name: string
          item_type: string | null
          opening_stock: number | null
          price_per_unit: number | null
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
          price_per_unit?: number | null
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
          price_per_unit?: number | null
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
          total_value: number | null
          transaction_type: string
          value_per_unit: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          inventory_id: string
          item_name: string
          quantity_change: number
          stock_after: number
          total_value?: number | null
          transaction_type: string
          value_per_unit?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          inventory_id?: string
          item_name?: string
          quantity_change?: number
          stock_after?: number
          total_value?: number | null
          transaction_type?: string
          value_per_unit?: number | null
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
      invoice_items: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          invoice_id: string
          item_name: string
          price: number
          quantity: number
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          invoice_id: string
          item_name: string
          price?: number
          quantity?: number
          total?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          invoice_id?: string
          item_name?: string
          price?: number
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string
          due_date: string | null
          email_sent_at: string | null
          fulfilled_at: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          due_date?: string | null
          email_sent_at?: string | null
          fulfilled_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          due_date?: string | null
          email_sent_at?: string | null
          fulfilled_at?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
      partners: {
        Row: {
          active: boolean | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          contact_name: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          is_out_of_state: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string
          state: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_out_of_state?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_out_of_state?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
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
      training_videos: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string | null
          vimeo_url: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string | null
          vimeo_url: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string | null
          vimeo_url?: string
        }
        Relationships: []
      }
      volunteer_events: {
        Row: {
          capacity: number
          created_at: string
          event_date: string
          event_name: string | null
          event_type: string
          id: string
          location: string
          location_address: string
          requires_payment: boolean | null
          slots_filled: number
          ticket_price: number | null
          ticket_purchase_url: string | null
          time_slot: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          event_date: string
          event_name?: string | null
          event_type?: string
          id?: string
          location: string
          location_address: string
          requires_payment?: boolean | null
          slots_filled?: number
          ticket_price?: number | null
          ticket_purchase_url?: string | null
          time_slot: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          event_date?: string
          event_name?: string | null
          event_type?: string
          id?: string
          location?: string
          location_address?: string
          requires_payment?: boolean | null
          slots_filled?: number
          ticket_price?: number | null
          ticket_purchase_url?: string | null
          time_slot?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_signup_attendees: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          signup_id: string
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: string
          last_name: string
          signup_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          signup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_signup_attendees_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: false
            referencedRelation: "volunteer_signups"
            referencedColumns: ["id"]
          },
        ]
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
          reminder_sent: boolean | null
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
          reminder_sent?: boolean | null
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
          reminder_sent?: boolean | null
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
      generate_invoice_number: { Args: never; Returns: string }
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
