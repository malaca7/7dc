-- 7dc — Painel de Gerenciamento de Bots Discord
-- Migração inicial: Estrutura de dados, restrições e políticas RLS

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS ADMINISTRATIVOS
-- Apenas usuários presentes nesta tabela têm permissão administrativa no sistema.
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'admin', 'operator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só lê seu próprio perfil de administrador se existir
CREATE POLICY "Admin pode visualizar seu perfil"
    ON public.admin_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 2. TABELA DE APLICAÇÕES DE BOTS
CREATE TABLE IF NOT EXISTS public.bot_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    discloud_app_id TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'restarting', 'unknown')),
    is_manual BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bot_applications_owner ON public.bot_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_bot_applications_discloud_id ON public.bot_applications(discloud_app_id);

ALTER TABLE public.bot_applications ENABLE ROW LEVEL SECURITY;

-- Políticas para bot_applications
CREATE POLICY "Admins podem visualizar suas aplicacoes"
    ON public.bot_applications
    FOR SELECT
    USING (
        auth.uid() = owner_id AND
        EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins podem inserir aplicacoes"
    ON public.bot_applications
    FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins podem atualizar suas aplicacoes"
    ON public.bot_applications
    FOR UPDATE
    USING (
        auth.uid() = owner_id AND
        EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins podem remover suas aplicacoes"
    ON public.bot_applications
    FOR DELETE
    USING (
        auth.uid() = owner_id AND
        EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    );

-- 3. TABELA DE CONFIGURAÇÕES DE BOTS
CREATE TABLE IF NOT EXISTS public.bot_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES public.bot_applications(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bot_settings_application_id ON public.bot_settings(application_id);

ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam configuracoes de suas aplicacoes"
    ON public.bot_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.bot_applications a
            JOIN public.admin_profiles p ON p.id = a.owner_id
            WHERE a.id = bot_settings.application_id AND a.owner_id = auth.uid()
        )
    );

-- 4. TABELA DE COMANDOS DE BOTS
CREATE TABLE IF NOT EXISTS public.bot_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES public.bot_applications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'geral',
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(application_id, name)
);

CREATE INDEX IF NOT EXISTS idx_bot_commands_application_id ON public.bot_commands(application_id);

ALTER TABLE public.bot_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam comandos de suas aplicacoes"
    ON public.bot_commands
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.bot_applications a
            JOIN public.admin_profiles p ON p.id = a.owner_id
            WHERE a.id = bot_commands.application_id AND a.owner_id = auth.uid()
        )
    );

-- 5. TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    application_id UUID REFERENCES public.bot_applications(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error', 'security')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_application ON public.audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON public.audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins visualizam logs de auditoria"
    ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins gravam logs de auditoria"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = actor_id AND
        EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
    );

-- Gatilho para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bot_applications_updated_at
    BEFORE UPDATE ON public.bot_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_bot_settings_updated_at
    BEFORE UPDATE ON public.bot_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_bot_commands_updated_at
    BEFORE UPDATE ON public.bot_commands
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
