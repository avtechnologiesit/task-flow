import { NextRequest, NextResponse } from 'next/server'
import { getDb, initSchema } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await initSchema()
    const sql = getDb()
    const rows = await sql`
      SELECT p.*, COALESCE(t.task_count, 0) AS task_count, COALESCE(t.done_count, 0) AS done_count
      FROM projects p
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS task_count, COUNT(*) FILTER (WHERE status='done') AS done_count
        FROM tasks GROUP BY project_id
      ) t ON t.project_id = p.id
      WHERE p.archived = FALSE
      ORDER BY p.position, p.created_at
    `
    return NextResponse.json({ projects: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, projects: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initSchema()
    const body = await req.json()
    const sql = getDb()
    const result = await sql`
      INSERT INTO projects (name, color, icon, notes)
      VALUES (${body.name}, ${body.color || '#7c3aed'}, ${body.icon || 'folder'}, ${body.notes || ''})
      RETURNING *
    `
    return NextResponse.json({ project: result[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const sql = getDb()
    const result = await sql`
      UPDATE projects SET
        name = COALESCE(${body.name}, name),
        color = COALESCE(${body.color}, color),
        icon = COALESCE(${body.icon}, icon),
        notes = COALESCE(${body.notes}, notes),
        archived = COALESCE(${body.archived}, archived)
      WHERE id = ${body.id}
      RETURNING *
    `
    return NextResponse.json({ project: result[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.searchParams.get('id') || '0')
    const sql = getDb()
    await sql`DELETE FROM projects WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
