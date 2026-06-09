import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sql = getDb()
    const result = await sql`
      INSERT INTO subtasks (task_id, title, position)
      VALUES (${body.task_id}, ${body.title}, ${body.position || 0})
      RETURNING *
    `
    return NextResponse.json({ subtask: result[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const sql = getDb()
    const result = await sql`
      UPDATE subtasks SET
        title = COALESCE(${body.title}, title),
        done = COALESCE(${body.done}, done)
      WHERE id = ${body.id}
      RETURNING *
    `
    return NextResponse.json({ subtask: result[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = parseInt(req.nextUrl.searchParams.get('id') || '0')
    const sql = getDb()
    await sql`DELETE FROM subtasks WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
