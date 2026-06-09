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
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.due_date === dateStr)
  }

  const monthName = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h2 className="serif" style={{ fontSize: 28, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{monthName}</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={navBtn}>
            <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><Icons.arrow size={13} /></span>
          </button>
          <button onClick={() => setCursor(new Date())} style={{ ...navBtn, padding: '7px 14px', width: 'auto', fontSize: 12, fontWeight: 500 }}>Today</button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={navBtn}>
            <Icons.arrow size={13} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
        {DAYS.map(d => (
          <div key={d} className="eyebrow" style={{ textAlign: 'center', padding: '8px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((day, i) => {
          if (day === null) return <div key={i} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
                border: `1px solid ${isToday ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all .15s ease',
                opacity: isPast ? 0.65 : 1,
                boxShadow: isToday ? 'var(--shadow-sm)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isToday) (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
              }}
              onMouseLeave={e => {
                if (!isToday) (e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}>
              <div style={{
                fontSize: 13, fontWeight: isToday ? 600 : 500,
                color: isToday ? 'var(--accent)' : 'var(--ink2)',
                marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: isToday ? "'Instrument Serif', serif" : "inherit",
                fontSize: isToday ? 16 : 13,
              }}>
                <span>{day}</span>
                {dayTasks.length > 0 && (
                  <span className="mono" style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: 'var(--bg3)', color: 'var(--ink3)' }}>{dayTasks.length}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {dayTasks.slice(0, 3).map(t => (
                  <div key={t.id} onClick={e => { e.stopPropagation(); onClick(t) }} style={{
                    fontSize: 10.5, padding: '3px 7px', borderRadius: 5,
                    background: t.project_color ? t.project_color + '14' : 'var(--bg3)',
                    color: t.status === 'done' ? 'var(--ink4)' : 'var(--ink2)',
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    borderLeft: `2px solid ${t.project_color || 'var(--accent)'}`,
                    fontWeight: 500,
                  }}>{t.title}</div>
                ))}
                {dayTasks.length > 3 && (
                  <div style={{ fontSize: 9.5, color: 'var(--ink4)', textAlign: 'center', paddingTop: 3 }}>+{dayTasks.length - 3} more</div>
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
