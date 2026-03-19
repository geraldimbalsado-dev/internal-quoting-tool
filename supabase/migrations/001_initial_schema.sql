-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- PRODUCTS (seeded catalog)
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  available_sizes TEXT[] NOT NULL DEFAULT '{}',
  available_colors TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CLIENTS
-- =============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- QUOTES
-- =============================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'approved', 'changes_requested', 'rejected')),
  validity_date DATE,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quote number sequence
CREATE SEQUENCE quote_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := 'Q-' || LPAD(nextval('quote_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quote_number
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION generate_quote_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- QUOTE ITEMS
-- =============================================
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
  lead_time TEXT,
  mockup_settings JSONB,
  mockup_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOGS
-- =============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_clients_owner_id ON clients(owner_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_owner_id ON quotes(owner_id);
CREATE INDEX idx_quotes_public_token ON quotes(public_token);
CREATE INDEX idx_quotes_parent_quote_id ON quotes(parent_quote_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_activity_logs_quote_id ON activity_logs(quote_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "users can view own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "admins can view all profiles"
  ON profiles FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- PRODUCTS policies (read-only for all authenticated users)
CREATE POLICY "authenticated users can view products"
  ON products FOR SELECT USING (auth.uid() IS NOT NULL);

-- CLIENTS policies
CREATE POLICY "sales users own clients"
  ON clients FOR ALL USING (
    owner_id = auth.uid() OR get_user_role() = 'admin'
  );

-- QUOTES policies
CREATE POLICY "sales users own quotes"
  ON quotes FOR ALL USING (
    owner_id = auth.uid() OR get_user_role() = 'admin'
  );

-- QUOTE ITEMS policies (access via quote ownership)
CREATE POLICY "quote items via quote ownership"
  ON quote_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.owner_id = auth.uid() OR get_user_role() = 'admin')
    )
  );

-- ACTIVITY LOGS policies
CREATE POLICY "activity logs via quote ownership"
  ON activity_logs FOR ALL USING (
    (quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = activity_logs.quote_id
      AND (quotes.owner_id = auth.uid() OR get_user_role() = 'admin')
    ))
    OR
    (quote_id IS NULL AND (user_id = auth.uid() OR get_user_role() = 'admin'))
  );

-- =============================================
-- STORAGE BUCKETS (run via Supabase dashboard or CLI)
-- =============================================
-- bucket: logos (private, per-user uploads)
-- bucket: mockups (private, generated mockups)
-- bucket: product-images (public, product catalog images)
