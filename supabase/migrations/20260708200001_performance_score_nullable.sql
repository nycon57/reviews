-- Honesty fix: performance was never measured (the old code persisted a
-- fabricated constant 75, then a derived mean as a NOT-NULL workaround).
-- Make the column nullable so unmeasured stays NULL until a real
-- Lighthouse/CWV measurement pipeline exists.

alter table public.website_seo_audits
  alter column performance_score drop not null;

notify pgrst, 'reload schema';
