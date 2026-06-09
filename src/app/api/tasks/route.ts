import { NextRequest, NextResponse } from 'next/server'
import { getDb, initSchema } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await initSchema()
    const sql = getDb()
    const projectId = req.nextUrl.searchParams.get('project_id')
    const view = req.nextUrl.searchParams.get('view')

    let rows
    if (view === 'today') {
      rows = await sql`SELECT t.*, p.color AS project_color, p.name AS project_name,
        COALESCE((SELECT json_agg(s.* ORDER BY s.position) FROM subtasks s WHERE s.task_id = t.id), '[]'::json) AS subtasks
        FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.due_date = CURRENT_DATE AND t.status != 'done'
        ORDER BY t.priority DESC, t.position`
    } else if (view === 'upcoming') {
      rows = await sql`SELECT t.*, p.color AS project_color, p.name AS project_name,
        COALESCE((SELECT json_agg(s.* ORDER BY s.position) FROM subtasks s WHERE s.task_id = t.id), '[]'::json) AS subtasks
        FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.due_date > CURRENT_DATE AND t.status != 'done'
        ORDER BY t.due_date, t.priority DESC`
    } else if (view === 'overdue') {
      rows = await sql`SELECT t.*, p.color AS project_color, p.name AS project_name,
        COALESCE((SELECT json_agg(s.* ORDER BY s.position) FROM subtasks s WHERE s.task_id = t.id), '[]'::json) AS subtasks
        FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
        ORDER BY t.due_date, t.priority DESC`
    } else if (view === 'all') {
      rows = await sql`SELECT t.*, p.color AS project_color, p.name AS project_name,
        COALESCE((SELECT json_agg(s.* ORDER BY s.position) FROM subtasks s WHERE s.task_id = t.id), '[]'::json) AS subtasks
        FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
        ORDER BY t.status, t.priority DESC, t.position`
    } else if (projectId) {
      rows = await sql`SELECT t.*, p.color AS project_color, p.name AS project_name,
        COALESCE((SELECT json_agg(s.* ORDER BY s.position) FROM subtasks s WHERE s.task_id = t.id), '[]'::json) AS subtasks
        FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.project_id = ${parseInt(projectId)}
        ORDER BY t.status, t.position, t.priority DESC`
    } else {
      rows = await sql`SELECT t.*, p.color AS project_color, p.name AS project_name,
        COALESCE((SELECT json_agg(s.* ORDER BY s.position) FROM subtasks s WHERE s.task_id = t.id), '[]'::json) AS subtasks
        FROM tasks t LEFT JOIN projects p ON p.id = t.project_id
        ORDER BY t.position, t.priority DESC`
    }
    return NextResponse.json({ tasks: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, tasks: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initSchema()
    const body = await req.json()
    const sql = getDb()
    const tagsArr = body.tags || []
    const result = await sql`
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, tags, recurring)
      VALUES (
        ${body.project_id || null},
        ${body.title},
        ${body.description || ''},
        ${body.status || 'todo'},
        ${body.priority || 'normal'},
        ${body.due_date || null},
        ${tagsArr},
        ${body.recurring || null}
      ) RETURNING *
    `
    return NextResponse.json({ task: result[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const sql = getDb()
    
    // Handle status change with recurring task logic
    if (body.status === 'done') {
      const existing = await sql`SELECT recurring, due_date FROM tasks WHERE id = ${body.id}`
      if (existing[0]?.recurring && existing[0]?.due_date) {
        const next = new Date(existing[0].due_date)
        if (existing[0].recurring === 'daily') next.setDate(next.getDate() + 1)
        else if (existing[0].recurring === 'weekly') next.setDate(next.getDate() + 7)
        else if (existing[0].recurring === 'monthly') next.setMonth(next.getMonth() + 1)
        const newDue = next.toISOString().split('T')[0]
        // Create next occurrence
        const orig = await sql`SELECT * FROM tasks WHERE id = ${body.id}`
        const o = orig[0]
        await sql`INSERT INTO tasks (project_id, title, description, status, priority, due_date, tags, recurring)
          VALUES (${o.project_id}, ${o.title}, ${o.description}, 'todo', ${o.priority}, ${newDue}, ${o.tags}, ${o.recurring})`
      }
    }
    
    const result = await sql`
      UPDATE tasks SET
        title = COALESCE(${body.title}, title),
        description = COALESCE(${body.description}, description),
        status = COALESCE(${body.status}, status),
        priority = COALESCE(${body.priority}, priority),
        due_date = COALESCE(${body.due_date}, due_date),
        project_id = COALESCE(${body.project_id}, project_id),
        tags = COALESCE(${body.tags}, tags),
        recurring = COALESCE(${body.recurring}, recurring),
        position = COALESCE(${body.position}, position),
        completed_at = CASE WHEN ${body.status} = 'done' THEN NOW() ELSE completed_at END
      WHERE id = ${body.id}
      RETURNING *
    `
    return NextResponse.json({ task: result[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.searchParams.get('id') || '0')
    const sql = getDb()
    await sql`DELETE FROM tasks WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
