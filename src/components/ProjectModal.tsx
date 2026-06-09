'use client'
import { useState, useEffect } from 'react'
import { Project } from '@/types'
import { Icons } from './icons'

const COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669', '#65a30d',
  '#ea580c', '#dc2626', '#db2777', '#9333ea', '#0d9488',
]

interface Props {
  project?: Project | null
  onClose: () => void
  onSave: (data: { id?: number; name: string; color: string; notes: string }) => Promise<void>
  onDelete?: (id: number) => Promise<void>
}

export function ProjectModal({ project, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(project?.name || '')
  const [color, setColor] = useState(project?.color || COLORS[0])
  const [notes, setNotes] = useState(project?.notes || '')

  useEffect(() => {
    if (project) {
      setName(project.name)
      setColor(project.color)
      setNotes(project.notes || '')
    }
  }, [project?.id])

  const handleSave = async () => {
    if (!name.trim()) return
    await onSave({ id: project?.id, name: name.trim(), color, notes })
    onClose()
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
        width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,.18)',
      }}>
        <div style={{ padding: '18px 22px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{project ? 'Edit project' : 'New project'}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 6, borderRadius: 6, color: 'var(--ink3)' }}><Icons.x size={14} /></button>
        </div>

        <div style={{ padding: '8px 22px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={fieldLabel}>Project name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website redesign"
              autoFocus
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={fieldLabel}>Color</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: 8, background: c, border: 'none',
                  outline: color === c ? `2px solid var(--ink)` : 'none',
                  outlineOffset: 2,
                }} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={fieldLabel}>Notes (optional)</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Quick notes about this project..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70, lineHeight: 1.5 }} />
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          {project && onDelete ? (
            <button onClick={() => { if (confirm('Delete this project and all its tasks?')) { onDelete(project.id); onClose() } }} style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--red)', fontSize: 12, fontWeight: 500,
            }}>Delete</button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--ink2)', fontSize: 12, fontWeight: 500,
            }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: name.trim() ? 'var(--accent)' : 'var(--bg3)',
              color: name.trim() ? '#fff' : 'var(--ink4)', fontSize: 12, fontWeight: 600,
            }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const fieldLabel: React.CSSProperties = {
  fontSize: 10, color: 'var(--ink4)', fontWeight: 600, letterSpacing: '.06em',
  textTransform: 'uppercase', marginBottom: 7,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg2)', fontSize: 14, color: 'var(--ink)', outline: 'none',
  fontFamily: 'inherit',
}
