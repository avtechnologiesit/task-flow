'use client'
import { useState } from 'react'
import { Task } from '@/types'
import { Icons } from './icons'

interface Props {
  tasks: Task[]
  onClick: (task: Task) => void
  onCreateAtDate: (date: string) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView({ tasks, onClick, onCreateAtDate }: Props) {
  const [cursor, setCursor] = useState(new Date())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)

  const getTasksForDay = (day: number) => {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0')
    return tasks.filter(t => t.due_date === dateStr)
  }

  const monthName = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, color: 'var(--ink)' }}>{monthName}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={navBtn}>
            <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><Icons.arrow size={14} /></span>
          </button>
          <button onClick={() => setCursor(new Date())} style={{ ...navBtn, padding: '6px 14px', width: 'auto', fontSize: 12, fontWeight: 500 }}>Today</button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={navBtn}>
            <Icons.arrow size={14} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 10 }}>
        {DAYS.map(d => (
          <div key={d} className="eyebrow" style={{ textAlign: 'center', padding: '6px 0' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {days.map((day, i) => {
          if (day === null) return <div key={i} />
          const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0')
          const cellDate = new Date(year, month, day)
          const dayTasks = getTasksForDay(day)
          const isToday = cellDate.getTime() === today.getTime()
          const isPast = cellDate < today

          return (
            <div key={i}
              onClick={() => onCreateAtDate(dateStr)}
              style={{
                minHeight: 118, padding: 11, borderRadius: 10,
                background: isToday ? 'var(--accent-light)' : 'var(--card)',
                border: isToday ? '1px solid var(--accent)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all .15s cubic-bezier(.16,1,.3,1)',
                opacity: isPast && !isToday ? 0.72 : 1,
                boxShadow: isToday ? 'var(--shadow)' : 'none',
              }}>
              <div style={{
                fontSize: 13,
                fontFamily: isToday ? "'Instrument Serif', serif" : "'Inter', sans-serif",
                fontWeight: isToday ? 400 : 500,
                fontStyle: isToday ? 'italic' : 'normal',
                color: isToday ? 'var(--accent)' : (isPast ? 'var(--ink4)' : 'var(--ink)'),
                marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: isToday ? 18 : 13 }}>{day}</span>
                {dayTasks.length > 0 && (
                  <span className="mono" style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: isToday ? 'var(--accent)' : 'var(--bg3)', color: isToday ? '#fff' : 'var(--ink3)' }}>{dayTasks.length}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t.id} onClick={e => { e.stopPropagation(); onClick(t) }} style={{
                    fontSize: 10, padding: '3px 7px', borderRadius: 5,
                    background: t.project_color ? t.project_color + '15' : 'var(--bg2)',
                    color: t.status === 'done' ? 'var(--ink4)' : 'var(--ink2)',
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    borderLeft: '2px solid ' + (t.project_color || 'var(--accent)'),
                  }}>{t.title}</div>
                ))}
                {dayTasks.length > 3 && (
                  <div style={{ fontSize: 9, color: 'var(--ink4)', textAlign: 'center', paddingTop: 2 }}>+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--card)', color: 'var(--ink2)', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  boxShadow: 'var(--shadow-sm)',
}
