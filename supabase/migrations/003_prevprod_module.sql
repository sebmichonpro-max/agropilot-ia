-- ============================================================
-- PREV'PROD — Prévisions de fabrication & dispatch production
-- Migration 003
-- ============================================================

-- ── Lignes de conditionnement PREV'PROD ────────────────────
CREATE TABLE prev_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  compatible_weights_grams integer[] NOT NULL DEFAULT '{}',
  max_capacity_grams integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_prev_lines_org ON prev_lines(organization_id);
CREATE INDEX idx_prev_lines_active ON prev_lines(id) WHERE deleted_at IS NULL;

-- ── Mélangeurs ─────────────────────────────────────────────
CREATE TABLE prev_mixers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity_grams integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_prev_mixers_org ON prev_mixers(organization_id);
CREATE INDEX idx_prev_mixers_active ON prev_mixers(id) WHERE deleted_at IS NULL;

-- ── Recettes (niveau agrégé — ~350 entrées) ────────────────
CREATE TABLE prev_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  brand text,
  stock_type text NOT NULL DEFAULT 'sur_commande'
    CHECK (stock_type IN ('stock_permanent', 'sur_commande', 'mixte')),
  dispatch_priority text NOT NULL DEFAULT 'journee'
    CHECK (dispatch_priority IN ('matin', 'journee', 'avance')),
  forecast_method text NOT NULL DEFAULT 'dernier_jour'
    CHECK (forecast_method IN ('dernier_jour', 'moyenne_4sem', 'moyenne_ponderee')),
  coverage_j1_pct integer NOT NULL DEFAULT 0
    CHECK (coverage_j1_pct BETWEEN 0 AND 100),
  min_batch_grams integer NOT NULL DEFAULT 30000,
  min_batch_exception boolean NOT NULL DEFAULT false,
  loss_pct numeric(4,2) NOT NULL DEFAULT 3.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_prev_recipes_org ON prev_recipes(organization_id);
CREATE INDEX idx_prev_recipes_active ON prev_recipes(id) WHERE deleted_at IS NULL;

-- ── Produits / SKU (niveau ref — ~1400-2100 entrées) ──────
CREATE TABLE prev_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  recipe_id uuid NOT NULL REFERENCES prev_recipes(id) ON DELETE CASCADE,
  weight_grams integer NOT NULL,
  format_label text NOT NULL,
  compatible_line_ids uuid[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_prev_products_org ON prev_products(organization_id);
CREATE INDEX idx_prev_products_recipe ON prev_products(recipe_id);
CREATE INDEX idx_prev_products_active ON prev_products(id) WHERE deleted_at IS NULL;

-- ── Profils clients ────────────────────────────────────────
CREATE TABLE prev_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  client_type text NOT NULL DEFAULT 'custom_order'
    CHECK (client_type IN ('stock_brand', 'custom_order')),
  brand text,
  dispatch_priority text NOT NULL DEFAULT 'journee'
    CHECK (dispatch_priority IN ('matin', 'journee', 'avance')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (organization_id, code)
);

CREATE INDEX idx_prev_clients_org ON prev_clients(organization_id);
CREATE INDEX idx_prev_clients_active ON prev_clients(id) WHERE deleted_at IS NULL;

-- ── Jours fériés ───────────────────────────────────────────
CREATE TABLE prev_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date date NOT NULL,
  label text NOT NULL,
  auto_generated boolean NOT NULL DEFAULT true,
  UNIQUE (organization_id, date)
);

CREATE INDEX idx_prev_holidays_org ON prev_holidays(organization_id);

-- ── Historique des ventes ──────────────────────────────────
CREATE TABLE prev_sales_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES prev_products(id) ON DELETE CASCADE,
  sale_date date NOT NULL,
  quantity_pieces integer NOT NULL,
  total_weight_grams integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, product_id, sale_date)
);

CREATE INDEX idx_prev_sales_org ON prev_sales_history(organization_id);
CREATE INDEX idx_prev_sales_product_date ON prev_sales_history(product_id, sale_date);

-- ── Stocks produits finis (snapshot quotidien) ─────────────
CREATE TABLE prev_stock_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES prev_products(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  stock_pieces integer NOT NULL,
  dlc date,
  lot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, product_id, snapshot_date)
);

CREATE INDEX idx_prev_stock_org ON prev_stock_snapshots(organization_id);
CREATE INDEX idx_prev_stock_product_date ON prev_stock_snapshots(product_id, snapshot_date);

-- ── Lots d'import (traçabilité) ───────────────────────────
CREATE TABLE prev_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_type text NOT NULL
    CHECK (import_type IN ('commandes', 'devis', 'stocks', 'referentiel')),
  filename text,
  source text NOT NULL DEFAULT 'csv'
    CHECK (source IN ('csv', 'manual')),
  row_count integer,
  matched_count integer,
  unmatched_count integer,
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_prev_batches_org ON prev_import_batches(organization_id);

-- ── Commandes importées ───────────────────────────────────
CREATE TABLE prev_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_batch_id uuid NOT NULL REFERENCES prev_import_batches(id) ON DELETE CASCADE,
  order_type text NOT NULL
    CHECK (order_type IN ('commande', 'devis')),
  delivery_date date NOT NULL,
  product_id uuid REFERENCES prev_products(id),
  client_id uuid REFERENCES prev_clients(id),
  product_code_raw text NOT NULL,
  product_label_raw text NOT NULL,
  quantity_pieces integer NOT NULL,
  quantity_colis integer,
  total_weight_grams integer NOT NULL,
  unit_price_gross_cents integer,
  unit_price_net_cents integer,
  probability_pct integer NOT NULL DEFAULT 100
    CHECK (probability_pct BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'en_attente'
    CHECK (status IN ('en_attente', 'confirme')),
  matched boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prev_orders_org ON prev_orders(organization_id);
CREATE INDEX idx_prev_orders_batch ON prev_orders(import_batch_id);
CREATE INDEX idx_prev_orders_date ON prev_orders(delivery_date);
CREATE INDEX idx_prev_orders_product ON prev_orders(product_id);

-- ── Plans de production quotidiens ────────────────────────
CREATE TABLE prev_daily_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'validated', 'in_progress', 'done')),
  validated_at timestamptz,
  validated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, plan_date)
);

CREATE INDEX idx_prev_plans_org ON prev_daily_plans(organization_id);
CREATE INDEX idx_prev_plans_date ON prev_daily_plans(plan_date);

-- ── Besoins nets calculés (par recette, pour un plan) ─────
CREATE TABLE prev_plan_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES prev_daily_plans(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES prev_recipes(id) ON DELETE CASCADE,
  stock_target_pieces integer,
  coverage_j1_pieces integer,
  orders_pieces integer,
  quotes_weighted_pieces integer,
  current_stock_pieces integer,
  gross_requirement_pieces integer NOT NULL,
  net_requirement_pieces integer NOT NULL,
  total_weight_grams integer NOT NULL,
  total_weight_with_loss_grams integer NOT NULL,
  below_threshold boolean NOT NULL DEFAULT false,
  threshold_forced boolean NOT NULL DEFAULT false,
  forecast_method_used text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prev_req_plan ON prev_plan_requirements(plan_id);

-- ── Dispatch par ligne (détail du plan) ───────────────────
CREATE TABLE prev_plan_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES prev_daily_plans(id) ON DELETE CASCADE,
  line_id uuid NOT NULL REFERENCES prev_lines(id) ON DELETE CASCADE,
  mixer_id uuid REFERENCES prev_mixers(id),
  recipe_id uuid NOT NULL REFERENCES prev_recipes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES prev_products(id) ON DELETE CASCADE,
  format_label text NOT NULL,
  weight_per_piece_grams integer NOT NULL,
  quantity_pieces integer NOT NULL,
  total_weight_grams integer NOT NULL,
  loss_weight_grams integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_morning_priority boolean NOT NULL DEFAULT false,
  is_rupture_priority boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prev_items_plan ON prev_plan_line_items(plan_id);
CREATE INDEX idx_prev_items_line ON prev_plan_line_items(line_id);

-- ── Modifications post-validation (diff) ──────────────────
CREATE TABLE prev_plan_modifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES prev_daily_plans(id) ON DELETE CASCADE,
  modification_type text NOT NULL
    CHECK (modification_type IN ('ajout', 'suppression', 'modification')),
  description text NOT NULL,
  source_order_id uuid REFERENCES prev_orders(id),
  impact_weight_grams integer,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'integrated', 'ignored', 'deferred')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_prev_mods_plan ON prev_plan_modifications(plan_id);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

ALTER TABLE prev_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_lines_select" ON prev_lines FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_lines_insert" ON prev_lines FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_lines_update" ON prev_lines FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_lines_delete" ON prev_lines FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_mixers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_mixers_select" ON prev_mixers FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_mixers_insert" ON prev_mixers FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_mixers_update" ON prev_mixers FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_mixers_delete" ON prev_mixers FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_recipes_select" ON prev_recipes FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_recipes_insert" ON prev_recipes FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_recipes_update" ON prev_recipes FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_recipes_delete" ON prev_recipes FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_products_select" ON prev_products FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_products_insert" ON prev_products FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_products_update" ON prev_products FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_products_delete" ON prev_products FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_clients_select" ON prev_clients FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_clients_insert" ON prev_clients FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_clients_update" ON prev_clients FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_clients_delete" ON prev_clients FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_holidays_select" ON prev_holidays FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_holidays_insert" ON prev_holidays FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_holidays_update" ON prev_holidays FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_holidays_delete" ON prev_holidays FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_sales_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_sales_select" ON prev_sales_history FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_sales_insert" ON prev_sales_history FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_sales_update" ON prev_sales_history FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_sales_delete" ON prev_sales_history FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_stock_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_stock_select" ON prev_stock_snapshots FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_stock_insert" ON prev_stock_snapshots FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_stock_update" ON prev_stock_snapshots FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_stock_delete" ON prev_stock_snapshots FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_batches_select" ON prev_import_batches FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_batches_insert" ON prev_import_batches FOR INSERT WITH CHECK (organization_id = get_user_org_id());

ALTER TABLE prev_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_orders_select" ON prev_orders FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_orders_insert" ON prev_orders FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_orders_update" ON prev_orders FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_orders_delete" ON prev_orders FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_daily_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_plans_select" ON prev_daily_plans FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "prev_plans_insert" ON prev_daily_plans FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_plans_update" ON prev_daily_plans FOR UPDATE USING (organization_id = get_user_org_id()) WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "prev_plans_delete" ON prev_daily_plans FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE prev_plan_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_req_select" ON prev_plan_requirements FOR SELECT
  USING (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));
CREATE POLICY "prev_req_insert" ON prev_plan_requirements FOR INSERT
  WITH CHECK (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));
CREATE POLICY "prev_req_delete" ON prev_plan_requirements FOR DELETE
  USING (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));

ALTER TABLE prev_plan_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_items_select" ON prev_plan_line_items FOR SELECT
  USING (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));
CREATE POLICY "prev_items_insert" ON prev_plan_line_items FOR INSERT
  WITH CHECK (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));
CREATE POLICY "prev_items_update" ON prev_plan_line_items FOR UPDATE
  USING (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()))
  WITH CHECK (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));
CREATE POLICY "prev_items_delete" ON prev_plan_line_items FOR DELETE
  USING (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));

ALTER TABLE prev_plan_modifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prev_mods_select" ON prev_plan_modifications FOR SELECT
  USING (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));
CREATE POLICY "prev_mods_insert" ON prev_plan_modifications FOR INSERT
  WITH CHECK (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));
CREATE POLICY "prev_mods_update" ON prev_plan_modifications FOR UPDATE
  USING (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()))
  WITH CHECK (plan_id IN (SELECT id FROM prev_daily_plans WHERE organization_id = get_user_org_id()));

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS — updated_at auto
-- ═══════════════════════════════════════════════════════════

CREATE TRIGGER set_prev_lines_updated BEFORE UPDATE ON prev_lines
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_prev_mixers_updated BEFORE UPDATE ON prev_mixers
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_prev_recipes_updated BEFORE UPDATE ON prev_recipes
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_prev_products_updated BEFORE UPDATE ON prev_products
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_prev_clients_updated BEFORE UPDATE ON prev_clients
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_prev_plans_updated BEFORE UPDATE ON prev_daily_plans
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_prev_items_updated BEFORE UPDATE ON prev_plan_line_items
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
