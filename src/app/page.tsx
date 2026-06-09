'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Task, Project, ViewType } from '@/types'
import { Icons } from '@/components/icons'
import { TaskItem } from '@/components/TaskItem'
import { TaskModal } from '@/components/TaskModal'
import { TaskComposer } from '@/components/TaskComposer'
import { KanbanBoard } from '@/components/KanbanBoard'
import { CalendarView } from '@/components/CalendarView'
import { ProjectModal } from '@/components/ProjectModal'

export default function App() {
  const [view, setView] = useState<ViewType>('today')
  const [activeProject, setActiveProject] = useState<number | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)

  // Load projects
  const loadProjects = useCallback(async () => {
    const r = await fetch('/api/projects')
    const d = await r.json()
    if (d.error) setDbError(d.error)
    setProjects(d.projects || [])
  }, [])

  // Load tasks for current view
  const loadTasks = useCallback(async () => {
    setLoading(true)
    let url = '/api/tasks?'
    if (view === 'project' && activeProject) url += `project_id=${activeProject}`
    else if (view === 'kanban' && activeProject) url += `project_id=${activeProject}`
    else if (view === 'calendar') url += 'view=all'
    else url += `view=${view}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.error) setDbError(d.error)
    setTasks(d.tasks || [])
    setLoading(false)
  }, [view, activeProject])

  useEffect(() => { loadProjects() }, [loadProjects])
  useEffect(() => { loadTasks() }, [loadTasks])

  // Reload selected task when tasks change
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id)
      if (updated) setSelectedTask(updated)
    }
  }, [tasks])

  // Task operations
  const createTask = async (data: any) => {
    const r = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (r.ok) { await loadTasks(); await loadProjects() }
  }

  const updateTask = async (id: number, updates: Partial<Task>) => {
    await fetch('/api/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    await loadTasks()
    await loadProjects()
  }

  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    await loadTasks()
    await loadProjects()
    setSelectedTask(null)
  }

  // Subtask operations
  const addSubtask = async (taskId: number, title: string) => {
    await fetch('/api/subtasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, title }),
    })
    await loadTasks()
  }
  const toggleSubtask = async (id: number, done: boolean) => {
    await fetch('/api/subtasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done }),
    })
    await loadTasks()
  }
  const deleteSubtask = async (id: number) => {
    await fetch(`/api/subtasks?id=${id}`, { method: 'DELETE' })
    await loadTasks()
  }

  // Project operations
  const saveProject = async (data: any) => {
    if (data.id) {
      await fetch('/api/projects', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    await loadProjects()
  }
  const deleteProject = async (id: number) => {
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
    await loadProjects()
    if (activeProject === id) { setActiveProject(null); setView('today') }
  }

  // Filter tasks
  const filtered = useMemo(() => {
    let t = tasks
    if (search) t = t.filter(x => x.title.toLowerCase().includes(search.toLowerCase()))
    if (tagFilter) t = t.filter(x => (x.tags || []).includes(tagFilter))
    return t
  }, [tasks, search, tagFilter])

  // Available tags
  const allTags = useMemo(() => {
    const s = new Set<string>()
    tasks.forEach(t => (t.tags || []).forEach(tag => s.add(tag)))
    return Array.from(s)
  }, [tasks])

  const activeProjectObj = projects.find(p => p.id === activeProject)
  const viewTitle = useMemo(() => {
    if (view === 'today') return 'Today'
    if (view === 'upcoming') return 'Upcoming'
    if (view === 'overdue') return 'Overdue'
    if (view === 'all') return 'All Tasks'
    if (view === 'kanban') return activeProjectObj ? activeProjectObj.name : 'Board'
    if (view === 'calendar') return 'Calendar'
    return activeProjectObj?.name || 'Tasks'
  }, [view, activeProjectObj])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? 260 : 0,
        flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        transition: 'width .2s ease', overflow: 'hidden',
      }}>
        <div style={{ width: 260, padding: '20px 16px', height: '100vh', overflowY: 'auto' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 24, padding: '0 6px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icons.check size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>TaskFlow</div>
              <div style={{ fontSize: 10, color: 'var(--ink4)', fontWeight: 500 }}>Personal</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 18, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink4)' }}>
              <Icons.search size={13} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              style={{
                width: '100%', padding: '7px 10px 7px 30px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg3)',
                fontSize: 12, color: 'var(--ink)', outline: 'none',
              }}
            />
          </div>

          {/* Smart Views */}
          <div style={{ marginBottom: 16 }}>
            <SidebarItem icon={<Icons.today />} label="Today" active={view === 'today'} onClick={() => { setView('today'); setActiveProject(null) }} count={tasks.filter(t => t.due_date === new Date().toISOString().split('T')[0] && t.status !== 'done').length} />
            <SidebarItem icon={<Icons.upcoming />} label="Upcoming" active={view === 'upcoming'} onClick={() => { setView('upcoming'); setActiveProject(null) }} />
            <SidebarItem icon={<Icons.overdue color="var(--red)" />} label="Overdue" active={view === 'overdue'} onClick={() => { setView('overdue'); setActiveProject(null) }} highlight />
            <SidebarItem icon={<Icons.all />} label="All tasks" active={view === 'all'} onClick={() => { setView('all'); setActiveProject(null) }} />
            <SidebarItem icon={<Icons.calendar />} label="Calendar" active={view === 'calendar'} onClick={() => { setView('calendar'); setActiveProject(null) }} />
          </div>

          {/* Projects */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 8px' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Projects</span>
              <button onClick={() => setEditingProject(null)} style={{
                background: 'transparent', border: 'none', padding: 2, borderRadius: 4,
                color: 'var(--ink3)',
              }}><Icons.plus size={13} /></button>
            </div>
            {projects.map(p => (
              <div key={p.id} style={{ position: 'relative' }} onMouseEnter={e => {
                const btn = e.currentTarget.querySelector('.edit-btn') as HTMLElement
                if (btn) btn.style.opacity = '1'
              }} onMouseLeave={e => {
                const btn = e.currentTarget.querySelector('.edit-btn') as HTMLElement
                if (btn) btn.style.opacity = '0'
              }}>
                <SidebarItem
                  icon={<span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />}
                  label={p.name}
                  active={view === 'project' && activeProject === p.id}
                  onClick={() => { setView('project'); setActiveProject(p.id) }}
                  count={p.task_count - p.done_count}
                />
                <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingProject(p) }} style={{
                  position: 'absolute', right: 28, top: 7, opacity: 0,
                  background: 'transparent', border: 'none', padding: 3, borderRadius: 4,
                  color: 'var(--ink4)', transition: 'opacity .15s',
                }}><Icons.edit size={11} /></button>
              </div>
            ))}
            {projects.length === 0 && (
              <button onClick={() => setEditingProject(null)} style={{
                width: '100%', padding: '8px', borderRadius: 8, border: '1px dashed var(--border2)',
                background: 'transparent', color: 'var(--ink3)', fontSize: 11,
              }}>+ Create your first project</button>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink4)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 8px 8px' }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 6px' }}>
                {allTags.slice(0, 10).map(tag => (
                  <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)} style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11,
                    border: '1px solid var(--border)',
                    background: tagFilter === tag ? 'var(--accent)' : 'var(--bg3)',
                    color: tagFilter === tag ? '#fff' : 'var(--ink2)',
                  }}>#{tag}</button>
                ))}
              </div>
            </div>
          )}

          {/* DB Setup */}
          {dbError && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'var(--amber-bg)', fontSize: 11, color: 'var(--amber)', lineHeight: 1.5 }}>
              <strong>Setup needed:</strong> Add a free Neon Postgres URL as <code style={{ background: 'rgba(0,0,0,.1)', padding: '0 4px', borderRadius: 3 }}>DATABASE_URL</code> in Vercel env vars to enable persistence.
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0, padding: '24px 28px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(s => !s)} style={{
              background: 'transparent', border: 'none', padding: 6, borderRadius: 7, color: 'var(--ink3)',
            }}>
              <Icons.all size={16} />
            </button>
            <div>
              <h1 style={{
                fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em',
                color: activeProjectObj ? activeProjectObj.color : 'var(--ink)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {activeProjectObj && <span style={{ width: 12, height: 12, borderRadius: '50%', background: activeProjectObj.color }} />}
                {viewTitle}
              </h1>
              <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
                {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
                {tagFilter && <span> · filtered by #{tagFilter} <button onClick={() => setTagFilter(null)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>clear</button></span>}
              </div>
            </div>
          </div>

          {/* View toggle (for project view) */}
          {view === 'project' && activeProject && (
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg2)', borderRadius: 8 }}>
              <button onClick={() => setView('project')} style={{
                padding: '5px 11px', borderRadius: 6, border: 'none',
                background: 'var(--card)', boxShadow: '0 1px 2px rgba(0,0,0,.06)',
                color: 'var(--ink)', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5,
              }}><Icons.all size={12} /> List</button>
              <button onClick={() => setView('kanban')} style={{
                padding: '5px 11px', borderRadius: 6, border: 'none',
                background: 'transparent', color: 'var(--ink3)', fontSize: 11, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 5,
              }}><Icons.kanban size={12} /> Board</button>
            </div>
          )}
          {view === 'kanban' && activeProject && (
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg2)', borderRadius: 8 }}>
              <button onClick={() => setView('project')} style={{
                padding: '5px 11px', borderRadius: 6, border: 'none',
                background: 'transparent', color: 'var(--ink3)', fontSize: 11, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 5,
              }}><Icons.all size={12} /> List</button>
              <button onClick={() => setView('kanban')} style={{
                padding: '5px 11px', borderRadius: 6, border: 'none',
                background: 'var(--card)', boxShadow: '0 1px 2px rgba(0,0,0,.06)',
                color: 'var(--ink)', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5,
              }}><Icons.kanban size={12} /> Board</button>
            </div>
          )}
        </div>

        {/* Project notes (when in project view) */}
        {(view === 'project' || view === 'kanban') && activeProjectObj?.notes && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, background: activeProjectObj.color + '12',
            borderLeft: `3px solid ${activeProjectObj.color}`,
            marginBottom: 16, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.55,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Icons.notes size={14} color={activeProjectObj.color} />
            <span>{activeProjectObj.notes}</span>
          </div>
        )}

        {/* Content */}
        <div>
          {view === 'kanban' ? (
            <KanbanBoard
              tasks={filtered}
              onUpdate={(id, status) => updateTask(id, { status: status as any })}
              onClick={setSelectedTask}
            />
          ) : view === 'calendar' ? (
            <CalendarView
              tasks={filtered}
              onClick={setSelectedTask}
              onCreateAtDate={async (date) => {
                const title = prompt('New task for ' + date)
                if (title?.trim()) await createTask({ title: title.trim(), due_date: date })
              }}
            />
          ) : (
            <div style={{ maxWidth: 720 }}>
              <div style={{ marginBottom: 14 }}>
                <TaskComposer
                  projects={projects}
                  defaultProjectId={activeProject}
                  onCreate={createTask}
                />
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>Loading...</div>
              ) : filtered.length === 0 ? (
                <EmptyState view={view} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filtered.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={(id, status) => updateTask(id, { status: status as any })}
                      onClick={setSelectedTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (updates) => { await updateTask(selectedTask.id, updates) }}
          onDelete={() => deleteTask(selectedTask.id)}
          onAddSubtask={async (title) => { await addSubtask(selectedTask.id, title) }}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
        />
      )}
      {editingProject !== undefined && (
        <ProjectModal
          project={editingProject}
          onClose={() => setEditingProject(undefined)}
          onSave={saveProject}
          onDelete={deleteProject}
        />
      )}
    </div>
  )
}

function SidebarItem({ icon, label, active, onClick, count, highlight }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; count?: number; highlight?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px',
      borderRadius: 7, border: 'none',
      background: active ? 'var(--accent-light)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--ink2)',
      fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left',
      transition: 'all .1s ease',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
      <span style={{ display: 'inline-flex', flexShrink: 0, color: active ? 'var(--accent)' : (highlight ? 'var(--red)' : 'var(--ink3)') }}>{icon}</span>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: 10, padding: '1px 7px', borderRadius: 10, fontFamily: "'JetBrains Mono', monospace",
          background: active ? 'var(--accent)' : 'var(--bg3)',
          color: active ? '#fff' : 'var(--ink3)',
        }}>{count}</span>
      )}
    </button>
  )
}

function EmptyState({ view }: { view: ViewType }) {
  const messages: Record<string, { icon: string; title: string; sub: string }> = {
    today: { icon: '🌤', title: 'Nothing for today', sub: "You're all caught up. Enjoy the breathing room." },
    upcoming: { icon: '📅', title: 'No upcoming tasks', sub: 'Tasks with future due dates will appear here.' },
    overdue: { icon: '✨', title: 'No overdue tasks', sub: "You're on top of things." },
    all: { icon: '📋', title: 'No tasks yet', sub: 'Add your first task to get started.' },
    project: { icon: '📁', title: 'Empty project', sub: 'Add tasks to this project above.' },
  }
  const m = messages[view] || messages.all
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg2)', borderRadius: 12, border: '1px dashed var(--border)' }}>
      <div style={{ fontSize: 38, marginBottom: 10 }}>{m.icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 5 }}>{m.title}</div>
      <div style={{ fontSize: 12, color: 'var(--ink3)' }}>{m.sub}</div>
    </div>
  )
}
