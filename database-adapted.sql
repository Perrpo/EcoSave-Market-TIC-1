-- ============================================
-- EcoSave Market - Database Setup Adapted
-- ============================================

-- ============================================
-- Donations Table (adaptada a estructura existente)
-- ============================================
CREATE TABLE IF NOT EXISTS donations (
    id integer GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    product_id integer NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ong_id integer REFERENCES public.users(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    product_category text NOT NULL,
    quantity integer NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'requested', 'completed')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    requested_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes para mejor rendimiento
-- ============================================

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_ong_id ON donations(ong_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- ============================================
-- Trigger para actualizar updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for donations table
CREATE TRIGGER update_donations_updated_at 
    BEFORE UPDATE ON donations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Vista para donaciones disponibles con info del producto
-- ============================================
CREATE OR REPLACE VIEW available_donations_view AS
SELECT 
    d.id,
    d.product_id,
    d.product_name,
    d.product_category,
    d.quantity,
    d.expiry_date,
    d.user_id as supermarket_id,
    d.status,
    d.created_at,
    p.nombre as original_product_name,
    p.vencimiento,
    u.email as supermarket_email,
    up.name as supermarket_name,
    up.business as supermarket_business
FROM donations d
JOIN products p ON d.product_id = p.id
JOIN users u ON d.user_id = u.id
LEFT JOIN user_profiles up ON d.user_id = up.user_id
WHERE d.status = 'available'
ORDER BY d.created_at DESC;

-- ============================================
-- Vista para estadísticas de donaciones
-- ============================================
CREATE OR REPLACE VIEW donation_stats_view AS
SELECT 
    COUNT(*) as total_donations,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_donations,
    COUNT(CASE WHEN status = 'requested' THEN 1 END) as requested_donations,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations,
    SUM(quantity) as total_items_donated
FROM donations;

-- ============================================
-- Permisos
-- ============================================
GRANT ALL ON donations TO authenticated;
GRANT SELECT ON available_donations_view TO authenticated;
GRANT SELECT ON donation_stats_view TO authenticated;
