-- ============================================
-- SCHEMA SQL ETENDU POUR AFROPLAN - SUPABASE
-- ============================================
-- Ce fichier contient les extensions du schema pour:
-- - Service a domicile vs au salon
-- - Systeme de promotions
-- - Zones de couverture pour coiffeurs
-- - Informations etendues des coiffeurs
-- ============================================

-- ============================================
-- NOUVEAUX TYPES ENUMERES
-- ============================================
CREATE TYPE service_location_type AS ENUM ('salon', 'domicile', 'both');
CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed_amount', 'free_service');
CREATE TYPE promotion_status AS ENUM ('draft', 'active', 'paused', 'expired');

-- ============================================
-- TABLE: COIFFEUR_DETAILS (Informations etendues coiffeur)
-- ============================================
CREATE TABLE coiffeur_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

    -- Informations professionnelles
    bio TEXT,
    years_of_experience INTEGER DEFAULT 0,
    specialties TEXT[], -- Array des specialites
    certifications TEXT[], -- Diplomes et certifications

    -- Services offerts
    offers_home_service BOOLEAN DEFAULT false, -- Service a domicile
    offers_salon_service BOOLEAN DEFAULT true, -- Service au salon
    home_service_fee DECIMAL(10, 2) DEFAULT 0, -- Frais supplementaires pour domicile
    min_home_service_distance INTEGER DEFAULT 0, -- Distance min en km
    max_home_service_distance INTEGER DEFAULT 20, -- Distance max en km

    -- Disponibilite
    is_available BOOLEAN DEFAULT true,
    vacation_mode BOOLEAN DEFAULT false,
    vacation_start DATE,
    vacation_end DATE,

    -- Social et portfolio
    instagram_url TEXT,
    facebook_url TEXT,
    tiktok_url TEXT,
    portfolio_url TEXT,

    -- Statistiques
    total_clients_served INTEGER DEFAULT 0,
    total_bookings_completed INTEGER DEFAULT 0,
    cancellation_rate DECIMAL(5, 2) DEFAULT 0,

    -- Verification et badges
    is_identity_verified BOOLEAN DEFAULT false,
    is_address_verified BOOLEAN DEFAULT false,
    has_insurance BOOLEAN DEFAULT false,
    insurance_number TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_coiffeur_details_user ON coiffeur_details(user_id);
CREATE INDEX idx_coiffeur_details_home_service ON coiffeur_details(offers_home_service) WHERE offers_home_service = true;
CREATE INDEX idx_coiffeur_details_available ON coiffeur_details(is_available) WHERE is_available = true;

-- RLS
ALTER TABLE coiffeur_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les details des coiffeurs" ON coiffeur_details
    FOR SELECT USING (true);

CREATE POLICY "Les coiffeurs peuvent modifier leurs propres details" ON coiffeur_details
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Les coiffeurs peuvent inserer leurs propres details" ON coiffeur_details
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'coiffeur')
    );

-- ============================================
-- TABLE: COVERAGE_ZONES (Zones de couverture)
-- ============================================
CREATE TABLE coverage_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coiffeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Zone geographique
    city TEXT NOT NULL,
    postal_code TEXT,
    department TEXT,
    region TEXT,
    country TEXT DEFAULT 'France',

    -- Coordonnees du centre de la zone
    center_latitude DECIMAL(10, 8),
    center_longitude DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 10, -- Rayon de couverture en km

    -- Tarification par zone
    additional_fee DECIMAL(10, 2) DEFAULT 0, -- Frais supplementaires pour cette zone

    -- Statut
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contrainte d'unicite par coiffeur et ville
    UNIQUE(coiffeur_id, city, postal_code)
);

-- Index
CREATE INDEX idx_coverage_zones_coiffeur ON coverage_zones(coiffeur_id);
CREATE INDEX idx_coverage_zones_city ON coverage_zones(city);
CREATE INDEX idx_coverage_zones_location ON coverage_zones(center_latitude, center_longitude);

-- RLS
ALTER TABLE coverage_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les zones de couverture" ON coverage_zones
    FOR SELECT USING (is_active = true);

CREATE POLICY "Les coiffeurs peuvent gerer leurs zones" ON coverage_zones
    FOR ALL USING (auth.uid() = coiffeur_id);

-- ============================================
-- TABLE: PROMOTIONS
-- ============================================
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

    -- Informations de base
    title TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE, -- Code promo optionnel

    -- Type et valeur de la promotion
    type promotion_type NOT NULL DEFAULT 'percentage',
    value DECIMAL(10, 2) NOT NULL, -- Pourcentage ou montant fixe

    -- Conditions
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0, -- Montant minimum d'achat
    max_discount_amount DECIMAL(10, 2), -- Plafond de reduction

    -- Services concernes (null = tous les services)
    applicable_service_ids UUID[], -- IDs des services concernes
    applicable_categories TEXT[], -- Categories concernees

    -- Restrictions
    max_uses INTEGER, -- Nombre max d'utilisations total
    max_uses_per_user INTEGER DEFAULT 1, -- Nombre max par utilisateur
    current_uses INTEGER DEFAULT 0, -- Utilisations actuelles

    -- Validite
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,

    -- Conditions d'application
    first_booking_only BOOLEAN DEFAULT false, -- Uniquement premiere reservation
    new_clients_only BOOLEAN DEFAULT false, -- Uniquement nouveaux clients

    -- Jours de validite (null = tous les jours)
    valid_days INTEGER[], -- 0=Dimanche, 1=Lundi, etc.

    -- Statut
    status promotion_status DEFAULT 'draft',

    -- Images
    image_url TEXT,
    banner_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_promotions_salon ON promotions(salon_id);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;

-- RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les promotions actives" ON promotions
    FOR SELECT USING (
        status = 'active' AND
        NOW() >= start_date AND
        NOW() <= end_date
    );

CREATE POLICY "Les salons peuvent voir toutes leurs promotions" ON promotions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

CREATE POLICY "Les salons peuvent gerer leurs promotions" ON promotions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- TABLE: PROMOTION_USAGES (Historique d'utilisation)
-- ============================================
CREATE TABLE promotion_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    discount_applied DECIMAL(10, 2) NOT NULL, -- Montant de la reduction appliquee

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un utilisateur ne peut utiliser une promo qu'un nombre limite de fois
    UNIQUE(promotion_id, user_id, booking_id)
);

-- Index
CREATE INDEX idx_promotion_usages_promotion ON promotion_usages(promotion_id);
CREATE INDEX idx_promotion_usages_user ON promotion_usages(user_id);

-- RLS
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs utilisations de promos" ON promotion_usages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les salons voient les utilisations de leurs promos" ON promotion_usages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM promotions p
            JOIN salons s ON s.id = p.salon_id
            WHERE p.id = promotion_id AND s.owner_id = auth.uid()
        )
    );

CREATE POLICY "Insertion lors d'une reservation" ON promotion_usages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MISE A JOUR: TABLE SERVICES (Ajout service_location)
-- ============================================
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_location service_location_type DEFAULT 'salon';
ALTER TABLE services ADD COLUMN IF NOT EXISTS home_service_additional_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS min_booking_notice_hours INTEGER DEFAULT 2; -- Delai minimum de reservation

-- Index pour le type de service
CREATE INDEX IF NOT EXISTS idx_services_location ON services(service_location);

-- ============================================
-- MISE A JOUR: TABLE SALONS (Ajout options domicile)
-- ============================================
ALTER TABLE salons ADD COLUMN IF NOT EXISTS offers_home_service BOOLEAN DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS home_service_description TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS min_home_service_amount DECIMAL(10, 2) DEFAULT 30; -- Montant min pour deplacement

-- Index
CREATE INDEX IF NOT EXISTS idx_salons_home_service ON salons(offers_home_service) WHERE offers_home_service = true;

-- ============================================
-- MISE A JOUR: TABLE BOOKINGS (Ajout location + promo)
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_location service_location_type DEFAULT 'salon';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_latitude DECIMAL(10, 8);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_longitude DECIMAL(11, 8);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS home_service_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- ============================================
-- TABLE: CLIENT_ADDRESSES (Adresses clients)
-- ============================================
CREATE TABLE client_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    label TEXT DEFAULT 'Domicile', -- Ex: Domicile, Bureau, etc.
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'France',

    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    additional_info TEXT, -- Digicode, etage, etc.

    is_default BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_client_addresses_user ON client_addresses(user_id);

-- RLS
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs adresses" ON client_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent gerer leurs adresses" ON client_addresses
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TABLE: COIFFEUR_AVAILABILITY (Disponibilites specifiques)
-- ============================================
CREATE TABLE coiffeur_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coiffeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Date specifique ou jour de semaine
    specific_date DATE, -- Si null, c'est un jour de semaine recurrent
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Dimanche

    -- Creneaux
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Type
    is_available BOOLEAN DEFAULT true, -- true = disponible, false = indisponible

    -- Service location pour ce creneau
    service_location service_location_type DEFAULT 'both',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (specific_date IS NOT NULL OR day_of_week IS NOT NULL)
);

-- Index
CREATE INDEX idx_coiffeur_availability_coiffeur ON coiffeur_availability(coiffeur_id);
CREATE INDEX idx_coiffeur_availability_date ON coiffeur_availability(specific_date);
CREATE INDEX idx_coiffeur_availability_day ON coiffeur_availability(day_of_week);

-- RLS
ALTER TABLE coiffeur_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les disponibilites" ON coiffeur_availability
    FOR SELECT USING (true);

CREATE POLICY "Les coiffeurs peuvent gerer leurs disponibilites" ON coiffeur_availability
    FOR ALL USING (auth.uid() = coiffeur_id);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour verifier si une promotion est valide
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
    -- Recuperer la promotion
    SELECT * INTO promo FROM promotions WHERE id = p_promotion_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Verifier le statut
    IF promo.status != 'active' THEN
        RETURN false;
    END IF;

    -- Verifier les dates
    IF NOW() < promo.start_date OR NOW() > promo.end_date THEN
        RETURN false;
    END IF;

    -- Verifier le montant minimum
    IF p_amount < promo.min_purchase_amount THEN
        RETURN false;
    END IF;

    -- Verifier les utilisations totales
    IF promo.max_uses IS NOT NULL AND promo.current_uses >= promo.max_uses THEN
        RETURN false;
    END IF;

    -- Verifier les utilisations par utilisateur
    SELECT COUNT(*) INTO usage_count
    FROM promotion_usages
    WHERE promotion_id = p_promotion_id AND user_id = p_user_id;

    IF promo.max_uses_per_user IS NOT NULL AND usage_count >= promo.max_uses_per_user THEN
        RETURN false;
    END IF;

    -- Verifier si c'est pour les nouveaux clients uniquement
    IF promo.new_clients_only THEN
        IF EXISTS (
            SELECT 1 FROM bookings
            WHERE client_id = p_user_id
            AND salon_id = promo.salon_id
            AND status = 'completed'
        ) THEN
            RETURN false;
        END IF;
    END IF;

    -- Verifier si c'est pour la premiere reservation uniquement
    IF promo.first_booking_only THEN
        IF EXISTS (SELECT 1 FROM bookings WHERE client_id = p_user_id AND status = 'completed') THEN
            RETURN false;
        END IF;
    END IF;

    -- Verifier le jour de la semaine
    IF promo.valid_days IS NOT NULL AND array_length(promo.valid_days, 1) > 0 THEN
        IF NOT EXTRACT(DOW FROM NOW())::INTEGER = ANY(promo.valid_days) THEN
            RETURN false;
        END IF;
    END IF;

    -- Verifier le service si specifie
    IF p_service_id IS NOT NULL AND promo.applicable_service_ids IS NOT NULL THEN
        IF NOT p_service_id = ANY(promo.applicable_service_ids) THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer la reduction d'une promotion
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

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    CASE promo.type
        WHEN 'percentage' THEN
            discount := p_amount * (promo.value / 100);
        WHEN 'fixed_amount' THEN
            discount := promo.value;
        WHEN 'free_service' THEN
            discount := p_amount; -- Service gratuit
        ELSE
            discount := 0;
    END CASE;

    -- Appliquer le plafond si defini
    IF promo.max_discount_amount IS NOT NULL AND discount > promo.max_discount_amount THEN
        discount := promo.max_discount_amount;
    END IF;

    -- Ne pas depasser le montant total
    IF discount > p_amount THEN
        discount := p_amount;
    END IF;

    RETURN discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrementer les utilisations d'une promotion
CREATE OR REPLACE FUNCTION increment_promotion_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE promotions
    SET current_uses = current_uses + 1
    WHERE id = NEW.promotion_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour incrementer les utilisations
CREATE TRIGGER on_promotion_usage_insert
    AFTER INSERT ON promotion_usages
    FOR EACH ROW EXECUTE FUNCTION increment_promotion_usage();

-- Fonction pour calculer la distance entre deux points (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL(10, 8),
    lon1 DECIMAL(11, 8),
    lat2 DECIMAL(10, 8),
    lon2 DECIMAL(11, 8)
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    R CONSTANT DECIMAL := 6371; -- Rayon de la Terre en km
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);

    a := SIN(dLat/2) * SIN(dLat/2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dLon/2) * SIN(dLon/2);

    c := 2 * ATAN2(SQRT(a), SQRT(1-a));

    RETURN ROUND(R * c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour trouver les coiffeurs disponibles pour service a domicile
CREATE OR REPLACE FUNCTION find_home_service_coiffeurs(
    p_latitude DECIMAL(10, 8),
    p_longitude DECIMAL(11, 8),
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    coiffeur_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    distance_km DECIMAL(10, 2),
    home_service_fee DECIMAL(10, 2),
    rating DECIMAL(2, 1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.user_id AS coiffeur_id,
        p.full_name,
        p.avatar_url,
        calculate_distance_km(
            cz.center_latitude, cz.center_longitude,
            p_latitude, p_longitude
        ) AS distance_km,
        cd.home_service_fee,
        s.rating
    FROM coiffeur_details cd
    JOIN profiles p ON p.id = cd.user_id
    LEFT JOIN coverage_zones cz ON cz.coiffeur_id = cd.user_id AND cz.is_active = true
    LEFT JOIN salons s ON s.owner_id = cd.user_id
    WHERE cd.offers_home_service = true
      AND cd.is_available = true
      AND cd.vacation_mode = false
      AND (
          cz.id IS NULL -- Pas de zone definie = partout
          OR calculate_distance_km(
              cz.center_latitude, cz.center_longitude,
              p_latitude, p_longitude
          ) <= cz.radius_km
      )
    ORDER BY distance_km ASC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS POUR MISE A JOUR AUTOMATIQUE
-- ============================================

-- Trigger pour coiffeur_details updated_at
CREATE TRIGGER update_coiffeur_details_updated_at
    BEFORE UPDATE ON coiffeur_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour promotions updated_at
CREATE TRIGGER update_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour client_addresses updated_at
CREATE TRIGGER update_client_addresses_updated_at
    BEFORE UPDATE ON client_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUES UTILITAIRES
-- ============================================

-- Vue des promotions actives avec details du salon
CREATE OR REPLACE VIEW active_promotions AS
SELECT
    p.*,
    s.name AS salon_name,
    s.image_url AS salon_image,
    s.city AS salon_city,
    s.rating AS salon_rating
FROM promotions p
JOIN salons s ON s.id = p.salon_id
WHERE p.status = 'active'
  AND NOW() >= p.start_date
  AND NOW() <= p.end_date
  AND (p.max_uses IS NULL OR p.current_uses < p.max_uses);

-- Vue des coiffeurs offrant service a domicile
CREATE OR REPLACE VIEW home_service_coiffeurs AS
SELECT
    p.id AS coiffeur_id,
    p.full_name,
    p.avatar_url,
    p.phone,
    cd.bio,
    cd.years_of_experience,
    cd.specialties,
    cd.home_service_fee,
    cd.max_home_service_distance,
    s.name AS salon_name,
    s.rating,
    s.reviews_count,
    s.city
FROM profiles p
JOIN coiffeur_details cd ON cd.user_id = p.id
LEFT JOIN salons s ON s.owner_id = p.id
WHERE p.role = 'coiffeur'
  AND cd.offers_home_service = true
  AND cd.is_available = true
  AND cd.vacation_mode = false;

-- ============================================
-- DONNEES INITIALES POUR LES TYPES DE SERVICES
-- ============================================

-- Ces donnees peuvent etre inserees apres la creation des tables
-- INSERT INTO ... si necessaire

COMMENT ON TABLE coiffeur_details IS 'Informations etendues pour les coiffeurs';
COMMENT ON TABLE coverage_zones IS 'Zones geographiques couvertes par les coiffeurs pour le service a domicile';
COMMENT ON TABLE promotions IS 'Promotions et codes promo pour les salons';
COMMENT ON TABLE promotion_usages IS 'Historique d utilisation des promotions';
COMMENT ON TABLE client_addresses IS 'Adresses enregistrees des clients pour le service a domicile';
COMMENT ON TABLE coiffeur_availability IS 'Disponibilites specifiques des coiffeurs';
