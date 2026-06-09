import { neon } from '@neondatabase/serverless'

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not set')
  return neon(url)
}

export async function initSchema() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#7c3aed',
      icon TEXT DEFAULT 'folder',
      notes TEXT DEFAULT '',
      position INT DEFAULT 0,
      archived BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INT REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT DEFAULT 'normal',
      due_date DATE,
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      position INT DEFAULT 0,
      completed_at TIMESTAMPTZ,
      recurring TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS subtasks (
      id SERIAL PRIMARY KEY,
      task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      position INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}
