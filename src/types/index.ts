import type { Database } from "./database";

export * from "./database";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingPhoto = Database["public"]["Tables"]["listing_photos"]["Row"];
export type ListingContact = Database["public"]["Tables"]["listing_contacts"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type AvailabilityUpdate = Database["public"]["Tables"]["availability_updates"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type MpesaTransaction = Database["public"]["Tables"]["mpesa_transactions"]["Row"];

export interface ListingWithPhotos extends Listing {
  listing_photos: ListingPhoto[];
}

export interface ListingFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  availability?: Listing["availability_status"];
}
