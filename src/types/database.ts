// Hand-written mirror of the Supabase schema (supabase/migrations/0001_init.sql).
// Once the project is provisioned, regenerate with:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts

export type AvailabilityStatus = "available" | "available_soon" | "occupied";
export type SubscriptionStatus = "pending" | "active" | "expired";
export type PaymentStatus = "pending" | "success" | "failed";
export type MpesaPurpose = "subscription" | "tip";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          location_text: string;
          latitude: number | null;
          longitude: number | null;
          price_kes: number;
          deposit_kes: number | null;
          bedrooms: number;
          bathrooms: number | null;
          availability_status: AvailabilityStatus;
          available_from: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          title: string;
          description?: string | null;
          location_text: string;
          latitude?: number | null;
          longitude?: number | null;
          price_kes: number;
          deposit_kes?: number | null;
          bedrooms: number;
          bathrooms?: number | null;
          availability_status?: AvailabilityStatus;
          available_from?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
        Relationships: [];
      };
      listing_photos: {
        Row: {
          id: string;
          listing_id: string;
          url: string;
          position: number;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          url: string;
          position?: number;
        };
        Update: {
          url?: string;
          position?: number;
        };
        Relationships: [];
      };
      listing_contacts: {
        Row: {
          listing_id: string;
          caretaker_name: string | null;
          caretaker_phone: string | null;
          agency_name: string | null;
          agency_phone: string | null;
        };
        Insert: {
          listing_id: string;
          caretaker_name?: string | null;
          caretaker_phone?: string | null;
          agency_name?: string | null;
          agency_phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["listing_contacts"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          listing_id: string;
          reviewer_id: string;
          caretaker_rating: number;
          repairs_rating: number;
          electricity_rating: number;
          water_rating: number;
          rent_fair_rating: number;
          deposit_returned: boolean | null;
          lived_duration_months: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          reviewer_id: string;
          caretaker_rating: number;
          repairs_rating: number;
          electricity_rating: number;
          water_rating: number;
          rent_fair_rating: number;
          deposit_returned?: boolean | null;
          lived_duration_months?: number | null;
          comment?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      availability_updates: {
        Row: {
          id: string;
          listing_id: string;
          status: AvailabilityStatus;
          note: string | null;
          updated_by: string;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          status: AvailabilityStatus;
          note?: string | null;
          updated_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_updates"]["Insert"]>;
        Relationships: [];
      };
      // subscriptions and mpesa_transactions are written only by edge functions using
      // the service-role key; the app's anon-key client can only ever SELECT them
      // (enforced by RLS), but the Insert/Update shapes still need to be valid
      // Record<string, unknown> types to satisfy supabase-js's generic constraints.
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: SubscriptionStatus;
          plan_code: string;
          started_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          status?: SubscriptionStatus;
          plan_code?: string;
          started_at?: string | null;
          expires_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      mpesa_transactions: {
        Row: {
          id: string;
          user_id: string;
          purpose: MpesaPurpose;
          amount_kes: number;
          phone: string;
          status: PaymentStatus;
          checkout_request_id: string | null;
          merchant_request_id: string | null;
          receipt_number: string | null;
          listing_id: string | null;
          recipient_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          purpose: MpesaPurpose;
          amount_kes: number;
          phone: string;
          status?: PaymentStatus;
          checkout_request_id?: string | null;
          merchant_request_id?: string | null;
          receipt_number?: string | null;
          listing_id?: string | null;
          recipient_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["mpesa_transactions"]["Insert"]>;
        Relationships: [];
      };
      saved_listings: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_listings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_active_subscription: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
  };
}
