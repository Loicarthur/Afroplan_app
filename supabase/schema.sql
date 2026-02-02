-- ============================================
-- SCHEMA SQL POUR AFROPLAN - SUPABASE
-- ============================================
-- Ce fichier contient le schema complet de la base de donnees
-- A executer dans l'editeur SQL de Supabase Dashboard

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TYPES ENUMERES
-- ============================================
CREATE TYPE user_role AS ENUM ('client', 'coiffeur', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_method AS ENUM ('full', 'deposit', 'on_site');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'refunded');

-- ============================================
-- TABLE: PROFILES (Utilisateurs)
-- ============================================
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

-- Index pour les recherches
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de securite
CREATE POLICY "Les utilisateurs peuvent voir tous les profils" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent inserer leur propre profil" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLE: CATEGORIES
-- ============================================
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

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les categories" ON categories
    FOR SELECT USING (is_active = true);

-- Donnees initiales des categories
INSERT INTO categories (name, slug, description, icon, "order") VALUES
    ('Tresses', 'tresses', 'Tresses africaines, box braids, cornrows', 'git-branch-outline', 1),
    ('Locks / Dreadlocks', 'locks', 'Creation et entretien de locks', 'infinite-outline', 2),
    ('Coupe', 'coupe', 'Coupes hommes et femmes', 'cut-outline', 3),
    ('Coloration', 'coloration', 'Coloration, meches, balayage', 'color-palette-outline', 4),
    ('Soins capillaires', 'soins', 'Soins hydratants, traitements', 'heart-outline', 5),
    ('Lissage', 'lissage', 'Lissage bresilien, japonais', 'water-outline', 6),
    ('Extensions', 'extensions', 'Tissages, extensions, perruques', 'sparkles-outline', 7),
    ('Barber', 'barber', 'Coupe homme, barbe, degradé', 'man-outline', 8),
    ('Enfants', 'enfants', 'Coiffures pour enfants', 'happy-outline', 9),
    ('Mariage', 'mariage', 'Coiffures de mariage', 'diamond-outline', 10);

-- ============================================
-- TABLE: SALONS
-- ============================================
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
    rating DECIMAL(2, 1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    opening_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX idx_salons_city ON salons(city);
CREATE INDEX idx_salons_is_active ON salons(is_active);
CREATE INDEX idx_salons_rating ON salons(rating DESC);
CREATE INDEX idx_salons_owner ON salons(owner_id);
CREATE INDEX idx_salons_location ON salons(latitude, longitude);

-- Index de recherche full-text
CREATE INDEX idx_salons_search ON salons USING GIN(to_tsvector('french', name || ' ' || COALESCE(description, '')));

-- RLS
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les salons actifs" ON salons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Les proprietaires peuvent modifier leur salon" ON salons
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Les coiffeurs peuvent creer un salon" ON salons
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coiffeur')
    );

-- ============================================
-- TABLE: SALON_CATEGORIES (Relation N:N)
-- ============================================
CREATE TABLE salon_categories (
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (salon_id, category_id)
);

-- RLS
ALTER TABLE salon_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les categories des salons" ON salon_categories
    FOR SELECT USING (true);

-- ============================================
-- TABLE: SERVICES
-- ============================================
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_services_category ON services(category);

-- RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les services actifs" ON services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Les proprietaires peuvent gerer leurs services" ON services
    FOR ALL USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- TABLE: BOOKINGS (Reservations)
-- ============================================
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
    -- Champs de paiement
    payment_method payment_method DEFAULT 'on_site',
    payment_status payment_status DEFAULT 'pending',
    deposit_amount DECIMAL(10, 2) DEFAULT 10.00,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    remaining_amount DECIMAL(10, 2),
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_salon ON bookings(salon_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les clients voient leurs reservations" ON bookings
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Les salons voient leurs reservations" ON bookings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

CREATE POLICY "Les clients peuvent creer des reservations" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Les clients peuvent annuler leurs reservations" ON bookings
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Les salons peuvent modifier les reservations" ON bookings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- TABLE: REVIEWS (Avis)
-- ============================================
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

-- Index
CREATE INDEX idx_reviews_salon ON reviews(salon_id);
CREATE INDEX idx_reviews_client ON reviews(client_id);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les avis" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Les clients peuvent creer des avis" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Les clients peuvent modifier leurs avis" ON reviews
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Les clients peuvent supprimer leurs avis" ON reviews
    FOR DELETE USING (auth.uid() = client_id);

-- ============================================
-- TABLE: FAVORITES
-- ============================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, salon_id)
);

-- Index
CREATE INDEX idx_favorites_user ON favorites(user_id);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs favoris" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent ajouter des favoris" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs favoris" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TABLE: GALLERY_IMAGES
-- ============================================
CREATE TABLE gallery_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_gallery_salon ON gallery_images(salon_id);

-- RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir la galerie" ON gallery_images
    FOR SELECT USING (true);

CREATE POLICY "Les proprietaires peuvent gerer leur galerie" ON gallery_images
    FOR ALL USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour creer automatiquement un profil lors de l'inscription
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour creer le profil
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction pour mettre a jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salons_updated_at
    BEFORE UPDATE ON salons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre a jour la note moyenne d'un salon
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

-- Trigger pour mettre a jour la note
CREATE TRIGGER update_salon_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_salon_rating();

-- ============================================
-- STORAGE BUCKETS (a creer dans le dashboard)
-- ============================================
-- Creer les buckets suivants dans Supabase Storage:
-- 1. avatars - pour les photos de profil
-- 2. salons - pour les images des salons
-- 3. gallery - pour les galeries des salons

-- Exemple de politique pour le bucket avatars:
-- INSERT: auth.uid() = owner
-- SELECT: true (public)
-- UPDATE: auth.uid() = owner
-- DELETE: auth.uid() = owner

-- ============================================
-- DONNEES DE DEMONSTRATION (optionnel)
-- ============================================

-- Decommenter pour ajouter des donnees de test
/*
-- Salon de demonstration
INSERT INTO salons (
    id, owner_id, name, description, address, city, postal_code,
    phone, email, rating, reviews_count, is_verified, is_active,
    opening_hours
) VALUES (
    uuid_generate_v4(),
    (SELECT id FROM profiles LIMIT 1), -- Remplacer par un vrai owner_id
    'Afro Beauty Paris',
    'Salon specialise dans les coiffures afro, tresses, locks et soins capillaires',
    '123 Rue de la Paix',
    'Paris',
    '75001',
    '+33 1 23 45 67 89',
    'contact@afrobeauty.fr',
    4.5,
    25,
    true,
    true,
    '{
        "monday": {"open": "09:00", "close": "19:00", "isClosed": false},
        "tuesday": {"open": "09:00", "close": "19:00", "isClosed": false},
        "wednesday": {"open": "09:00", "close": "19:00", "isClosed": false},
        "thursday": {"open": "09:00", "close": "21:00", "isClosed": false},
        "friday": {"open": "09:00", "close": "21:00", "isClosed": false},
        "saturday": {"open": "09:00", "close": "18:00", "isClosed": false},
        "sunday": {"open": "00:00", "close": "00:00", "isClosed": true}
    }'::jsonb
);
*/
