'use client'
import { useState, useEffect } from 'react'
import { Task, Project, Subtask } from '@/types'
import { Icons } from './icons'

interface Props {
  task: Task | null
  projects: Project[]
  onClose: () => void
  onUpdate: (updates: Partial<Task>) => Promise<void>
  onDelete: () => void
  onAddSubtask: (title: string) => Promise<void>
  onToggleSubtask: (id: number, done: boolean) => Promise<void>
  onDeleteSubtask: (id: number) => Promise<void>
}

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#a8a59c' },
  { id: 'normal', label: 'Normal', color: '#1d4ed8' },
  { id: 'high', label: 'High', color: '#b45309' },
  { id: 'urgent', label: 'Urgent', color: '#b91c1c' },
] as const

const RECURRINGS = [
  { id: '', label: 'Never' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
] as const

export function TaskModal({ task, projects, onClose, onUpdate, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask }: Props) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [newSubtask, setNewSubtask] = useState('')
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
    }
  }, [task?.id])

  if (!task) return null

  const saveTitle = () => { if (title.trim() && title !== task.title) onUpdate({ title: title.trim() }) }
  const saveDesc = () => { if (description !== task.description) onUpdate({ description }) }

  const addSubtask = async () => {
    if (newSubtask.trim()) {
      await onAddSubtask(newSubtask.trim())
      setNewSubtask('')
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag && !task.tags?.includes(tag)) {
      onUpdate({ tags: [...(task.tags || []), tag] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    onUpdate({ tags: (task.tags || []).filter(t => t !== tag) })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(28,28,26,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20, backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
          width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow">Task</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 6, borderRadius: 6, color: 'var(--ink3)' }}><Icons.x size={16} /></button>
        </div>

        {/* Title - using serif for editorial feel */}
        <div style={{ padding: '10px 26px' }}>
          <input
            value={title} onChange={e => setTitle(e.target.value)} onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            placeholder="Task title"
            className="serif"
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontSize: 26, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          />
        </div>

        {/* Description */}
        <div style={{ padding: '0 26px 18px' }}>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)} onBlur={saveDesc}
            placeholder="Add a description..."
            rows={2}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--ink2)', resize: 'none', lineHeight: 1.65,
            }}
          />
        </div>

        {/* Properties grid */}
        <div style={{ padding: '0 26px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Project">
            <select
              value={task.project_id || ''}
              onChange={e => onUpdate({ project_id: e.target.value ? parseInt(e.target.value) : null })}
              style={selStyle}
            >
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={task.due_date || ''}
              onChange={e => onUpdate({ due_date: e.target.value || null })}
              style={selStyle}
            />
          </Field>
          <Field label="Priority">
            <div style={{ display: 'flex', gap: 4 }}>
              {PRIORITIES.map(p => (
                <button key={p.id}
                  onClick={() => onUpdate({ priority: p.id })}
                  style={{
                    flex: 1, padding: '7px 6px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                    border: `1px solid ${task.priority === p.id ? p.color : 'var(--border)'}`,
                    background: task.priority === p.id ? p.color + '14' : 'var(--card)',
                    color: task.priority === p.id ? p.color : 'var(--ink2)',
                  }}>{p.label}</button>
              ))}
            </div>
          </Field>
          <Field label="Recurring">
            <select
              value={task.recurring || ''}
              onChange={e => onUpdate({ recurring: (e.target.value || null) as any })}
              style={selStyle}
            >
              {RECURRINGS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>
        </div>

        {/* Tags */}
        <div style={{ padding: '0 26px 18px' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {(task.tags || []).map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                borderRadius: 14, background: 'var(--bg2)', fontSize: 12, color: 'var(--ink2)',
                border: '1px solid var(--border)',
              }}>
                #{tag}
                <button onClick={() => removeTag(tag)} style={{ background: 'transparent', border: 'none', color: 'var(--ink4)', padding: 0, display: 'inline-flex' }}><Icons.x size={10} /></button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Add tag..."
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, padding: '3px 4px', minWidth: 80, color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        {/* Subtasks */}
        <div style={{ padding: '0 26px 18px', borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="eyebrow">Subtasks</span>
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
                {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
              </span>
            )}
          </div>
          {(task.subtasks || []).map(sub => (
            <SubtaskRow key={sub.id} subtask={sub} onToggle={onToggleSubtask} onDelete={onDeleteSubtask} />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 4 }}>
            <Icons.plus size={14} color="var(--ink4)" />
            <input
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSubtask() }}
              placeholder="Add a subtask..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13.5, padding: '6px 0', color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 26px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onDelete} style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--card)', color: 'var(--red)', fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Icons.trash size={13} />
            Delete task
          </button>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.01em',
          }}>Done</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  )
}

function SubtaskRow({ subtask, onToggle, onDelete }: { subtask: Subtask; onToggle: (id: number, done: boolean) => void; onDelete: (id: number) => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <button onClick={() => onToggle(subtask.id, !subtask.done)}
        className={subtask.done ? 'fancy-check checked' : 'fancy-check'}
        style={{
          width: 16, height: 16, borderRadius: 4,
          border: `1.5px solid ${subtask.done ? 'var(--accent)' : 'var(--border2)'}`,
          background: subtask.done ? 'var(--accent)' : 'var(--card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
        {subtask.done && <Icons.check size={9} color="#fff" />}
      </button>
      <span style={{
        flex: 1, fontSize: 13.5, color: subtask.done ? 'var(--ink4)' : 'var(--ink2)',
        textDecoration: subtask.done ? 'line-through' : 'none',
      }}>{subtask.title}</span>
      {hover && (
        <button onClick={() => onDelete(subtask.id)} style={{ background: 'transparent', border: 'none', color: 'var(--ink4)', padding: 3, display: 'inline-flex' }}>
          <Icons.x size={12} />
        </button>
      )}
    </div>
  )
}

const selStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--card)', fontSize: 13.5, color: 'var(--ink)', outline: 'none',
}
