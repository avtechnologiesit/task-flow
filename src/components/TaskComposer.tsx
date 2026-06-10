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
        width: '100%', padding: '14px 18px', borderRadius: 12,
        background: 'var(--card)', border: '1px solid var(--border)',
        color: 'var(--ink3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 9,
        transition: 'all .15s cubic-bezier(.16,1,.3,1)',
        boxShadow: 'var(--shadow-sm)',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink3)' }}>
        <Icons.plus size={14} />
        Add task
      </button>
    )
  }

  return (
    <div className="fade-in" style={{
      background: 'var(--card)', borderRadius: 12, border: '1px solid var(--accent)',
      padding: '16px 18px', boxShadow: 'var(--shadow)',
    }}>
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="What needs to be done?"
        style={{
          width: '100%', background: 'transparent', border: 'none', outline: 'none',
          fontSize: 15, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
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
          padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--ink2)', fontSize: 12, fontWeight: 500,
        }}>Cancel</button>
        <button onClick={submit} disabled={!title.trim()} style={{
          padding: '6px 18px', borderRadius: 8, border: 'none',
          background: title.trim() ? 'var(--accent)' : 'var(--bg3)',
          color: title.trim() ? '#fff' : 'var(--ink4)', fontSize: 12, fontWeight: 600,
          letterSpacing: '0.01em',
        }}>Add task</button>
      </div>
    </div>
  )
}

const pillStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg2)', fontSize: 12, color: 'var(--ink2)', outline: 'none',
}
