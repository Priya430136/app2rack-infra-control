-- Full schema migration for App2Rack
-- Replaces Supabase migrations and handles standalone Express backend

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE public.incident_severity AS ENUM ('Critical', 'High', 'Medium', 'Low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.incident_status AS ENUM ('Open', 'Investigating', 'Resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.server_status AS ENUM ('healthy', 'warning', 'critical', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.app_env AS ENUM ('Production', 'UAT', 'Dev');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.criticality AS ENUM ('Critical', 'High', 'Medium', 'Low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.dataset_kind AS ENUM ('csv', 'xlsx', 'json');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.dataset_status AS ENUM ('pending', 'imported', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.calculator_kind AS ENUM ('storage', 'rack', 'cloud');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLES

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Racks
CREATE TABLE IF NOT EXISTS public.racks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dc TEXT NOT NULL,
    capacity_u INTEGER NOT NULL DEFAULT 42,
    temperature_c NUMERIC(5,2) NOT NULL DEFAULT 22,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Servers
CREATE TABLE IF NOT EXISTS public.servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hostname TEXT,
    ip TEXT,
    os TEXT,
    cpu INTEGER NOT NULL DEFAULT 0,
    ram INTEGER NOT NULL DEFAULT 0,
    storage INTEGER NOT NULL DEFAULT 0,
    status public.server_status NOT NULL DEFAULT 'healthy',
    rack_id UUID REFERENCES public.racks(id) ON DELETE SET NULL,
    slot INTEGER,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner TEXT,
    env public.app_env NOT NULL DEFAULT 'Production',
    criticality public.criticality NOT NULL DEFAULT 'Medium',
    deployment TEXT,
    server_id UUID REFERENCES public.servers(id) ON DELETE SET NULL,
    status public.server_status NOT NULL DEFAULT 'healthy',
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incidents
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity public.incident_severity NOT NULL DEFAULT 'Medium',
    status public.incident_status NOT NULL DEFAULT 'Open',
    server_id TEXT NOT NULL,
    downtime_min INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Metrics
CREATE TABLE IF NOT EXISTS public.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cpu INTEGER,
    ram INTEGER,
    network INTEGER,
    storage INTEGER
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary JSONB,
    file_url TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploaded Datasets
CREATE TABLE IF NOT EXISTS public.uploaded_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    kind public.dataset_kind NOT NULL,
    target_entity TEXT NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0,
    imported_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    status public.dataset_status NOT NULL DEFAULT 'pending',
    mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    preview JSONB,
    errors JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calculator History
CREATE TABLE IF NOT EXISTS public.calculator_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kind public.calculator_kind NOT NULL,
    label TEXT,
    inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RCA Analyses
CREATE TABLE IF NOT EXISTS public.rca_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    incident_id UUID,
    server_id UUID,
    title TEXT NOT NULL,
    severity TEXT,
    confidence INTEGER NOT NULL DEFAULT 0,
    risk_level TEXT,
    model TEXT,
    source TEXT NOT NULL DEFAULT 'ai',
    report JSONB NOT NULL DEFAULT '{}'::jsonb,
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log Analyses
CREATE TABLE IF NOT EXISTS public.log_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Log Analysis',
    source TEXT NOT NULL DEFAULT 'paste',
    filename TEXT,
    log_size INTEGER NOT NULL DEFAULT 0,
    line_count INTEGER NOT NULL DEFAULT 0,
    severity TEXT,
    confidence INTEGER NOT NULL DEFAULT 0,
    risk_level TEXT,
    model TEXT NOT NULL DEFAULT 'rule-based-fallback',
    source_type TEXT NOT NULL DEFAULT 'fallback',
    summary TEXT,
    report JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optimization Analyses
CREATE TABLE IF NOT EXISTS public.optimization_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Infrastructure Analysis',
    optimization_score INT,
    health_score INT,
    cost_efficiency INT,
    performance_score INT,
    reliability_score INT,
    security_score INT,
    scalability_score INT,
    power_efficiency INT,
    cooling_efficiency INT,
    estimated_savings_monthly NUMERIC,
    summary TEXT,
    model TEXT,
    source_type TEXT,
    report JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Plans
CREATE TABLE IF NOT EXISTS public.plans (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly NUMERIC NOT NULL DEFAULT 0,
    price_yearly NUMERIC NOT NULL DEFAULT 0,
    monthly_credits INTEGER NOT NULL DEFAULT 0,
    max_servers INTEGER,
    max_racks INTEGER,
    max_applications INTEGER,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit Packages
CREATE TABLE IF NOT EXISTS public.credit_packages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL REFERENCES public.plans(code) DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit Wallets
CREATE TABLE IF NOT EXISTS public.credit_wallets (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    monthly_allowance INTEGER NOT NULL DEFAULT 20,
    last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    balance_after INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feature Usage
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    credits_cost INTEGER NOT NULL DEFAULT 0,
    response_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'succeeded',
    provider TEXT NOT NULL DEFAULT 'mock',
    kind TEXT NOT NULL,
    external_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'paid',
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS racks_user_idx ON public.racks(user_id);
CREATE INDEX IF NOT EXISTS servers_user_idx ON public.servers(user_id);
CREATE INDEX IF NOT EXISTS servers_rack_idx ON public.servers(rack_id);
CREATE INDEX IF NOT EXISTS applications_user_idx ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS metrics_user_time_idx ON public.metrics(user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS metrics_server_idx ON public.metrics(server_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS reports_user_idx ON public.reports(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS datasets_user_idx ON public.uploaded_datasets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS calc_user_idx ON public.calculator_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rca_analyses_incident_idx ON public.rca_analyses(incident_id);
CREATE INDEX IF NOT EXISTS rca_analyses_user_created_idx ON public.rca_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS log_analyses_user_created_idx ON public.log_analyses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_analyses_user_created ON public.optimization_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 5. TRIGGERS
DO $$ BEGIN
    CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER racks_touch BEFORE UPDATE ON public.racks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER servers_touch BEFORE UPDATE ON public.servers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER applications_touch BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER incidents_touch BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER datasets_touch BEFORE UPDATE ON public.uploaded_datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER rca_analyses_updated_at BEFORE UPDATE ON public.rca_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER log_analyses_updated_at BEFORE UPDATE ON public.log_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER credit_wallets_touch BEFORE UPDATE ON public.credit_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. INITIAL DATA
INSERT INTO public.plans(code,name,price_monthly,price_yearly,monthly_credits,max_servers,max_racks,max_applications,features,is_popular,sort_order) VALUES
('free','Free',0,0,20,10,3,5,'["dashboard","ai_chat","basic_reports","community_support"]'::jsonb,false,1),
('pro','Pro',19,182,1000,NULL,NULL,NULL,'["unlimited_infra","log_analyzer","rca","optimization_advisor","ai_reports","pdf_export","email_notifications","priority_support"]'::jsonb,true,2),
('business','Business',79,758,5000,NULL,NULL,NULL,'["multi_team","rbac","audit_logs","api_access","webhooks","advanced_analytics","unlimited_reports","custom_dashboards","unlimited_chat"]'::jsonb,false,3),
('enterprise','Enterprise',0,0,-1,NULL,NULL,NULL,'["unlimited_everything","unlimited_credits","dedicated_models","sso","white_label","dedicated_infra","sla","csm","on_prem"]'::jsonb,false,4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.credit_packages(code,name,credits,price,sort_order) VALUES
('starter','Starter',100,9,1),
('professional','Professional',500,39,2),
('business','Business',1000,69,3),
('enterprise','Enterprise',5000,299,4)
ON CONFLICT (code) DO NOTHING;
