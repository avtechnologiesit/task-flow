'use client'
import { useState } from 'react'
import { Task } from '@/types'
import { Icons } from './icons'

const COLUMNS = [
  { id: 'todo', label: 'To do', color: 'var(--blue)', bg: 'var(--blue-bg)' },
  { id: 'in_progress', label: 'In progress', color: 'var(--amber)', bg: 'var(--amber-bg)' },
  { id: 'done', label: 'Done', color: 'var(--green)', bg: 'var(--green-bg)' },
] as const

interface Props {
  tasks: Task[]
  onUpdate: (id: number, status: string) => void
  onClick: (task: Task) => void
}

export function KanbanBoard({ tasks, onUpdate, onClick }: Props) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
      minHeight: 'calc(100vh - 220px)',
    }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        return (
          <div
            key={col.id}
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.id) }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={e => {
              e.preventDefault()
              if (draggingId) onUpdate(draggingId, col.id)
              setDraggingId(null)
              setDragOverCol(null)
            }}
            style={{
              background: dragOverCol === col.id ? col.bg : 'var(--bg2)',
              borderRadius: 14, padding: 14,
              border: dragOverCol === col.id ? `1px dashed ${col.color}` : '1px solid var(--border)',
              transition: 'all .15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{col.label}</span>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--ink3)', fontFamily: "'JetBrains Mono', monospace" }}>
                {colTasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colTasks.map(task => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  dragging={draggingId === task.id}
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => onClick(task)}
                />
              ))}
              {colTasks.length === 0 && (
                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ink4)', fontSize: 11 }}>
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ task, dragging, onDragStart, onDragEnd, onClick }: { task: Task; dragging: boolean; onDragStart: () => void; onDragEnd: () => void; onClick: () => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={dragging ? 'dragging' : ''}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 12, cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,.03)',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 6 }}>{task.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 10, color: 'var(--ink3)' }}>
        {task.project_name && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.project_color || 'var(--ink4)' }} />
            {task.project_name}
          </span>
        )}
        {task.due_date && (
          <span>{formatDate(task.due_date)}</span>
        )}
        {task.priority === 'urgent' && <Icons.flame size={10} color="var(--red)" />}
        {task.priority === 'high' && <span style={{ color: 'var(--amber)' }}>High</span>}
      </div>
    </div>
  )
}

function formatDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
