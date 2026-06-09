'use client'
import { useState, useRef, useEffect } from 'react'
import { Project } from '@/types'
import { Icons } from './icons'

interface Props {
  projects: Project[]
  defaultProjectId?: number | null
  onCreate: (task: any) => Promise<void>
}

export function TaskComposer({ projects, defaultProjectId, onCreate }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('normal')
  const [projectId, setProjectId] = useState<number | null>(defaultProjectId || null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setProjectId(defaultProjectId || null) }, [defaultProjectId])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  const submit = async () => {
    if (!title.trim()) return
    await onCreate({
      title: title.trim(),
      due_date: dueDate || null,
      priority,
      project_id: projectId,
    })
    setTitle('')
    setDueDate('')
    setPriority('normal')
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: '100%', padding: '12px 16px', borderRadius: 12,
        background: 'transparent', border: '1px dashed var(--border2)',
        color: 'var(--ink3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all .15s ease',
      }}
        onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--accent)' }}
        onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border2)'; (e.target as HTMLElement).style.color = 'var(--ink3)' }}>
        <Icons.plus size={14} />
        Add task
      </button>
    )
  }

  return (
    <div className="fade-in" style={{
      background: 'var(--card)', borderRadius: 12, border: '1px solid var(--accent)',
      padding: '14px 16px', boxShadow: '0 4px 16px rgba(0,0,0,.04)',
    }}>
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="What needs to be done?"
        style={{
          width: '100%', background: 'transparent', border: 'none', outline: 'none',
          fontSize: 15, fontWeight: 500, color: 'var(--ink)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={pillStyle} />
        <select value={priority} onChange={e => setPriority(e.target.value)} style={pillStyle}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={projectId || ''} onChange={e => setProjectId(e.target.value ? parseInt(e.target.value) : null)} style={pillStyle}>
          <option value="">Inbox</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={() => setOpen(false)} style={{
          padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--ink2)', fontSize: 12,
        }}>Cancel</button>
        <button onClick={submit} disabled={!title.trim()} style={{
          padding: '6px 16px', borderRadius: 7, border: 'none',
          background: title.trim() ? 'var(--accent)' : 'var(--bg3)',
          color: title.trim() ? '#fff' : 'var(--ink4)', fontSize: 12, fontWeight: 600,
        }}>Add task</button>
      </div>
    </div>
  )
}

const pillStyle: React.CSSProperties = {
  padding: '5px 9px', borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--bg2)', fontSize: 12, color: 'var(--ink2)', outline: 'none',
}
