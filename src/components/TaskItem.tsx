'use client'
import { useState } from 'react'
import { Task } from '@/types'
import { Icons } from './icons'

interface Props {
  task: Task
  onToggle: (id: number, status: string) => void
  onClick: (task: Task) => void
  onDelete: (id: number) => void
  compact?: boolean
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  urgent: { bg: 'var(--red-bg)', text: 'var(--red)' },
  high: { bg: 'var(--amber-bg)', text: 'var(--amber)' },
  normal: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  low: { bg: 'var(--bg3)', text: 'var(--ink3)' },
}

export function TaskItem({ task, onToggle, onClick, onDelete, compact }: Props) {
  const [hover, setHover] = useState(false)
  const done = task.status === 'done'
  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toISOString().split('T')[0]) && !done

  const completedSubs = (task.subtasks || []).filter(s => s.done).length
  const totalSubs = (task.subtasks || []).length

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick(task)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: compact ? '12px 16px' : '14px 18px',
        borderRadius: 11,
        background: hover ? 'var(--card)' : 'transparent',
        cursor: 'pointer',
        transition: 'all .15s cubic-bezier(.16,1,.3,1)',
        border: '1px solid transparent',
        borderColor: hover ? 'var(--border)' : 'transparent',
        boxShadow: hover ? 'var(--shadow-sm)' : 'none',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onToggle(task.id, done ? 'todo' : 'done') }}
        className={done ? 'fancy-check checked' : 'fancy-check'}
        style={{
          flexShrink: 0, width: 19, height: 19, marginTop: 1,
          border: `1.5px solid ${done ? 'var(--accent)' : task.project_color || 'var(--border2)'}`,
          background: done ? 'var(--accent)' : 'var(--card)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {done && <Icons.check size={11} color="#fff" />}
      </button>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 14, fontWeight: 500, color: done ? 'var(--ink4)' : 'var(--ink)',
            textDecoration: done ? 'line-through' : 'none', lineHeight: 1.45,
            letterSpacing: '-0.01em',
          }}>{task.title}</span>
          {task.priority !== 'normal' && task.priority !== 'low' && !done && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 11, fontWeight: 500, letterSpacing: '0.04em',
              background: PRIORITY_COLORS[task.priority].bg,
              color: PRIORITY_COLORS[task.priority].text,
              display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
            }}>
              {task.priority === 'urgent' && <Icons.flame size={10} />}
              {task.priority}
            </span>
          )}
          {task.recurring && (
            <Icons.repeat size={11} color="var(--ink4)" />
          )}
        </div>

        {/* Meta row */}
        {(task.due_date || task.project_name || (task.tags && task.tags.length > 0) || totalSubs > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--ink3)', flexWrap: 'wrap' }}>
            {task.project_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: task.project_color || 'var(--ink4)' }} />
                {task.project_name}
              </span>
            )}
            {task.due_date && (
              <span className="mono" style={{ color: isOverdue ? 'var(--red)' : 'var(--ink3)', fontWeight: isOverdue ? 500 : 400, fontSize: 11 }}>
                {formatDueDate(task.due_date)}
              </span>
            )}
            {totalSubs > 0 && (
              <span className="mono" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icons.check size={10} color="var(--ink4)" />
                {completedSubs}/{totalSubs}
              </span>
            )}
            {task.tags && task.tags.map(tag => (
              <span key={tag} style={{ padding: '2px 8px', borderRadius: 7, background: 'var(--bg2)', fontSize: 11, color: 'var(--ink3)', border: '1px solid var(--border)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hover && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          style={{
            background: 'transparent', border: 'none', padding: 7, borderRadius: 7,
            color: 'var(--ink4)', flexShrink: 0,
          }}
          title="Delete"
        >
          <Icons.trash size={14} />
        </button>
      )}
    </div>
  )
}

function formatDueDate(dateStr: string): string {
  const today = new Date(new Date().toISOString().split('T')[0])
  const d = new Date(dateStr)
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return Math.abs(diff) + 'd overdue'
  if (diff < 7) return 'In ' + diff + 'd'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
