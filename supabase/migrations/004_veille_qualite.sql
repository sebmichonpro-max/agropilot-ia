-- VEILLE QUALITÉ — Module de veille réglementaire et qualité agroalimentaire
-- Tables: veille_reports (résultats de scan), veille_searches (recherches libres)

-- Rapports de veille (résultats des scanners)
CREATE TABLE veille_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scanner_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_veille_reports_org ON veille_reports(organization_id);
CREATE INDEX idx_veille_reports_scanner ON veille_reports(organization_id, scanner_id);
CREATE INDEX idx_veille_reports_date ON veille_reports(created_at DESC);

-- Recherches libres
CREATE TABLE veille_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
CREATE INDEX idx_veille_searches_org ON veille_searches(organization_id);
CREATE INDEX idx_veille_searches_date ON veille_searches(created_at DESC);

-- RLS
ALTER TABLE veille_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select" ON veille_reports FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_insert" ON veille_reports FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_delete" ON veille_reports FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE veille_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select" ON veille_searches FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "tenant_insert" ON veille_searches FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "tenant_delete" ON veille_searches FOR DELETE USING (organization_id = get_user_org_id());
