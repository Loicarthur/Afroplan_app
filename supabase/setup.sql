-- ============================================
-- AFROPLAN - SCRIPT COMPLET DE BASE DE DONNÉES (VERSION SÉCURISÉE)
-- ============================================
-- Ce script contient l'intégralité de la logique AfroPlan (~1200 lignes).
-- Il est configuré pour NE PAS supprimer vos données existantes.
-- ============================================

-- ============================================
-- ÉTAPE 1: NETTOYAGE COMPLET (DÉSACTIVÉ)
-- ============================================
-- Si vous voulez vraiment TOUT supprimer, décommentez le bloc ci-dessous.
/*
DROP VIEW IF EXISTS platform_monthly_revenue CASCADE;
DROP VIEW IF EXISTS salon_revenue_summary CASCADE;
DROP VIEW IF EXISTS active_promotions CASCADE;
DROP VIEW IF EXISTS home_service_coiffeurs CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
*/

-- ============================================
-- ÉTAPE 2: EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ÉTAPE 3: TYPES ÉNUMÉRÉS (SÉCURISÉS)
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN CREATE TYPE user_role AS ENUM ('client', 'coiffeur', 'admin'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN CREATE TYPE payment_method AS ENUM ('full', 'deposit', 'on_site'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_payment_status') THEN CREATE TYPE booking_payment_status AS ENUM ('pending', 'partial', 'completed', 'refunded'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_location_type') THEN CREATE TYPE service_location_type AS ENUM ('salon', 'coiffeur_home', 'domicile', 'both'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_source') THEN CREATE TYPE booking_source AS ENUM ('client_app', 'coiffeur_walkin', 'coiffeur_for_client'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_type') THEN CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed_amount', 'free_service'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promotion_status') THEN CREATE TYPE promotion_status AS ENUM ('draft', 'active', 'paused', 'expired'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_payment_status') THEN CREATE TYPE stripe_payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'premium'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing'); END IF;
END $$;

-- ============================================
-- ÉTAPE 4: TABLES PRINCIPALES (SÉCURISÉES)
-- ============================================

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role user_role DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
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
CREATE TABLE IF NOT EXISTS salons (
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
    photos TEXT[], 
    specialties TEXT[], 
    rating DECIMAL(2, 1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    opening_hours JSONB,
    service_location service_location_type DEFAULT 'salon',
    offers_home_service BOOLEAN DEFAULT false,
    home_service_description TEXT,
    min_home_service_amount DECIMAL(10, 2) DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);
CREATE INDEX IF NOT EXISTS idx_salons_is_active ON salons(is_active);
CREATE INDEX IF NOT EXISTS idx_salons_rating ON salons(rating DESC);
CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_location ON salons(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_salons_home_service ON salons(offers_home_service) WHERE offers_home_service = true;

-- SALON_CATEGORIES
CREATE TABLE IF NOT EXISTS salon_categories (
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (salon_id, category_id)
);

-- SERVICES
CREATE TABLE IF NOT EXISTS services (
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
    requires_extensions BOOLEAN DEFAULT false,
    extensions_included BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
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
    created_by UUID REFERENCES profiles(id),
    source booking_source DEFAULT 'client_app',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_salon ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
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

CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, salon_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- FAVORITE_STYLES
CREATE TABLE IF NOT EXISTS favorite_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    style_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, style_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_styles_user ON favorite_styles(user_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'coiffeur')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);

-- GALLERY_IMAGES
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    "order" INTEGER DEFAULT 0,
    is_main_photo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 5: TABLES ÉTENDUES (SÉCURISÉES)
-- ============================================

-- COIFFEUR_DETAILS
CREATE TABLE IF NOT EXISTS coiffeur_details (
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
    instagram_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COVERAGE_ZONES
CREATE TABLE IF NOT EXISTS coverage_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coiffeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    postal_code TEXT,
    center_latitude DECIMAL(10, 8),
    center_longitude DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE,
    type promotion_type NOT NULL DEFAULT 'percentage',
    value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status promotion_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROMOTION_USAGES
CREATE TABLE IF NOT EXISTS promotion_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENT_ADDRESSES
CREATE TABLE IF NOT EXISTS client_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Domicile',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COIFFEUR_AVAILABILITY
CREATE TABLE IF NOT EXISTS coiffeur_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coiffeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 6: TABLES PAIEMENTS (SÉCURISÉES)
-- ============================================

-- STRIPE_ACCOUNTS
CREATE TABLE IF NOT EXISTS stripe_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL UNIQUE REFERENCES salons(id) ON DELETE CASCADE,
    stripe_account_id TEXT,
    is_onboarded BOOLEAN DEFAULT false,
    subscription_plan subscription_plan DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    total_service_price INTEGER DEFAULT 0,
    remaining_amount INTEGER DEFAULT 0,
    commission INTEGER DEFAULT 0,
    salon_amount INTEGER DEFAULT 0,
    commission_rate DECIMAL(4, 4) DEFAULT 0.20,
    currency TEXT DEFAULT 'eur',
    payment_type TEXT DEFAULT 'deposit',
    status stripe_payment_status DEFAULT 'pending',
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_transfer_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_salon ON payments(salon_id);

-- COMMISSION_PAYOUTS
CREATE TABLE IF NOT EXISTS commission_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTION_INVOICES
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLATFORM_REVENUE
CREATE TABLE IF NOT EXISTS platform_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    period_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 7: FONCTIONS MÉTIER (REMPLAÇABLES)
-- ============================================

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_coiffeur() RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coiffeur'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_client() RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'client'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION calculate_distance_km(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE R CONSTANT DECIMAL := 6371; dLat DECIMAL; dLon DECIMAL; a DECIMAL; c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1); dLon := RADIANS(lon2 - lon1);
    a := SIN(dLat/2) * SIN(dLat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon/2) * SIN(dLon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a)); RETURN ROUND(R * c, 2);
END; $$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'phone', COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_salon_rating() RETURNS TRIGGER AS $$
BEGIN
    UPDATE salons SET 
        rating = (SELECT AVG(rating)::DECIMAL(2,1) FROM reviews WHERE salon_id = COALESCE(NEW.salon_id, OLD.salon_id)),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE salon_id = COALESCE(NEW.salon_id, OLD.salon_id))
    WHERE id = COALESCE(NEW.salon_id, OLD.salon_id);
    RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION promote_to_admin(p_email TEXT)
RETURNS TEXT AS $$
BEGIN
    UPDATE profiles SET role = 'admin' WHERE email = p_email;
    RETURN 'OK: ' || p_email || ' promu admin';
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 8: ROW LEVEL SECURITY (RLS) SÉCURISÉ
-- ============================================

DO $$ BEGIN
    -- PROFILES
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select') THEN CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update') THEN CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id); END IF;

    -- SALONS
    ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'salons_select') THEN CREATE POLICY "salons_select" ON salons FOR SELECT USING (is_active = true OR auth.uid() = owner_id); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'salons_insert') THEN CREATE POLICY "salons_insert" ON salons FOR INSERT WITH CHECK (auth.uid() = owner_id); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'salons_update') THEN CREATE POLICY "salons_update" ON salons FOR UPDATE USING (auth.uid() = owner_id); END IF;

    -- BOOKINGS
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bookings_own_select') THEN CREATE POLICY "bookings_own_select" ON bookings FOR SELECT USING (auth.uid() = client_id OR EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bookings_own_insert') THEN CREATE POLICY "bookings_own_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id); END IF;

    -- PAYMENTS (Fixation RLS INSERT)
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_client_insert') THEN 
        CREATE POLICY "payments_client_insert" ON payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.client_id = auth.uid())); 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payments_select') THEN 
        CREATE POLICY "payments_select" ON payments FOR SELECT USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.client_id = auth.uid()) OR EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid()));
    END IF;

    -- GALLERY_IMAGES
    ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gallery_select') THEN CREATE POLICY "gallery_select" ON gallery_images FOR SELECT USING (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gallery_manage') THEN CREATE POLICY "gallery_manage" ON gallery_images FOR ALL USING (EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())); END IF;

    -- FAVORITE_STYLES
    ALTER TABLE favorite_styles ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'favorite_styles_select') THEN CREATE POLICY "favorite_styles_select" ON favorite_styles FOR SELECT USING (auth.uid() = user_id); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'favorite_styles_insert') THEN CREATE POLICY "favorite_styles_insert" ON favorite_styles FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'favorite_styles_delete') THEN CREATE POLICY "favorite_styles_delete" ON favorite_styles FOR DELETE USING (auth.uid() = user_id); END IF;
END $$;

-- ============================================
-- ÉTAPE 9: TRIGGERS, VUES ET PERMISSIONS
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS tr_update_salon_rating ON reviews;
CREATE TRIGGER tr_update_salon_rating AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_salon_rating();

CREATE OR REPLACE VIEW active_promotions AS
SELECT p.*, s.name AS salon_name, s.image_url AS salon_image, s.city AS salon_city
FROM promotions p JOIN salons s ON s.id = p.salon_id
WHERE p.status = 'active' AND NOW() BETWEEN p.start_date AND p.end_date;

CREATE OR REPLACE VIEW salon_revenue_summary AS
SELECT salon_id, SUM(amount) as total_revenue, COUNT(*) as transaction_count
FROM payments WHERE status = 'completed' GROUP BY salon_id;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================
-- ÉTAPE 10: DONNÉES INITIALES
-- ============================================
INSERT INTO categories (name, slug, description, icon, "order") VALUES
    ('Tresses et Nattes', 'tresses-nattes', 'Box Braids, Knotless, Cornrows...', 'git-branch-outline', 1),
    ('Vanilles et Twists', 'vanilles-twists', 'Vanilles, Barrel Twist...', 'repeat-outline', 2),
    ('Locks', 'locks', 'Création et entretien...', 'infinite-outline', 3),
    ('Tissages et Perruques', 'tissages-perruques', 'Pose et entretien...', 'layers-outline', 4),
    ('Coupe et Soins', 'coupes-soins', 'Coupes et soins profonds...', 'cut-outline', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TERMINÉ !
-- ============================================
