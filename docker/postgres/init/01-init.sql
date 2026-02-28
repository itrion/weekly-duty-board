CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  time_info TEXT,
  type TEXT NOT NULL,
  required_days JSONB NOT NULL,
  icon TEXT,
  points INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS completions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO tasks (id, title, time_info, type, required_days, icon, points) VALUES
  (1, 'Resumen de deberes', 'Antes de las 16:00', 'daily', '[1,2,3,4,5]'::jsonb, 'clipboard-list', 1),
  (2, 'Estudiar / Hacer deberes', 'Antes de las 20:00', 'daily', '[1,2,3,4,5]'::jsonb, 'book-open', 1),
  (3, 'Cocina limpia y despejada', 'Antes de las 20:00', 'daily', '[1,2,3,4,5,6,0]'::jsonb, 'utensils', 1),
  (4, 'Mochila preparada', 'Antes de dormir', 'daily', '[1,2,3,4,0]'::jsonb, 'backpack', 1),
  (5, 'Escritorio ordenado', '5 min antes de dormir', 'daily', '[1,2,3,4,5,6,0]'::jsonb, 'monitor', 1),
  (6, 'Doblar y guardar ropa', 'Antes de las 18:00', 'weekly', '[1,3,0]'::jsonb, 'shirt', 2),
  (7, 'Lavadora/Secadora (Ropa oscura)', 'Antes de las 16:00', 'weekly', '[4]'::jsonb, 'washing-machine', 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('tasks_id_seq', COALESCE((SELECT MAX(id) FROM tasks), 1), true);
