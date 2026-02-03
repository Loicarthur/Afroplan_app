/**
 * Types pour la base de donnees Supabase AfroPlan
 * Ces types correspondent au schema SQL de la base de donnees
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'client' | 'coiffeur' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'client' | 'coiffeur' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'client' | 'coiffeur' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      salons: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          address: string;
          city: string;
          postal_code: string;
          country: string;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          image_url: string | null;
          cover_image_url: string | null;
          rating: number;
          reviews_count: number;
          is_verified: boolean;
          is_active: boolean;
          opening_hours: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          address: string;
          city: string;
          postal_code: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          image_url?: string | null;
          cover_image_url?: string | null;
          rating?: number;
          reviews_count?: number;
          is_verified?: boolean;
          is_active?: boolean;
          opening_hours?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          address?: string;
          city?: string;
          postal_code?: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          image_url?: string | null;
          cover_image_url?: string | null;
          rating?: number;
          reviews_count?: number;
          is_verified?: boolean;
          is_active?: boolean;
          opening_hours?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          description: string | null;
          price: number;
          duration_minutes: number;
          category: string;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          description?: string | null;
          price: number;
          duration_minutes: number;
          category: string;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          duration_minutes?: number;
          category?: string;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          client_id: string;
          salon_id: string;
          service_id: string;
          coiffeur_id: string | null;
          booking_date: string;
          start_time: string;
          end_time: string;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes: string | null;
          total_price: number;
          payment_method: 'full' | 'deposit' | 'on_site';
          payment_status: 'pending' | 'partial' | 'completed' | 'refunded';
          deposit_amount: number;
          amount_paid: number;
          remaining_amount: number | null;
          payment_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          salon_id: string;
          service_id: string;
          coiffeur_id?: string | null;
          booking_date: string;
          start_time: string;
          end_time: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          total_price: number;
          payment_method?: 'full' | 'deposit' | 'on_site';
          payment_status?: 'pending' | 'partial' | 'completed' | 'refunded';
          deposit_amount?: number;
          amount_paid?: number;
          remaining_amount?: number | null;
          payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          salon_id?: string;
          service_id?: string;
          coiffeur_id?: string | null;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          total_price?: number;
          payment_method?: 'full' | 'deposit' | 'on_site';
          payment_status?: 'pending' | 'partial' | 'completed' | 'refunded';
          deposit_amount?: number;
          amount_paid?: number;
          remaining_amount?: number | null;
          payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          client_id: string;
          salon_id: string;
          booking_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          salon_id: string;
          booking_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          salon_id?: string;
          booking_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          salon_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          salon_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          salon_id?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      salon_categories: {
        Row: {
          salon_id: string;
          category_id: string;
        };
        Insert: {
          salon_id: string;
          category_id: string;
        };
        Update: {
          salon_id?: string;
          category_id?: string;
        };
      };
      gallery_images: {
        Row: {
          id: string;
          salon_id: string;
          image_url: string;
          caption: string | null;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          image_url: string;
          caption?: string | null;
          order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          image_url?: string;
          caption?: string | null;
          order?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'client' | 'coiffeur' | 'admin';
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
      payment_method: 'full' | 'deposit' | 'on_site';
      payment_status: 'pending' | 'partial' | 'completed' | 'refunded';
    };
  };
}

// Types utilitaires pour faciliter l'utilisation
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Salon = Database['public']['Tables']['salons']['Row'];
export type SalonInsert = Database['public']['Tables']['salons']['Insert'];
export type SalonUpdate = Database['public']['Tables']['salons']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update'];

export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type FavoriteInsert = Database['public']['Tables']['favorites']['Insert'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type GalleryImage = Database['public']['Tables']['gallery_images']['Row'];

// Types avec relations
export type SalonWithDetails = Salon & {
  services?: Service[];
  reviews?: Review[];
  categories?: Category[];
  gallery?: GalleryImage[];
  owner?: Profile;
};

export type BookingWithDetails = Booking & {
  salon?: Salon;
  service?: Service;
  client?: Profile;
  coiffeur?: Profile;
};

export type ReviewWithClient = Review & {
  client?: Profile;
};

// Types pour les filtres de recherche
export type SalonFilters = {
  city?: string;
  category?: string;
  minRating?: number;
  maxPrice?: number;
  searchQuery?: string;
  isVerified?: boolean;
};

// Types pour les horaires d'ouverture
export type DaySchedule = {
  open: string;
  close: string;
  isClosed: boolean;
};

export type OpeningHours = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

// Types pour les paiements
export type PaymentMethod = 'full' | 'deposit' | 'on_site';
export type PaymentStatus = 'pending' | 'partial' | 'completed' | 'refunded';

export const DEPOSIT_AMOUNT = 10; // Acompte fixe de 10 EUR

export type PaymentInfo = {
  method: PaymentMethod;
  status: PaymentStatus;
  depositAmount: number;
  amountPaid: number;
  remainingAmount: number;
  totalPrice: number;
};

// ============================================
// NOUVEAUX TYPES POUR LES EXTENSIONS
// ============================================

// Types pour le service a domicile / salon
export type ServiceLocationType = 'salon' | 'domicile' | 'both';

// Types pour les promotions
export type PromotionType = 'percentage' | 'fixed_amount' | 'free_service';
export type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired';

// Table: coiffeur_details
export type CoiffeurDetails = {
  id: string;
  user_id: string;
  bio: string | null;
  years_of_experience: number;
  specialties: string[] | null;
  certifications: string[] | null;
  offers_home_service: boolean;
  offers_salon_service: boolean;
  home_service_fee: number;
  min_home_service_distance: number;
  max_home_service_distance: number;
  is_available: boolean;
  vacation_mode: boolean;
  vacation_start: string | null;
  vacation_end: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  portfolio_url: string | null;
  total_clients_served: number;
  total_bookings_completed: number;
  cancellation_rate: number;
  is_identity_verified: boolean;
  is_address_verified: boolean;
  has_insurance: boolean;
  insurance_number: string | null;
  created_at: string;
  updated_at: string;
};

export type CoiffeurDetailsInsert = Omit<CoiffeurDetails, 'id' | 'created_at' | 'updated_at' | 'total_clients_served' | 'total_bookings_completed' | 'cancellation_rate'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CoiffeurDetailsUpdate = Partial<Omit<CoiffeurDetails, 'id' | 'user_id' | 'created_at'>>;

// Table: coverage_zones
export type CoverageZone = {
  id: string;
  coiffeur_id: string;
  city: string;
  postal_code: string | null;
  department: string | null;
  region: string | null;
  country: string;
  center_latitude: number | null;
  center_longitude: number | null;
  radius_km: number;
  additional_fee: number;
  is_active: boolean;
  created_at: string;
};

export type CoverageZoneInsert = Omit<CoverageZone, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type CoverageZoneUpdate = Partial<Omit<CoverageZone, 'id' | 'coiffeur_id' | 'created_at'>>;

// Table: promotions
export type Promotion = {
  id: string;
  salon_id: string;
  title: string;
  description: string | null;
  code: string | null;
  type: PromotionType;
  value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  applicable_service_ids: string[] | null;
  applicable_categories: string[] | null;
  max_uses: number | null;
  max_uses_per_user: number;
  current_uses: number;
  start_date: string;
  end_date: string;
  first_booking_only: boolean;
  new_clients_only: boolean;
  valid_days: number[] | null;
  status: PromotionStatus;
  image_url: string | null;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PromotionInsert = Omit<Promotion, 'id' | 'current_uses' | 'created_at' | 'updated_at'> & {
  id?: string;
  current_uses?: number;
  created_at?: string;
  updated_at?: string;
};

export type PromotionUpdate = Partial<Omit<Promotion, 'id' | 'salon_id' | 'current_uses' | 'created_at'>>;

// Table: promotion_usages
export type PromotionUsage = {
  id: string;
  promotion_id: string;
  user_id: string;
  booking_id: string | null;
  discount_applied: number;
  created_at: string;
};

export type PromotionUsageInsert = Omit<PromotionUsage, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// Table: client_addresses
export type ClientAddress = {
  id: string;
  user_id: string;
  label: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  additional_info: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientAddressInsert = Omit<ClientAddress, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ClientAddressUpdate = Partial<Omit<ClientAddress, 'id' | 'user_id' | 'created_at'>>;

// Table: coiffeur_availability
export type CoiffeurAvailability = {
  id: string;
  coiffeur_id: string;
  specific_date: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  service_location: ServiceLocationType;
  created_at: string;
};

export type CoiffeurAvailabilityInsert = Omit<CoiffeurAvailability, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type CoiffeurAvailabilityUpdate = Partial<Omit<CoiffeurAvailability, 'id' | 'coiffeur_id' | 'created_at'>>;

// ============================================
// TYPES AVEC RELATIONS ETENDUS
// ============================================

// Profil coiffeur avec tous les details
export type CoiffeurProfile = Profile & {
  coiffeur_details?: CoiffeurDetails;
  coverage_zones?: CoverageZone[];
  salon?: Salon;
  availabilities?: CoiffeurAvailability[];
};

// Salon avec promotions actives
export type SalonWithPromotions = Salon & {
  promotions?: Promotion[];
  active_promotion_count?: number;
};

// Promotion avec details du salon
export type PromotionWithSalon = Promotion & {
  salon?: Salon;
};

// Booking avec promotion appliquee
export type BookingWithPromotion = Booking & {
  promotion?: Promotion;
  original_price?: number;
  discount_amount?: number;
};

// Service etendu avec location
export type ServiceExtended = Service & {
  service_location?: ServiceLocationType;
  home_service_additional_fee?: number;
  min_booking_notice_hours?: number;
};

// ============================================
// TYPES POUR LES FILTRES AVANCES
// ============================================

export type SalonFiltersExtended = SalonFilters & {
  serviceLocation?: ServiceLocationType;
  hasPromotion?: boolean;
  nearbyLatitude?: number;
  nearbyLongitude?: number;
  nearbyRadiusKm?: number;
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  availableNow?: boolean;
  offersHomeService?: boolean;
};

export type CoiffeurFilters = {
  city?: string;
  offersHomeService?: boolean;
  offersSalonService?: boolean;
  specialties?: string[];
  minRating?: number;
  maxDistance?: number;
  isAvailable?: boolean;
  nearbyLatitude?: number;
  nearbyLongitude?: number;
};

export type PromotionFilters = {
  salonId?: string;
  status?: PromotionStatus;
  type?: PromotionType;
  activeOnly?: boolean;
  forNewClientsOnly?: boolean;
};

// ============================================
// TYPES POUR LES REPONSES API
// ============================================

export type HomeServiceCoiffeur = {
  coiffeur_id: string;
  full_name: string;
  avatar_url: string | null;
  distance_km: number;
  home_service_fee: number;
  rating: number;
};

export type ActivePromotion = Promotion & {
  salon_name: string;
  salon_image: string | null;
  salon_city: string;
  salon_rating: number;
};

export type DiscountCalculation = {
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  promotion_applied: Promotion | null;
};
