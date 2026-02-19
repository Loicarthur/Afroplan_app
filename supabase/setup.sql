-- ============================================
-- AFROPLAN - SCRIPT COMPLET DE BASE DE DONNÉES
-- ============================================
-- Exécuter ce fichier ENTIER dans l'éditeur SQL de Supabase Dashboard
-- Il supprime tout et recrée proprement
-- ============================================

-- ============================================
-- ÉTAPE 1: NETTOYAGE COMPLET
-- ============================================
-- Ordre : vues → tables (CASCADE supprime auto les triggers) → fonctions → types
-- Cela évite l'erreur "relation does not exist" si les tables ont déjà été supprimées

-- Supprimer les vues
DROP VIEW IF EXISTS platform_monthly_revenue CASCADE;
DROP VIEW IF EXISTS salon_revenue_summary CASCADE;
DROP VIEW IF EXISTS active_promotions CASCADE;
DROP VIEW IF EXISTS home_service_coiffeurs CASCADE;

-- Supprimer le trigger sur auth.users (cette table existe toujours dans Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer les tables (CASCADE supprime automatiquement tous les triggers et contraintes associés)
DROP TABLE IF EXISTS platform_revenue CASCADE;
DROP TABLE IF EXISTS subscription_invoices CASCADE;
DROP TABLE IF EXISTS commission_payouts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS stripe_accounts CASCADE;
DROP TABLE IF EXISTS promotion_usages CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS coiffeur_availability CASCADE;
DROP TABLE IF EXISTS client_addresses CASCADE;
DROP TABLE IF EXISTS coverage_zones CASCADE;
DROP TABLE IF EXISTS coiffeur_details CASCADE;
DROP TABLE IF EXISTS gallery_images CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS salon_categories CASCADE;
DROP TABLE IF EXISTS salons CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Supprimer les fonctions (après les tables car CASCADE a déjà nettoyé les dépendances)
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_salon_rating() CASCADE;
DROP FUNCTION IF EXISTS is_promotion_valid(UUID, UUID, UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS calculate_promotion_discount(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS increment_promotion_usage() CASCADE;
DROP FUNCTION IF EXISTS calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS find_home_service_coiffeurs(DECIMAL, DECIMAL, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS record_platform_commission() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_coiffeur() CASCADE;
DROP FUNCTION IF EXISTS is_client() CASCADE;
DROP FUNCTION IF EXISTS promote_to_admin(TEXT) CASCADE;

-- Supprimer les types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS booking_payment_status CASCADE;
DROP TYPE IF EXISTS service_location_type CASCADE;
DROP TYPE IF EXISTS booking_source CASCADE;
DROP TYPE IF EXISTS promotion_type CASCADE;
DROP TYPE IF EXISTS promotion_status CASCADE;
DROP TYPE IF EXISTS stripe_payment_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- ============================================
-- ÉTAPE 2: EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ÉTAPE 3: TYPES ÉNUMÉRÉS (noms uniques, pas de conflit)
-- ============================================
CREATE TYPE user_role AS ENUM ('client', 'coiffeur', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_method AS ENUM ('full', 'deposit', 'on_site');
CREATE TYPE booking_payment_status AS ENUM ('pending', 'partial', 'completed', 'refunded');
CREATE TYPE service_location_type AS ENUM ('salon', 'domicile', 'both');
CREATE TYPE booking_source AS ENUM ('client_app', 'coiffeur_walkin', 'coiffeur_for_client');
CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed_amount', 'free_service');
CREATE TYPE promotion_status AS ENUM ('draft', 'active', 'paused', 'expired');
CREATE TYPE stripe_payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');

-- ============================================
-- ÉTAPE 4: TABLES PRINCIPALES
-- ============================================

-- PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role user_role DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    icon TEXT,
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALONS
CREATE TABLE salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'France',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone TEXT,
    email TEXT,
    website TEXT,
    image_url TEXT,
    cover_image_url TEXT,
    photos TEXT[], -- Liste d'URLs pour compatibilité avec le frontend
    specialties TEXT[], -- Liste de spécialités
    rating DECIMAL(2, 1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    opening_hours JSONB,
    offers_home_service BOOLEAN DEFAULT false,
    home_service_description TEXT,
    min_home_service_amount DECIMAL(10, 2) DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_salons_city ON salons(city);
CREATE INDEX idx_salons_is_active ON salons(is_active);
CREATE INDEX idx_salons_rating ON salons(rating DESC);
CREATE INDEX idx_salons_owner ON salons(owner_id);
CREATE INDEX idx_salons_location ON salons(latitude, longitude);
CREATE INDEX idx_salons_search ON salons USING GIN(to_tsvector('french', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_salons_home_service ON salons(offers_home_service) WHERE offers_home_service = true;

-- SALON_CATEGORIES
CREATE TABLE salon_categories (
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (salon_id, category_id)
);

-- SERVICES
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    service_location service_location_type DEFAULT 'salon',
    home_service_additional_fee DECIMAL(10, 2) DEFAULT 0,
    min_booking_notice_hours INTEGER DEFAULT 2,
    -- Nouveau : Gestion des mèches pour coiffure afro
    requires_extensions BOOLEAN DEFAULT false,
    extensions_included BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_location ON services(service_location);

-- BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    coiffeur_id UUID REFERENCES profiles(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status booking_status DEFAULT 'pending',
    notes TEXT,
    total_price DECIMAL(10, 2) NOT NULL,
    payment_method payment_method DEFAULT 'on_site',
    payment_status booking_payment_status DEFAULT 'pending',
    deposit_amount DECIMAL(10, 2) DEFAULT 10.00,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2),
    payment_date TIMESTAMPTZ,
    service_location service_location_type DEFAULT 'salon',
    client_address TEXT,
    client_latitude DECIMAL(10, 8),
    client_longitude DECIMAL(11, 8),
    home_service_fee DECIMAL(10, 2) DEFAULT 0,
    promotion_id UUID,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    -- Qui a créé la réservation et comment (walk-in, app client, coiffeur pour un client)
    created_by UUID REFERENCES profiles(id),
    source booking_source DEFAULT 'client_app',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_salon ON bookings(salon_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_source ON bookings(source);

-- REVIEWS
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (client_id, salon_id)
);

CREATE INDEX idx_reviews_salon ON reviews(salon_id);
CREATE INDEX idx_reviews_client ON reviews(client_id);

-- FAVORITES
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, salon_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- GALLERY_IMAGES
-- Distinction photo principale / sous-photos :
--   is_main_photo = true  → Photo principale du salon (affichée en grand dans les listings)
--   is_main_photo = false → Sous-photos / galerie (affichées lors du clic sur le salon)
-- Note : la colonne salons.cover_image_url peut aussi servir de photo principale
--        gallery_images complète la galerie avec les réalisations du salon.
CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    "order" INTEGER DEFAULT 0,
    is_main_photo BOOLEAN DEFAULT false,  -- true = photo principale du salon, false = sous-photo / galerie
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_salon ON gallery_images(salon_id);
CREATE INDEX idx_gallery_main_photo ON gallery_images(salon_id, is_main_photo) WHERE is_main_photo = true;

-- ============================================
-- ÉTAPE 5: TABLES ÉTENDUES (coiffeur, promos, etc.)
-- ============================================

-- COIFFEUR_DETAILS
CREATE TABLE coiffeur_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT,
    years_of_experience INTEGER DEFAULT 0,
    specialties TEXT[],
    certifications TEXT[],
    offers_home_service BOOLEAN DEFAULT false,
    offers_salon_service BOOLEAN DEFAULT true,
    home_service_fee DECIMAL(10, 2) DEFAULT 0,
    min_home_service_distance INTEGER DEFAULT 0,
    max_home_service_distance INTEGER DEFAULT 20,
    is_available BOOLEAN DEFAULT true,
    vacation_mode BOOLEAN DEFAULT false,
    vacation_start DATE,
    vacation_end DATE,
    instagram_url TEXT,
    facebook_url TEXT,
    tiktok_url TEXT,
    portfolio_url TEXT,
    total_clients_served INTEGER DEFAULT 0,
    total_bookings_completed INTEGER DEFAULT 0,
    cancellation_rate DECIMAL(5, 2) DEFAULT 0,
    is_identity_verified BOOLEAN DEFAULT false,
    is_address_verified BOOLEAN DEFAULT false,
    has_insurance BOOLEAN DEFAULT false,
    insurance_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coiffeur_details_user ON coiffeur_details(user_id);
CREATE INDEX idx_coiffeur_details_home_service ON coiffeur_details(offers_home_service) WHERE offers_home_service = true;
CREATE INDEX idx_coiffeur_details_available ON coiffeur_details(is_available) WHERE is_available = true;

-- COVERAGE_ZONES
CREATE TABLE coverage_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coiffeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    postal_code TEXT,
    department TEXT,
    region TEXT,
    country TEXT DEFAULT 'France',
    center_latitude DECIMAL(10, 8),
    center_longitude DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 10,
    additional_fee DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coiffeur_id, city, postal_code)
);

CREATE INDEX idx_coverage_zones_coiffeur ON coverage_zones(coiffeur_id);
CREATE INDEX idx_coverage_zones_city ON coverage_zones(city);
CREATE INDEX idx_coverage_zones_location ON coverage_zones(center_latitude, center_longitude);

-- PROMOTIONS
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE,
    type promotion_type NOT NULL DEFAULT 'percentage',
    value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    applicable_service_ids UUID[],
    applicable_categories TEXT[],
    max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    first_booking_only BOOLEAN DEFAULT false,
    new_clients_only BOOLEAN DEFAULT false,
    valid_days INTEGER[],
    status promotion_status DEFAULT 'draft',
    image_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_salon ON promotions(salon_id);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;

-- Ajouter la FK promotion_id dans bookings maintenant que promotions existe
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id);

-- PROMOTION_USAGES
CREATE TABLE promotion_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(promotion_id, user_id, booking_id)
);

CREATE INDEX idx_promotion_usages_promotion ON promotion_usages(promotion_id);
CREATE INDEX idx_promotion_usages_user ON promotion_usages(user_id);

-- CLIENT_ADDRESSES
CREATE TABLE client_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Domicile',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'France',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    additional_info TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_addresses_user ON client_addresses(user_id);

-- COIFFEUR_AVAILABILITY
CREATE TABLE coiffeur_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coiffeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    specific_date DATE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    service_location service_location_type DEFAULT 'both',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (specific_date IS NOT NULL OR day_of_week IS NOT NULL)
);

CREATE INDEX idx_coiffeur_availability_coiffeur ON coiffeur_availability(coiffeur_id);
CREATE INDEX idx_coiffeur_availability_date ON coiffeur_availability(specific_date);
CREATE INDEX idx_coiffeur_availability_day ON coiffeur_availability(day_of_week);

-- ============================================
-- ÉTAPE 6: TABLES PAIEMENTS
-- ============================================

-- STRIPE_ACCOUNTS
CREATE TABLE stripe_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL UNIQUE REFERENCES salons(id) ON DELETE CASCADE,
    stripe_account_id TEXT,
    is_onboarded BOOLEAN DEFAULT false,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_status subscription_status,
    stripe_subscription_id TEXT,
    subscription_started_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    default_currency TEXT DEFAULT 'eur',
    country TEXT DEFAULT 'FR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stripe_accounts_salon ON stripe_accounts(salon_id);
CREATE INDEX idx_stripe_accounts_stripe_id ON stripe_accounts(stripe_account_id);

-- PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    total_service_price INTEGER NOT NULL,
    remaining_amount INTEGER NOT NULL,
    commission INTEGER NOT NULL,
    salon_amount INTEGER NOT NULL,
    commission_rate DECIMAL(4, 4) NOT NULL,
    currency TEXT DEFAULT 'eur',
    payment_type TEXT DEFAULT 'deposit',
    status stripe_payment_status DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    stripe_transfer_id TEXT,
    paid_at TIMESTAMPTZ,
    transferred_at TIMESTAMPTZ,
    is_paid_out BOOLEAN DEFAULT false,
    payout_date TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,
    stripe_refund_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_salon ON payments(salon_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- COMMISSION_PAYOUTS
CREATE TABLE commission_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    stripe_account_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'eur',
    stripe_payout_id TEXT,
    stripe_transfer_id TEXT,
    status TEXT DEFAULT 'pending',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_salon ON commission_payouts(salon_id);
CREATE INDEX idx_payouts_status ON commission_payouts(status);

-- SUBSCRIPTION_INVOICES
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    plan subscription_plan NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'eur',
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'draft',
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    invoice_pdf TEXT,
    hosted_invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_salon ON subscription_invoices(salon_id);
CREATE INDEX idx_invoices_stripe ON subscription_invoices(stripe_invoice_id);

-- PLATFORM_REVENUE
CREATE TABLE platform_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type TEXT NOT NULL,
    source_id UUID NOT NULL,
    salon_id UUID REFERENCES salons(id),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'eur',
    period_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_revenue_date ON platform_revenue(period_date);
CREATE INDEX idx_platform_revenue_type ON platform_revenue(source_type);
CREATE INDEX idx_platform_revenue_salon ON platform_revenue(salon_id);

-- ============================================
-- ÉTAPE 7: FONCTION HELPER ADMIN (avant les policies)
-- ============================================

-- Vérifie si l'utilisateur courant est admin (utilisée dans toutes les policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur courant est un coiffeur
CREATE OR REPLACE FUNCTION is_coiffeur()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'coiffeur'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur courant est un client
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'client'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ÉTAPE 8: ROW LEVEL SECURITY (RLS)
-- ============================================
-- Chaque table a une policy admin qui donne un accès TOTAL
-- Les policies client/coiffeur sont strictement séparées

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_categories" ON categories FOR ALL USING (is_admin());
CREATE POLICY "categories_select" ON categories FOR SELECT USING (is_active = true);

-- SALONS
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_salons" ON salons FOR ALL USING (is_admin());
-- Clients voient les salons actifs ; le propriétaire voit toujours son salon (actif ou non)
CREATE POLICY "salons_select" ON salons FOR SELECT USING (is_active = true OR auth.uid() = owner_id);
CREATE POLICY "salons_insert" ON salons FOR INSERT WITH CHECK (
    auth.uid() = owner_id
);
CREATE POLICY "salons_update" ON salons FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "salons_delete" ON salons FOR DELETE USING (auth.uid() = owner_id);

-- SALON_CATEGORIES
ALTER TABLE salon_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_salon_categories" ON salon_categories FOR ALL USING (is_admin());
CREATE POLICY "salon_categories_select" ON salon_categories FOR SELECT USING (true);
CREATE POLICY "salon_categories_manage" ON salon_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- SERVICES
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_services" ON services FOR ALL USING (is_admin());
CREATE POLICY "services_select" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "services_manage" ON services FOR ALL USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- BOOKINGS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_bookings" ON bookings FOR ALL USING (is_admin());
-- Tout utilisateur peut voir ses propres réservations (client OU coiffeur en mode client)
CREATE POLICY "bookings_own_select" ON bookings FOR SELECT USING (auth.uid() = client_id);
-- Tout utilisateur authentifié peut créer une réservation pour lui-même (client ou coiffeur en mode client)
CREATE POLICY "bookings_own_insert" ON bookings FOR INSERT WITH CHECK (
    auth.uid() = client_id
);
CREATE POLICY "bookings_own_update" ON bookings FOR UPDATE USING (auth.uid() = client_id);
-- Coiffeur: voit et gère les réservations de SON salon
CREATE POLICY "bookings_coiffeur_select" ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);
CREATE POLICY "bookings_coiffeur_update" ON bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);
-- Coiffeur: peut créer un RDV walk-in pour un client arrivé au salon
CREATE POLICY "bookings_coiffeur_walkin_insert" ON bookings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    AND source IN ('coiffeur_walkin', 'coiffeur_for_client')
);

-- REVIEWS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_reviews" ON reviews FOR ALL USING (is_admin());
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
-- Seul un client peut créer/modifier/supprimer un avis
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (
    auth.uid() = client_id AND is_client()
);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING (auth.uid() = client_id);

-- FAVORITES
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_favorites" ON favorites FOR ALL USING (is_admin());
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- GALLERY_IMAGES
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_gallery" ON gallery_images FOR ALL USING (is_admin());
CREATE POLICY "gallery_select" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "gallery_manage" ON gallery_images FOR ALL USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- COIFFEUR_DETAILS
ALTER TABLE coiffeur_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_coiffeur_details" ON coiffeur_details FOR ALL USING (is_admin());
CREATE POLICY "coiffeur_details_select" ON coiffeur_details FOR SELECT USING (true);
CREATE POLICY "coiffeur_details_insert" ON coiffeur_details FOR INSERT WITH CHECK (
    auth.uid() = user_id AND is_coiffeur()
);
CREATE POLICY "coiffeur_details_update" ON coiffeur_details FOR UPDATE USING (auth.uid() = user_id);

-- COVERAGE_ZONES
ALTER TABLE coverage_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_coverage_zones" ON coverage_zones FOR ALL USING (is_admin());
CREATE POLICY "coverage_zones_select" ON coverage_zones FOR SELECT USING (is_active = true);
CREATE POLICY "coverage_zones_manage" ON coverage_zones FOR ALL USING (auth.uid() = coiffeur_id);

-- PROMOTIONS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_promotions" ON promotions FOR ALL USING (is_admin());
CREATE POLICY "promotions_public_select" ON promotions FOR SELECT USING (
    status = 'active' AND NOW() >= start_date AND NOW() <= end_date
);
CREATE POLICY "promotions_owner_select" ON promotions FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);
CREATE POLICY "promotions_manage" ON promotions FOR ALL USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- PROMOTION_USAGES
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_promo_usages" ON promotion_usages FOR ALL USING (is_admin());
CREATE POLICY "promo_usages_user_select" ON promotion_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "promo_usages_salon_select" ON promotion_usages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM promotions p JOIN salons s ON s.id = p.salon_id
        WHERE p.id = promotion_id AND s.owner_id = auth.uid()
    )
);
CREATE POLICY "promo_usages_insert" ON promotion_usages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CLIENT_ADDRESSES
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_client_addresses" ON client_addresses FOR ALL USING (is_admin());
CREATE POLICY "client_addresses_select" ON client_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "client_addresses_manage" ON client_addresses FOR ALL USING (auth.uid() = user_id);

-- COIFFEUR_AVAILABILITY
ALTER TABLE coiffeur_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_availability" ON coiffeur_availability FOR ALL USING (is_admin());
CREATE POLICY "availability_select" ON coiffeur_availability FOR SELECT USING (true);
CREATE POLICY "availability_manage" ON coiffeur_availability FOR ALL USING (auth.uid() = coiffeur_id);

-- STRIPE_ACCOUNTS
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_stripe" ON stripe_accounts FOR ALL USING (is_admin());
CREATE POLICY "stripe_select" ON stripe_accounts FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);
CREATE POLICY "stripe_update" ON stripe_accounts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- PAYMENTS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_payments" ON payments FOR ALL USING (is_admin());
CREATE POLICY "payments_client_select" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.client_id = auth.uid())
);
CREATE POLICY "payments_salon_select" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- COMMISSION_PAYOUTS
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_payouts" ON commission_payouts FOR ALL USING (is_admin());
CREATE POLICY "payouts_select" ON commission_payouts FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- SUBSCRIPTION_INVOICES
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_invoices" ON subscription_invoices FOR ALL USING (is_admin());
CREATE POLICY "invoices_select" ON subscription_invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
);

-- PLATFORM_REVENUE (Admin seulement !)
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access_revenue" ON platform_revenue FOR ALL USING (is_admin());

-- ============================================
-- ÉTAPE 8: FONCTIONS
-- ============================================

-- Créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'phone',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur mais ne bloque pas l'inscription
        RAISE WARNING 'Erreur creation profil pour %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour la note moyenne d'un salon
CREATE OR REPLACE FUNCTION update_salon_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(2, 1);
    review_count INTEGER;
BEGIN
    SELECT AVG(rating)::DECIMAL(2, 1), COUNT(*)
    INTO avg_rating, review_count
    FROM reviews
    WHERE salon_id = COALESCE(NEW.salon_id, OLD.salon_id);

    UPDATE salons
    SET rating = COALESCE(avg_rating, 0),
        reviews_count = review_count
    WHERE id = COALESCE(NEW.salon_id, OLD.salon_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier si une promotion est valide
CREATE OR REPLACE FUNCTION is_promotion_valid(
    p_promotion_id UUID,
    p_user_id UUID,
    p_service_id UUID DEFAULT NULL,
    p_amount DECIMAL(10, 2) DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
    promo RECORD;
    usage_count INTEGER;
BEGIN
    SELECT * INTO promo FROM promotions WHERE id = p_promotion_id;
    IF NOT FOUND THEN RETURN false; END IF;
    IF promo.status != 'active' THEN RETURN false; END IF;
    IF NOW() < promo.start_date OR NOW() > promo.end_date THEN RETURN false; END IF;
    IF p_amount < promo.min_purchase_amount THEN RETURN false; END IF;
    IF promo.max_uses IS NOT NULL AND promo.current_uses >= promo.max_uses THEN RETURN false; END IF;

    SELECT COUNT(*) INTO usage_count FROM promotion_usages
    WHERE promotion_id = p_promotion_id AND user_id = p_user_id;
    IF promo.max_uses_per_user IS NOT NULL AND usage_count >= promo.max_uses_per_user THEN RETURN false; END IF;

    IF promo.new_clients_only THEN
        IF EXISTS (SELECT 1 FROM bookings WHERE client_id = p_user_id AND salon_id = promo.salon_id AND status = 'completed') THEN
            RETURN false;
        END IF;
    END IF;

    IF promo.first_booking_only THEN
        IF EXISTS (SELECT 1 FROM bookings WHERE client_id = p_user_id AND status = 'completed') THEN
            RETURN false;
        END IF;
    END IF;

    IF promo.valid_days IS NOT NULL AND array_length(promo.valid_days, 1) > 0 THEN
        IF NOT EXTRACT(DOW FROM NOW())::INTEGER = ANY(promo.valid_days) THEN
            RETURN false;
        END IF;
    END IF;

    IF p_service_id IS NOT NULL AND promo.applicable_service_ids IS NOT NULL THEN
        IF NOT p_service_id = ANY(promo.applicable_service_ids) THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculer la réduction d'une promotion
CREATE OR REPLACE FUNCTION calculate_promotion_discount(
    p_promotion_id UUID,
    p_amount DECIMAL(10, 2)
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    promo RECORD;
    discount DECIMAL(10, 2);
BEGIN
    SELECT * INTO promo FROM promotions WHERE id = p_promotion_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    CASE promo.type
        WHEN 'percentage' THEN discount := p_amount * (promo.value / 100);
        WHEN 'fixed_amount' THEN discount := promo.value;
        WHEN 'free_service' THEN discount := p_amount;
        ELSE discount := 0;
    END CASE;

    IF promo.max_discount_amount IS NOT NULL AND discount > promo.max_discount_amount THEN
        discount := promo.max_discount_amount;
    END IF;
    IF discount > p_amount THEN discount := p_amount; END IF;

    RETURN discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrémenter les utilisations d'une promotion
CREATE OR REPLACE FUNCTION increment_promotion_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE promotions SET current_uses = current_uses + 1 WHERE id = NEW.promotion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Distance entre deux points (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL(10, 8), lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8), lon2 DECIMAL(11, 8)
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    R CONSTANT DECIMAL := 6371;
    dLat DECIMAL; dLon DECIMAL; a DECIMAL; c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    a := SIN(dLat/2) * SIN(dLat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon/2) * SIN(dLon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    RETURN ROUND(R * c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trouver les coiffeurs disponibles pour service à domicile
CREATE OR REPLACE FUNCTION find_home_service_coiffeurs(
    p_latitude DECIMAL(10, 8), p_longitude DECIMAL(11, 8),
    p_category TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    coiffeur_id UUID, full_name TEXT, avatar_url TEXT,
    distance_km DECIMAL(10, 2), home_service_fee DECIMAL(10, 2), rating DECIMAL(2, 1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT cd.user_id, p.full_name, p.avatar_url,
        calculate_distance_km(cz.center_latitude, cz.center_longitude, p_latitude, p_longitude),
        cd.home_service_fee, s.rating
    FROM coiffeur_details cd
    JOIN profiles p ON p.id = cd.user_id
    LEFT JOIN coverage_zones cz ON cz.coiffeur_id = cd.user_id AND cz.is_active = true
    LEFT JOIN salons s ON s.owner_id = cd.user_id
    WHERE cd.offers_home_service = true AND cd.is_available = true AND cd.vacation_mode = false
      AND (cz.id IS NULL OR calculate_distance_km(cz.center_latitude, cz.center_longitude, p_latitude, p_longitude) <= cz.radius_km)
    ORDER BY distance_km ASC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enregistrer les revenus de la plateforme
CREATE OR REPLACE FUNCTION record_platform_commission()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO platform_revenue (source_type, source_id, salon_id, amount, currency)
        VALUES ('commission', NEW.id, NEW.salon_id, NEW.commission, NEW.currency);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promouvoir un utilisateur en admin (à appeler manuellement via SQL)
-- Exemple : SELECT promote_to_admin('ton-email@gmail.com');
CREATE OR REPLACE FUNCTION promote_to_admin(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_old_role user_role;
BEGIN
    SELECT id, role INTO v_user_id, v_old_role
    FROM profiles WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RETURN 'ERREUR: Aucun utilisateur trouvé avec email ' || p_email;
    END IF;

    IF v_old_role = 'admin' THEN
        RETURN 'INFO: ' || p_email || ' est déjà admin';
    END IF;

    UPDATE profiles SET role = 'admin', updated_at = NOW()
    WHERE id = v_user_id;

    RETURN 'OK: ' || p_email || ' promu admin (ancien rôle: ' || v_old_role || ')';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 10: TRIGGERS
-- ============================================

-- Profil auto-créé à l'inscription
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at automatique
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coiffeur_details_updated_at BEFORE UPDATE ON coiffeur_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_addresses_updated_at BEFORE UPDATE ON client_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_accounts_updated_at BEFORE UPDATE ON stripe_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note salon auto-calculée
CREATE TRIGGER update_salon_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_salon_rating();

-- Compteur promotions
CREATE TRIGGER on_promotion_usage_insert
    AFTER INSERT ON promotion_usages
    FOR EACH ROW EXECUTE FUNCTION increment_promotion_usage();

-- Commission plateforme
CREATE TRIGGER on_payment_completed
    AFTER UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION record_platform_commission();

-- ============================================
-- ÉTAPE 12: PERMISSIONS (GRANT)
-- ============================================
-- Sans ces permissions, les rôles Supabase (anon/authenticated)
-- ne peuvent pas accéder aux tables même avec RLS configuré

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ============================================
-- ÉTAPE 11: VUES
-- ============================================

CREATE OR REPLACE VIEW active_promotions AS
SELECT p.*, s.name AS salon_name, s.image_url AS salon_image, s.city AS salon_city, s.rating AS salon_rating
FROM promotions p JOIN salons s ON s.id = p.salon_id
WHERE p.status = 'active' AND NOW() >= p.start_date AND NOW() <= p.end_date
  AND (p.max_uses IS NULL OR p.current_uses < p.max_uses);

CREATE OR REPLACE VIEW home_service_coiffeurs AS
SELECT p.id AS coiffeur_id, p.full_name, p.avatar_url, p.phone,
    cd.bio, cd.years_of_experience, cd.specialties, cd.home_service_fee, cd.max_home_service_distance,
    s.name AS salon_name, s.rating, s.reviews_count, s.city
FROM profiles p
JOIN coiffeur_details cd ON cd.user_id = p.id
LEFT JOIN salons s ON s.owner_id = p.id
WHERE p.role = 'coiffeur' AND cd.offers_home_service = true AND cd.is_available = true AND cd.vacation_mode = false;

CREATE OR REPLACE VIEW salon_revenue_summary AS
SELECT s.id AS salon_id, s.name AS salon_name, sa.subscription_plan,
    COUNT(p.id) AS total_transactions, COALESCE(SUM(p.amount), 0) AS total_revenue,
    COALESCE(SUM(p.commission), 0) AS total_commission_paid,
    COALESCE(SUM(p.salon_amount), 0) AS total_net_revenue,
    COALESCE(SUM(CASE WHEN p.is_paid_out = false AND p.status = 'completed' THEN p.salon_amount ELSE 0 END), 0) AS pending_payout
FROM salons s
LEFT JOIN stripe_accounts sa ON s.id = sa.salon_id
LEFT JOIN payments p ON s.id = p.salon_id AND p.status = 'completed'
GROUP BY s.id, s.name, sa.subscription_plan;

CREATE OR REPLACE VIEW platform_monthly_revenue AS
SELECT DATE_TRUNC('month', period_date) AS month, source_type,
    SUM(amount) AS total_amount, COUNT(*) AS transaction_count
FROM platform_revenue
GROUP BY DATE_TRUNC('month', period_date), source_type
ORDER BY month DESC;

-- ============================================
-- ÉTAPE 12: DONNÉES INITIALES
-- ============================================
-- AfroPlan est une plateforme exclusivement dédiée à la coiffure afro.
-- Tous les styles et catégories reflètent l'univers capillaire afro.
-- Les prix ne sont PAS définis ici : c'est chaque coiffeur/salon
-- qui fixe ses propres tarifs selon les styles qu'il propose.
-- ============================================

-- Catégories 100% afro (alignées avec HAIRSTYLE_CATEGORIES du frontend)
INSERT INTO categories (name, slug, description, icon, "order") VALUES
    ('Naturels / Cheveux libres', 'naturels', 'Wash & Go, styles naturels définis sur cheveux crépus et frisés', 'leaf-outline', 1),
    ('Tresses et Nattes', 'tresses-nattes', 'Box Braids, Knotless Braids, Cornrows, Boho Braids, Fulani Braids, Crochet Braids', 'git-branch-outline', 2),
    ('Vanilles et Twists', 'vanilles-twists', 'Vanilles, Barrel Twist — torsades naturelles ou avec extensions', 'repeat-outline', 3),
    ('Locs', 'locs', 'Création et entretien de locks, Fausse Locs, Dreadlocks, Sisterlocks, Soft Locks, Butterfly Locks', 'infinite-outline', 4),
    ('Boucles et Ondulations', 'boucles-ondulations', 'Bantu Knots, styles bouclés et ondulés sur cheveux afro', 'sparkles-outline', 5),
    ('Tissages et Perruques', 'tissages-perruques', 'Tissage, Pose de perruque, Flip Over, Tape-in', 'layers-outline', 6),
    ('Ponytail', 'ponytail', 'Queues de cheval stylisées, lisses ou bouclées', 'chevron-up-outline', 7),
    ('Coupe et Restructuration', 'coupe-restructuration', 'Coupes afro femme / homme / enfant, restructuration capillaire', 'cut-outline', 8),
    ('Soins, Lissage et Coloration', 'soins-lissage-coloration', 'Soins hydratants, lissage brésilien/kératine, coloration et balayage', 'color-palette-outline', 9);

-- ============================================
-- EXEMPLES DE SEED DATA : salons afro
-- (à adapter selon l'environnement de démo)
-- ============================================
-- Pour insérer des salons de démo, créez d'abord des profils coiffeurs via l'app,
-- puis exécutez des INSERT INTO salons(...) avec les owner_id correspondants.
--
-- Exemple de structure pour gallery_images avec distinction photo principale / sous-photos :
--
-- INSERT INTO gallery_images (salon_id, image_url, caption, "order", is_main_photo) VALUES
--   -- Photo principale du salon (affichée en grand dans le listing)
--   ('uuid-du-salon', 'https://...photo-principale.jpg', 'Façade du salon', 0, true),
--   -- Sous-photos / galerie (affichées lors du clic sur le salon)
--   ('uuid-du-salon', 'https://...realisation-1.jpg', 'Box Braids réalisées', 1, false),
--   ('uuid-du-salon', 'https://...realisation-2.jpg', 'Cornrows design', 2, false),
--   ('uuid-du-salon', 'https://...realisation-3.jpg', 'Knotless Braids', 3, false),
--   ('uuid-du-salon', 'https://...realisation-4.jpg', 'Fulani Braids avec accessoires', 4, false);
-- ============================================

-- ============================================
-- ÉTAPE 13: STORAGE BUCKETS
-- ============================================
-- À créer manuellement dans Supabase Dashboard > Storage:
-- 1. avatars  (public)
-- 2. salons   (public)
-- 3. gallery  (public)
-- 4. salon-photos (public)

-- ============================================
-- ÉTAPE 14: PROMOUVOIR UN ADMIN
-- ============================================
-- Après avoir créé votre compte via l'app, exécutez dans le SQL Editor de Supabase :
--
--   SELECT promote_to_admin('votre-email@gmail.com');
--
-- Cela donne un accès total (lecture/écriture/suppression) sur TOUTES les tables.
-- ============================================

-- ============================================
-- TERMINÉ ! Votre base de données est prête.
-- Rôles disponibles : client, coiffeur, admin
-- ============================================
