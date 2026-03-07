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

CREATE TABLE IF NOT EXISTS kids (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, kid_id)
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

INSERT INTO kids (id, name, active)
VALUES (1, 'Principal', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO task_assignments (task_id, kid_id)
SELECT t.id, 1
FROM tasks t
LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.kid_id = 1
WHERE ta.id IS NULL;

SELECT setval('kids_id_seq', COALESCE((SELECT MAX(id) FROM kids), 1), true);
