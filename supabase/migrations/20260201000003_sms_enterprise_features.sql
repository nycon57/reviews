-- =============================================================================
-- SMS Enterprise Features: per-LO numbers, branded domains, state quiet hours,
-- audit log, compliance reporting
-- =============================================================================

-- ── 1. Per-LO Phone Numbers ─────────────────────────────────────────────────
-- Add loan_officer_id FK to sms_phone_numbers for dedicated LO numbers
ALTER TABLE sms_phone_numbers
  ADD COLUMN IF NOT EXISTS loan_officer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for looking up an LO's assigned number
CREATE INDEX IF NOT EXISTS idx_sms_phone_numbers_lo
  ON sms_phone_numbers (loan_officer_id)
  WHERE loan_officer_id IS NOT NULL;

-- ── 2. Branded Short Domains ────────────────────────────────────────────────
-- Track custom short link domains per organization
CREATE TABLE IF NOT EXISTS sms_branded_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  cname_target TEXT NOT NULL DEFAULT 'cname.repwell.com',
  dns_verified BOOLEAN NOT NULL DEFAULT false,
  dns_verified_at TIMESTAMPTZ,
  ssl_active BOOLEAN NOT NULL DEFAULT false,
  ssl_active_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_branded_domain UNIQUE (domain)
);

-- One active domain per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_branded_domains_org_active
  ON sms_branded_domains (organization_id)
  WHERE is_active = true;

ALTER TABLE sms_branded_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their branded domains"
  ON sms_branded_domains FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage branded domains"
  ON sms_branded_domains FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- ── 3. State-Specific Quiet Hours ───────────────────────────────────────────
-- US state quiet hour overrides (more restrictive than federal 8am-9pm)
CREATE TABLE IF NOT EXISTS sms_state_quiet_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code CHAR(2) NOT NULL,
  state_name TEXT NOT NULL,
  quiet_start TIME NOT NULL,      -- e.g. '20:00' for 8 PM
  quiet_end TIME NOT NULL,        -- e.g. '08:00' for 8 AM
  notes TEXT,                      -- regulatory reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_state_quiet_hours UNIQUE (state_code)
);

-- Seed known state overrides (states with stricter rules than federal 9pm-8am)
INSERT INTO sms_state_quiet_hours (state_code, state_name, quiet_start, quiet_end, notes) VALUES
  ('OK', 'Oklahoma', '20:00', '08:00', 'Oklahoma Consumer Protection Act: 8 PM - 8 AM'),
  ('WA', 'Washington', '20:00', '08:00', 'Washington TCPA: 8 PM - 8 AM'),
  ('FL', 'Florida', '20:00', '08:00', 'Florida Telephone Solicitation Act: 8 PM - 8 AM'),
  ('CT', 'Connecticut', '21:00', '09:00', 'Connecticut: 9 PM - 9 AM'),
  ('GA', 'Georgia', '21:00', '09:00', 'Georgia Fair Business Practices Act: 9 PM - 9 AM'),
  ('LA', 'Louisiana', '21:00', '08:00', 'Louisiana TCPA: 9 PM - 8 AM'),
  ('MA', 'Massachusetts', '20:00', '08:00', 'Massachusetts: 8 PM - 8 AM'),
  ('MS', 'Mississippi', '21:00', '08:00', 'Mississippi Consumer Protection: 9 PM - 8 AM'),
  ('NY', 'New York', '21:00', '09:00', 'New York: 9 PM - 9 AM'),
  ('OR', 'Oregon', '21:00', '08:00', 'Oregon Telemarketing: 9 PM - 8 AM'),
  ('PA', 'Pennsylvania', '21:00', '09:00', 'Pennsylvania: 9 PM - 9 AM'),
  ('RI', 'Rhode Island', '21:00', '09:00', 'Rhode Island: 9 PM - 9 AM'),
  ('TX', 'Texas', '21:00', '08:00', 'Texas Business & Commerce Code: 9 PM - 8 AM'),
  ('VA', 'Virginia', '21:00', '08:00', 'Virginia Telephone Privacy Protection Act: 9 PM - 8 AM'),
  ('WI', 'Wisconsin', '21:00', '08:00', 'Wisconsin: 9 PM - 8 AM')
ON CONFLICT (state_code) DO NOTHING;

-- ── 4. SMS Compliance Audit Log ─────────────────────────────────────────────
-- Immutable, append-only log of all compliance-relevant events
CREATE TYPE sms_audit_event_type AS ENUM (
  'consent_granted',
  'consent_revoked',
  'message_sent',
  'message_failed',
  'message_queued',
  'opt_out_received',
  'keyword_response',
  'quiet_hours_blocked',
  'rate_limited',
  'credit_deducted',
  'number_assigned',
  'number_unassigned',
  'domain_verified',
  'settings_changed',
  'export_generated'
);

CREATE TABLE IF NOT EXISTS sms_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type sms_audit_event_type NOT NULL,
  phone_number TEXT,                -- E.164, nullable for non-phone events
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,                 -- Denormalized for long-term readability
  loan_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message_id UUID,                  -- FK to sms_messages if applicable
  details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No UPDATE or DELETE policies - append only
-- Partition hint: consider range partitioning by created_at for archival

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sms_audit_log_org_created
  ON sms_audit_log (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_audit_log_event_type
  ON sms_audit_log (organization_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_audit_log_phone
  ON sms_audit_log (organization_id, phone_number, created_at DESC)
  WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sms_audit_log_lo
  ON sms_audit_log (organization_id, loan_officer_id, created_at DESC)
  WHERE loan_officer_id IS NOT NULL;

-- 5-year retention: rows older than 2 years flagged for cold storage
-- (Application-level archival; no auto-delete)
CREATE INDEX IF NOT EXISTS idx_sms_audit_log_archival
  ON sms_audit_log (created_at)
  WHERE created_at < now() - INTERVAL '2 years';

ALTER TABLE sms_audit_log ENABLE ROW LEVEL SECURITY;

-- Read-only for org members
CREATE POLICY "Org members can view audit log"
  ON sms_audit_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Insert only via service role (no direct user inserts via RLS)
-- The admin client bypasses RLS for inserts

-- Explicitly revoke UPDATE and DELETE from authenticated users
-- (service role still bypasses RLS, but this adds defense in depth)
REVOKE UPDATE, DELETE ON sms_audit_log FROM authenticated;

-- ── 5. Area Code to State Mapping ───────────────────────────────────────────
-- Used for state quiet hours lookup by recipient phone number
CREATE TABLE IF NOT EXISTS area_code_states (
  area_code CHAR(3) PRIMARY KEY,
  state_code CHAR(2) NOT NULL
);

-- Seed area code → state mapping (comprehensive US coverage)
INSERT INTO area_code_states (area_code, state_code) VALUES
  -- Alabama
  ('205','AL'),('251','AL'),('256','AL'),('334','AL'),('659','AL'),('938','AL'),
  -- Alaska
  ('907','AK'),
  -- Arizona
  ('480','AZ'),('520','AZ'),('602','AZ'),('623','AZ'),('928','AZ'),
  -- Arkansas
  ('479','AR'),('501','AR'),('870','AR'),
  -- California
  ('209','CA'),('213','CA'),('310','CA'),('323','CA'),('341','CA'),('408','CA'),
  ('415','CA'),('424','CA'),('442','CA'),('510','CA'),('530','CA'),('559','CA'),
  ('562','CA'),('619','CA'),('626','CA'),('628','CA'),('650','CA'),('657','CA'),
  ('661','CA'),('669','CA'),('707','CA'),('714','CA'),('747','CA'),('760','CA'),
  ('805','CA'),('818','CA'),('820','CA'),('831','CA'),('858','CA'),('909','CA'),
  ('916','CA'),('925','CA'),('949','CA'),('951','CA'),
  -- Colorado
  ('303','CO'),('719','CO'),('720','CO'),('970','CO'),
  -- Connecticut
  ('203','CT'),('475','CT'),('860','CT'),('959','CT'),
  -- Delaware
  ('302','DE'),
  -- Florida
  ('239','FL'),('305','FL'),('321','FL'),('352','FL'),('386','FL'),('407','FL'),
  ('561','FL'),('689','FL'),('727','FL'),('754','FL'),('772','FL'),('786','FL'),
  ('813','FL'),('850','FL'),('863','FL'),('904','FL'),('941','FL'),('954','FL'),
  -- Georgia
  ('229','GA'),('404','GA'),('470','GA'),('478','GA'),('678','GA'),('706','GA'),
  ('762','GA'),('770','GA'),('912','GA'),('943','GA'),
  -- Hawaii
  ('808','HI'),
  -- Idaho
  ('208','ID'),('986','ID'),
  -- Illinois
  ('217','IL'),('224','IL'),('309','IL'),('312','IL'),('331','IL'),('447','IL'),
  ('464','IL'),('618','IL'),('630','IL'),('708','IL'),('773','IL'),('779','IL'),
  ('815','IL'),('847','IL'),('872','IL'),
  -- Indiana
  ('219','IN'),('260','IN'),('317','IN'),('463','IN'),('574','IN'),('765','IN'),
  ('812','IN'),('930','IN'),
  -- Iowa
  ('319','IA'),('515','IA'),('563','IA'),('641','IA'),('712','IA'),
  -- Kansas
  ('316','KS'),('620','KS'),('785','KS'),('913','KS'),
  -- Kentucky
  ('270','KY'),('364','KY'),('502','KY'),('606','KY'),('859','KY'),
  -- Louisiana
  ('225','LA'),('318','LA'),('337','LA'),('504','LA'),('985','LA'),
  -- Maine
  ('207','ME'),
  -- Maryland
  ('240','MD'),('301','MD'),('410','MD'),('443','MD'),('667','MD'),
  -- Massachusetts
  ('339','MA'),('351','MA'),('413','MA'),('508','MA'),('617','MA'),('774','MA'),
  ('781','MA'),('857','MA'),('978','MA'),
  -- Michigan
  ('231','MI'),('248','MI'),('269','MI'),('313','MI'),('517','MI'),('586','MI'),
  ('616','MI'),('734','MI'),('810','MI'),('906','MI'),('947','MI'),('989','MI'),
  -- Minnesota
  ('218','MN'),('320','MN'),('507','MN'),('612','MN'),('651','MN'),('763','MN'),
  ('952','MN'),
  -- Mississippi
  ('228','MS'),('601','MS'),('662','MS'),('769','MS'),
  -- Missouri
  ('314','MO'),('417','MO'),('573','MO'),('636','MO'),('660','MO'),('816','MO'),
  -- Montana
  ('406','MT'),
  -- Nebraska
  ('308','NE'),('402','NE'),('531','NE'),
  -- Nevada
  ('702','NV'),('725','NV'),('775','NV'),
  -- New Hampshire
  ('603','NH'),
  -- New Jersey
  ('201','NJ'),('551','NJ'),('609','NJ'),('640','NJ'),('732','NJ'),('848','NJ'),
  ('856','NJ'),('862','NJ'),('908','NJ'),('973','NJ'),
  -- New Mexico
  ('505','NM'),('575','NM'),
  -- New York
  ('212','NY'),('315','NY'),('332','NY'),('347','NY'),('516','NY'),('518','NY'),
  ('585','NY'),('607','NY'),('631','NY'),('646','NY'),('680','NY'),('716','NY'),
  ('718','NY'),('838','NY'),('845','NY'),('914','NY'),('917','NY'),('929','NY'),
  ('934','NY'),
  -- North Carolina
  ('252','NC'),('336','NC'),('704','NC'),('743','NC'),('828','NC'),('910','NC'),
  ('919','NC'),('980','NC'),('984','NC'),
  -- North Dakota
  ('701','ND'),
  -- Ohio
  ('216','OH'),('220','OH'),('234','OH'),('283','OH'),('326','OH'),('330','OH'),
  ('380','OH'),('419','OH'),('440','OH'),('513','OH'),('567','OH'),('614','OH'),
  ('740','OH'),('937','OH'),
  -- Oklahoma
  ('405','OK'),('539','OK'),('572','OK'),('580','OK'),('918','OK'),
  -- Oregon
  ('458','OR'),('503','OR'),('541','OR'),('971','OR'),
  -- Pennsylvania
  ('215','PA'),('223','PA'),('267','PA'),('272','PA'),('412','PA'),('445','PA'),
  ('448','PA'),('484','PA'),('570','PA'),('610','PA'),('717','PA'),('724','PA'),
  ('814','PA'),('835','PA'),('878','PA'),
  -- Rhode Island
  ('401','RI'),
  -- South Carolina
  ('803','SC'),('839','SC'),('843','SC'),('854','SC'),('864','SC'),
  -- South Dakota
  ('605','SD'),
  -- Tennessee
  ('423','TN'),('615','TN'),('629','TN'),('731','TN'),('865','TN'),('901','TN'),
  ('931','TN'),
  -- Texas
  ('210','TX'),('214','TX'),('254','TX'),('281','TX'),('325','TX'),('327','TX'),
  ('346','TX'),('361','TX'),('409','TX'),('430','TX'),('432','TX'),('469','TX'),
  ('512','TX'),('682','TX'),('713','TX'),('726','TX'),('737','TX'),('806','TX'),
  ('817','TX'),('830','TX'),('832','TX'),('903','TX'),('915','TX'),('936','TX'),
  ('940','TX'),('945','TX'),('956','TX'),('972','TX'),('979','TX'),
  -- Utah
  ('385','UT'),('435','UT'),('801','UT'),
  -- Vermont
  ('802','VT'),
  -- Virginia
  ('276','VA'),('434','VA'),('540','VA'),('571','VA'),('703','VA'),('757','VA'),
  ('804','VA'),('840','VA'),
  -- Washington
  ('253','WA'),('360','WA'),('425','WA'),('509','WA'),('564','WA'),
  -- West Virginia
  ('304','WV'),('681','WV'),
  -- Wisconsin
  ('262','WI'),('414','WI'),('534','WI'),('608','WI'),('715','WI'),('920','WI'),
  -- Wyoming
  ('307','WY'),
  -- DC
  ('202','DC')
ON CONFLICT (area_code) DO NOTHING;
