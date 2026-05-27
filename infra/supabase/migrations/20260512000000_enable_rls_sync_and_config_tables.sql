-- Enable RLS on tables added after the initial schema migration

ALTER TABLE public.crm_payables_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultoras            ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all_crm_payables_sync_jobs ON public.crm_payables_sync_jobs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY service_role_all_crm_sync_jobs ON public.crm_sync_jobs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY service_role_all_gym_settings ON public.gym_settings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY service_role_all_consultoras ON public.consultoras
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
