-- ============================================
-- SCHEMA SQL PAIEMENTS - AFRO'PLANET
-- ============================================
-- Tables pour la gestion des paiements Stripe Connect
-- et le système de commission

-- ============================================
-- TYPES ENUMERES
-- ============================================
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');

-- ============================================
-- TABLE: STRIPE_ACCOUNTS (Comptes Stripe Connect des salons)
-- ============================================
CREATE TABLE stripe_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL UNIQUE REFERENCES salons(id) ON DELETE CASCADE,
    stripe_account_id TEXT,
    is_onboarded BOOLEAN DEFAULT false,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,

    -- Abonnement du salon
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_status subscription_status,
    stripe_subscription_id TEXT,
    subscription_started_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,

    -- Informations bancaires
    default_currency TEXT DEFAULT 'eur',
    country TEXT DEFAULT 'FR',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_stripe_accounts_salon ON stripe_accounts(salon_id);
CREATE INDEX idx_stripe_accounts_stripe_id ON stripe_accounts(stripe_account_id);

-- RLS
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les proprietaires peuvent voir leur compte Stripe" ON stripe_accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

CREATE POLICY "Les proprietaires peuvent modifier leur compte Stripe" ON stripe_accounts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- TABLE: PAYMENTS (Paiements des réservations)
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

    -- Montants
    amount INTEGER NOT NULL, -- Montant total en centimes
    commission INTEGER NOT NULL, -- Commission Afro'Planet en centimes
    salon_amount INTEGER NOT NULL, -- Montant reversé au salon en centimes
    commission_rate DECIMAL(4, 4) NOT NULL, -- Taux de commission appliqué
    currency TEXT DEFAULT 'eur',

    -- Statut
    status payment_status DEFAULT 'pending',

    -- Stripe
    stripe_payment_intent_id TEXT,
    stripe_transfer_id TEXT,

    -- Dates
    paid_at TIMESTAMPTZ,
    transferred_at TIMESTAMPTZ,
    is_paid_out BOOLEAN DEFAULT false,
    payout_date TIMESTAMPTZ,

    -- Remboursement
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,
    stripe_refund_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_salon ON payments(salon_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les clients voient leurs paiements" ON payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.client_id = auth.uid())
    );

CREATE POLICY "Les salons voient leurs paiements" ON payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- TABLE: COMMISSION_PAYOUTS (Historique des virements)
-- ============================================
CREATE TABLE commission_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    stripe_account_id TEXT NOT NULL,

    -- Montants
    amount INTEGER NOT NULL, -- Montant du virement en centimes
    currency TEXT DEFAULT 'eur',

    -- Stripe
    stripe_payout_id TEXT,
    stripe_transfer_id TEXT,

    -- Statut
    status TEXT DEFAULT 'pending', -- pending, in_transit, paid, failed, cancelled

    -- Période couverte
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Dates
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payouts_salon ON commission_payouts(salon_id);
CREATE INDEX idx_payouts_status ON commission_payouts(status);

-- RLS
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les salons voient leurs virements" ON commission_payouts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- TABLE: SUBSCRIPTION_INVOICES (Factures d'abonnement)
-- ============================================
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,

    -- Détails
    plan subscription_plan NOT NULL,
    amount INTEGER NOT NULL, -- Montant en centimes
    currency TEXT DEFAULT 'eur',

    -- Période
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Statut
    status TEXT DEFAULT 'draft', -- draft, open, paid, void, uncollectible

    -- Dates
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,

    -- PDF
    invoice_pdf TEXT,
    hosted_invoice_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_invoices_salon ON subscription_invoices(salon_id);
CREATE INDEX idx_invoices_stripe ON subscription_invoices(stripe_invoice_id);

-- RLS
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les salons voient leurs factures" ON subscription_invoices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_id AND salons.owner_id = auth.uid())
    );

-- ============================================
-- TABLE: PLATFORM_REVENUE (Revenus de la plateforme)
-- ============================================
CREATE TABLE platform_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source
    source_type TEXT NOT NULL, -- 'commission' ou 'subscription'
    source_id UUID NOT NULL, -- payment_id ou subscription_invoice_id
    salon_id UUID REFERENCES salons(id),

    -- Montant
    amount INTEGER NOT NULL, -- En centimes
    currency TEXT DEFAULT 'eur',

    -- Période
    period_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les rapports
CREATE INDEX idx_platform_revenue_date ON platform_revenue(period_date);
CREATE INDEX idx_platform_revenue_type ON platform_revenue(source_type);
CREATE INDEX idx_platform_revenue_salon ON platform_revenue(salon_id);

-- RLS - Admin only (pas de politique publique)
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VUES POUR LES STATISTIQUES
-- ============================================

-- Vue des revenus par salon
CREATE OR REPLACE VIEW salon_revenue_summary AS
SELECT
    s.id AS salon_id,
    s.name AS salon_name,
    sa.subscription_plan,
    COUNT(p.id) AS total_transactions,
    COALESCE(SUM(p.amount), 0) AS total_revenue,
    COALESCE(SUM(p.commission), 0) AS total_commission_paid,
    COALESCE(SUM(p.salon_amount), 0) AS total_net_revenue,
    COALESCE(SUM(CASE WHEN p.is_paid_out = false AND p.status = 'completed' THEN p.salon_amount ELSE 0 END), 0) AS pending_payout
FROM salons s
LEFT JOIN stripe_accounts sa ON s.id = sa.salon_id
LEFT JOIN payments p ON s.id = p.salon_id AND p.status = 'completed'
GROUP BY s.id, s.name, sa.subscription_plan;

-- Vue des revenus de la plateforme par mois
CREATE OR REPLACE VIEW platform_monthly_revenue AS
SELECT
    DATE_TRUNC('month', period_date) AS month,
    source_type,
    SUM(amount) AS total_amount,
    COUNT(*) AS transaction_count
FROM platform_revenue
GROUP BY DATE_TRUNC('month', period_date), source_type
ORDER BY month DESC;

-- ============================================
-- FONCTIONS
-- ============================================

-- Fonction pour enregistrer les revenus de la plateforme après un paiement
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

-- Trigger pour enregistrer les commissions
CREATE TRIGGER on_payment_completed
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION record_platform_commission();

-- Fonction pour mettre à jour updated_at
CREATE TRIGGER update_stripe_accounts_updated_at
    BEFORE UPDATE ON stripe_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONNEES INITIALES
-- ============================================

-- Les plans d'abonnement seront gérés par le code (constantes TypeScript)
-- car ils sont liés aux Price IDs Stripe qui varient selon l'environnement

COMMENT ON TABLE stripe_accounts IS 'Comptes Stripe Connect des salons partenaires';
COMMENT ON TABLE payments IS 'Paiements des réservations avec détail des commissions';
COMMENT ON TABLE commission_payouts IS 'Historique des virements aux salons';
COMMENT ON TABLE subscription_invoices IS 'Factures des abonnements mensuels des salons';
COMMENT ON TABLE platform_revenue IS 'Suivi des revenus de la plateforme Afro''Planet';
