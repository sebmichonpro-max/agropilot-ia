-- Types de stockage thermique
CREATE TYPE storage_type AS ENUM ('ambient', 'fresh', 'frozen', 'deep_frozen');

-- Zones de stockage (chambres froides, ambiantes, etc.)
CREATE TABLE storage_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_type storage_type NOT NULL,
  temperature_min numeric(5,1),
  temperature_max numeric(5,1),
  thermal_factor integer NOT NULL DEFAULT 100,
  daily_cost_cents integer NOT NULL,
  capacity_pallets integer,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Références produit (matières premières stockées)
CREATE TABLE product_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  family text,
  supplier text,
  unit_price_cents integer NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  default_storage_type storage_type,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(organization_id, code)
);

-- Palettes en stock (ou historiques)
CREATE TABLE pallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_reference_id uuid NOT NULL REFERENCES product_references(id),
  storage_zone_id uuid NOT NULL REFERENCES storage_zones(id),
  lot_number text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  initial_quantity integer NOT NULL,
  current_quantity integer NOT NULL,
  unit_price_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'in_stock'
    CHECK (status IN ('in_stock', 'empty', 'expired', 'destroyed')),
  emptied_date date,
  km_value integer,
  km_last_calculated timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Mouvements de sortie (prélèvements)
CREATE TABLE pallet_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pallet_id uuid NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  quantity integer NOT NULL,
  movement_type text NOT NULL DEFAULT 'picking'
    CHECK (movement_type IN ('picking', 'transfer', 'loss', 'return', 'adjustment')),
  performed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Paramètres Km par organisation
CREATE TABLE km_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  capital_cost_rate integer NOT NULL DEFAULT 500,
  alert_threshold_excellent integer DEFAULT 500,
  alert_threshold_good integer DEFAULT 1500,
  alert_threshold_warning integer DEFAULT 3000,
  alert_threshold_critical integer DEFAULT 10000,
  updated_at timestamptz DEFAULT now()
);

-- Index pour performances
CREATE INDEX idx_storage_zones_org ON storage_zones(organization_id);
CREATE INDEX idx_product_refs_org ON product_references(organization_id);
CREATE INDEX idx_pallets_org ON pallets(organization_id);
CREATE INDEX idx_pallets_product ON pallets(product_reference_id);
CREATE INDEX idx_pallets_zone ON pallets(storage_zone_id);
CREATE INDEX idx_pallets_status ON pallets(organization_id, status);
CREATE INDEX idx_pallet_movements_pallet ON pallet_movements(pallet_id);
CREATE INDEX idx_pallet_movements_date ON pallet_movements(movement_date);
CREATE INDEX idx_product_refs_active ON product_references(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pallets_active ON pallets(id) WHERE deleted_at IS NULL;
CREATE INDEX idx_storage_zones_active ON storage_zones(id) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE km_settings ENABLE ROW LEVEL SECURITY;

-- Policies SELECT
CREATE POLICY "tenant_select" ON storage_zones FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_select" ON product_references FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_select" ON pallets FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_select" ON pallet_movements FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_select" ON km_settings FOR SELECT USING (organization_id = get_user_org_id());

-- Policies INSERT
CREATE POLICY "tenant_insert" ON storage_zones FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_insert" ON product_references FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_insert" ON pallets FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_insert" ON pallet_movements FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_insert" ON km_settings FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- Policies UPDATE
CREATE POLICY "tenant_update" ON storage_zones FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_update" ON product_references FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_update" ON pallets FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_update" ON km_settings FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());

-- Policies DELETE
CREATE POLICY "tenant_delete" ON storage_zones FOR DELETE USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_delete" ON product_references FOR DELETE USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_delete" ON pallets FOR DELETE USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_delete" ON pallet_movements FOR DELETE USING (organization_id = get_user_org_id());

-- Triggers updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON storage_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_references FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON km_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
