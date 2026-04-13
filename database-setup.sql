-- ============================================
-- EcoSave Market - Database Setup Script
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Products Table
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supermarket_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    unidades INTEGER NOT NULL DEFAULT 1,
    vencimiento DATE NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Normal',
    color VARCHAR(20) NOT NULL DEFAULT 'verde',
    donated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Donations Table
-- ============================================
CREATE TABLE IF NOT EXISTS donations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supermarket_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ong_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'requested', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for better performance
-- ============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_supermarket_id ON products(supermarket_id);
CREATE INDEX IF NOT EXISTS idx_products_estado ON products(estado);
CREATE INDEX IF NOT EXISTS idx_products_vencimiento ON products(vencimiento);
CREATE INDEX IF NOT EXISTS idx_products_donated ON products(donated);

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_supermarket_id ON donations(supermarket_id);
CREATE INDEX IF NOT EXISTS idx_donations_ong_id ON donations(ong_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Products RLS policies
CREATE POLICY "Supermercados pueden ver sus propios productos" ON products
    FOR SELECT USING (auth.uid() = supermarket_id);

CREATE POLICY "Supermercados pueden insertar sus propios productos" ON products
    FOR INSERT WITH CHECK (auth.uid() = supermarket_id);

CREATE POLICY "Supermercados pueden actualizar sus propios productos" ON products
    FOR UPDATE USING (auth.uid() = supermarket_id);

CREATE POLICY "Supermercados pueden eliminar sus propios productos" ON products
    FOR DELETE USING (auth.uid() = supermarket_id);

CREATE POLICY "Todos pueden ver productos disponibles para donación" ON products
    FOR SELECT USING (
        estado IN ('Urgente', 'Advertencia') 
        AND donated = FALSE
    );

-- Donations RLS policies
CREATE POLICY "Supermercados pueden ver sus donaciones" ON donations
    FOR SELECT USING (auth.uid() = supermarket_id);

CREATE POLICY "ONGs pueden ver donaciones disponibles" ON donations
    FOR SELECT USING (status = 'available');

CREATE POLICY "ONGs pueden ver sus propias donaciones" ON donations
    FOR SELECT USING (auth.uid() = ong_id);

CREATE POLICY "Supermercados pueden crear donaciones" ON donations
    FOR INSERT WITH CHECK (auth.uid() = supermarket_id);

CREATE POLICY "ONGs pueden solicitar donaciones" ON donations
    FOR UPDATE USING (auth.uid() = ong_id AND status = 'available');

-- ============================================
-- Functions for automatic timestamp updates
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at 
    BEFORE UPDATE ON donations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to automatically calculate product status
-- ============================================

CREATE OR REPLACE FUNCTION calculate_product_status()
RETURNS TRIGGER AS $$
DECLARE
    days_until_expiry INTEGER;
    new_status VARCHAR(50);
    new_color VARCHAR(20);
BEGIN
    -- Calculate days until expiry
    days_until_expiry := NEW.vencimiento - CURRENT_DATE;
    
    -- Determine status and color based on expiry
    IF days_until_expiry < 0 THEN
        new_status := 'Vencido';
        new_color := 'rojo';
    ELSIF days_until_expiry = 0 THEN
        new_status := 'Urgente';
        new_color := 'rojo';
    ELSIF days_until_expiry <= 2 THEN
        new_status := 'Urgente';
        new_color := 'rojo';
    ELSIF days_until_expiry <= 5 THEN
        new_status := 'Advertencia';
        new_color := 'amarillo';
    ELSE
        new_status := 'Normal';
        new_color := 'verde';
    END IF;
    
    -- Only update if not explicitly set
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estado = NEW.estado) THEN
        NEW.estado := new_status;
        NEW.color := new_color;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic status calculation
CREATE TRIGGER calculate_product_status_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION calculate_product_status();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Note: Uncomment the following sections if you want to insert sample data
-- Make sure you have actual user UUIDs from your auth.users table

/*
-- Insert sample products (replace with actual user UUIDs)
INSERT INTO products (supermarket_id, nombre, categoria, unidades, vencimiento) VALUES
('your-supermarket-uuid-1', 'Pan integral', 'Panadería', 25, CURRENT_DATE),
('your-supermarket-uuid-1', 'Yogur natural', 'Lácteos', 12, CURRENT_DATE + INTERVAL '2 days'),
('your-supermarket-uuid-1', 'Manzanas', 'Frutas', 8, CURRENT_DATE + INTERVAL '1 day'),
('your-supermarket-uuid-2', 'Leche entera', 'Lácteos', 15, CURRENT_DATE + INTERVAL '5 days'),
('your-supermarket-uuid-2', 'Tomates', 'Verduras', 10, CURRENT_DATE + INTERVAL '3 days');
*/

-- ============================================
-- Views for easier data access
-- ============================================

-- View for available donations with product and supermarket info
CREATE OR REPLACE VIEW available_donations_view AS
SELECT 
    d.id,
    d.product_id,
    d.product_name,
    d.product_category,
    d.quantity,
    d.expiry_date,
    d.supermarket_id,
    d.status,
    d.created_at,
    p.nombre as original_product_name,
    p.vencimiento,
    u.business_name as supermarket_name,
    u.email as supermarket_email,
    u.phone as supermarket_phone
FROM donations d
JOIN products p ON d.product_id = p.id
JOIN auth.users u ON d.supermarket_id = u.id
WHERE d.status = 'available'
ORDER BY d.created_at DESC;

-- View for donation statistics
CREATE OR REPLACE VIEW donation_stats_view AS
SELECT 
    COUNT(*) as total_donations,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_donations,
    COUNT(CASE WHEN status = 'requested' THEN 1 END) as requested_donations,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations,
    SUM(quantity) as total_items_donated
FROM donations;

-- ============================================
-- Setup Complete
-- ============================================

-- Grant necessary permissions
GRANT ALL ON products TO authenticated;
GRANT ALL ON donations TO authenticated;
GRANT SELECT ON available_donations_view TO authenticated;
GRANT SELECT ON donation_stats_view TO authenticated;
