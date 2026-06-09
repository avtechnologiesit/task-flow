'use client'
import { useState, useEffect } from 'react'
import { Project } from '@/types'
import { Icons } from './icons'

const COLORS = [
  '#2d6a4f', '#1d4ed8', '#0891b2', '#7c3aed', '#db2777',
  '#dc2626', '#ea580c', '#b45309', '#65a30d', '#0d9488',
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
      position: 'fixed', inset: 0, background: 'rgba(28,28,26,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20, backdropFilter: 'blur(6px)',
    }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
        width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ padding: '20px 24px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="eyebrow">{project ? 'Edit project' : 'New project'}</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: 6, borderRadius: 6, color: 'var(--ink3)' }}><Icons.x size={14} /></button>
        </div>

        <div style={{ padding: '8px 24px 20px' }}>
          <div style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Project name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website redesign"
              autoFocus className="serif"
              style={{ ...inputStyle, fontSize: 20, padding: '10px 12px', fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.02em' }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Color</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: 8, background: c, border: 'none',
                  outline: color === c ? `2px solid var(--ink)` : 'none',
                  outlineOffset: 2, cursor: 'pointer',
                  boxShadow: color === c ? '0 0 0 4px var(--card), 0 0 0 5px var(--ink)' : 'none',
                }} />
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Notes (optional)</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Quick notes about this project..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 75, lineHeight: 1.55 }} />
          </div>
        </div>

        <div style={{ padding: '13px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          {project && onDelete ? (
            <button onClick={() => { if (confirm('Delete this project and all its tasks?')) { onDelete(project.id); onClose() } }} style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--card)', color: 'var(--red)', fontSize: 12, fontWeight: 500,
            }}>Delete</button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--card)', color: 'var(--ink2)', fontSize: 12, fontWeight: 500,
            }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: name.trim() ? 'var(--accent)' : 'var(--bg3)',
              color: name.trim() ? '#fff' : 'var(--ink4)', fontSize: 12, fontWeight: 600,
            }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--card)', fontSize: 14, color: 'var(--ink)', outline: 'none',
  fontFamily: 'inherit',
}
