-- Student base monthly goal (displayed on the Base de alunos overview card)
insert into public.kpi_definitions (code, label, unit, category)
values
  ('base_students_goal', 'Meta de base de alunos', 'count', 'overview')
on conflict (code) do update
set
  label      = excluded.label,
  unit       = excluded.unit,
  category   = excluded.category,
  updated_at = now();
