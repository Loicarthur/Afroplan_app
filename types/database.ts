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
