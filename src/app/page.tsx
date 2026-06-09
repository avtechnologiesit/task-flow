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

  const loadProjects = useCallback(async () => {
    const r = await fetch('/api/projects')
    const d = await r.json()
    if (d.error) setDbError(d.error)
    setProjects(d.projects || [])
  }, [])

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

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id)
      if (updated) setSelectedTask(updated)
    }
  }, [tasks])

  const createTask = async (data: any) => {
    const r = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (r.ok) { await loadTasks(); await loadProjects() }
  }
  const updateTask = async (id: number, updates: Partial<Task>) => {
    await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
    await loadTasks(); await loadProjects()
  }
  const deleteTask = async (id: number) => {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    await loadTasks(); await loadProjects(); setSelectedTask(null)
  }
  const addSubtask = async (taskId: number, title: string) => {
    await fetch('/api/subtasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: taskId, title }) })
    await loadTasks()
  }
  const toggleSubtask = async (id: number, done: boolean) => {
    await fetch('/api/subtasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, done }) })
    await loadTasks()
  }
  const deleteSubtask = async (id: number) => {
    await fetch(`/api/subtasks?id=${id}`, { method: 'DELETE' })
    await loadTasks()
  }
  const saveProject = async (data: any) => {
    if (data.id) await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    else await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    await loadProjects()
  }
  const deleteProject = async (id: number) => {
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
    await loadProjects()
    if (activeProject === id) { setActiveProject(null); setView('today') }
  }

  const filtered = useMemo(() => {
    let t = tasks
    if (search) t = t.filter(x => x.title.toLowerCase().includes(search.toLowerCase()))
    if (tagFilter) t = t.filter(x => (x.tags || []).includes(tagFilter))
    return t
  }, [tasks, search, tagFilter])

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

  // Greeting for Today view
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const todayDateLong = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative', zIndex: 1 }}>
      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? 252 : 0,
        flexShrink: 0,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
      }}>
        <div style={{ width: 252, padding: '24px 16px', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Logo - serif wordmark */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 32, padding: '0 8px' }}>
            <span className="serif" style={{ fontSize: 26, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Task<span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>flow</span>
            </span>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 24, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink4)' }}>
              <Icons.search size={13} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              style={{
                width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--card)',
                fontSize: 13, color: 'var(--ink)', outline: 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>

          {/* Smart Views */}
          <div style={{ marginBottom: 28 }}>
            <SidebarItem icon={<Icons.today />} label="Today" active={view === 'today'} onClick={() => { setView('today'); setActiveProject(null) }} count={tasks.filter(t => t.due_date === new Date().toISOString().split('T')[0] && t.status !== 'done').length} />
            <SidebarItem icon={<Icons.upcoming />} label="Upcoming" active={view === 'upcoming'} onClick={() => { setView('upcoming'); setActiveProject(null) }} />
            <SidebarItem icon={<Icons.overdue />} label="Overdue" active={view === 'overdue'} onClick={() => { setView('overdue'); setActiveProject(null) }} highlight />
            <SidebarItem icon={<Icons.all />} label="All tasks" active={view === 'all'} onClick={() => { setView('all'); setActiveProject(null) }} />
            <SidebarItem icon={<Icons.calendar />} label="Calendar" active={view === 'calendar'} onClick={() => { setView('calendar'); setActiveProject(null) }} />
          </div>

          {/* Projects */}
          <div style={{ marginBottom: 24, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 10px' }}>
              <span className="eyebrow">Projects</span>
              <button onClick={() => setEditingProject(null)} title="New project" style={{
                background: 'transparent', border: 'none', padding: 3, borderRadius: 5,
                color: 'var(--ink3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
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
                  icon={<span style={{ width: 9, height: 9, borderRadius: '50%', background: p.color, display: 'inline-block' }} />}
                  label={p.name}
                  active={view === 'project' && activeProject === p.id}
                  onClick={() => { setView('project'); setActiveProject(p.id) }}
                  count={p.task_count - p.done_count}
                />
                <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingProject(p) }} style={{
                  position: 'absolute', right: 28, top: 8, opacity: 0,
                  background: 'transparent', border: 'none', padding: 3, borderRadius: 4,
                  color: 'var(--ink4)', transition: 'opacity .15s',
                }}><Icons.edit size={11} /></button>
              </div>
            ))}
            {projects.length === 0 && (
              <button onClick={() => setEditingProject(null)} style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px dashed var(--border2)',
                background: 'transparent', color: 'var(--ink3)', fontSize: 12, marginTop: 4,
              }}>+ Create your first project</button>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="eyebrow" style={{ padding: '0 8px 10px' }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 6px' }}>
                {allTags.slice(0, 12).map(tag => (
                  <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)} style={{
                    padding: '3px 9px', borderRadius: 12, fontSize: 11,
                    border: `1px solid ${tagFilter === tag ? 'var(--accent)' : 'var(--border)'}`,
                    background: tagFilter === tag ? 'var(--accent)' : 'var(--card)',
                    color: tagFilter === tag ? '#fff' : 'var(--ink2)',
                    fontWeight: 500,
                    transition: 'all .15s',
                  }}>#{tag}</button>
                ))}
              </div>
            </div>
          )}

          {/* DB Setup */}
          {dbError && (
            <div style={{ marginTop: 'auto', padding: 13, borderRadius: 8, background: 'var(--amber-bg)', fontSize: 11, color: 'var(--amber)', lineHeight: 1.55, border: '1px solid #fde68a' }}>
              <strong style={{ fontWeight: 600 }}>Setup needed.</strong> Add a free Neon Postgres URL as <code style={{ background: '#fde68a', padding: '0 5px', borderRadius: 3, fontSize: 10 }}>DATABASE_URL</code> in Vercel env vars.
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px 44px 60px', overflowY: 'auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <button onClick={() => setSidebarOpen(s => !s)} title="Toggle sidebar" style={{
              background: 'transparent', border: 'none', padding: 6, borderRadius: 7, color: 'var(--ink3)', marginTop: 4,
            }}>
              <Icons.all size={16} />
            </button>
            <div>
              {/* Eyebrow for context */}
              {view === 'today' && (
                <div className="eyebrow" style={{ marginBottom: 6 }}>{todayDateLong}</div>
              )}
              {view !== 'today' && (
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {view === 'project' || view === 'kanban' ? 'Project' : 'View'}
                </div>
              )}
              <h1 className="serif" style={{
                fontSize: 38, fontWeight: 400, letterSpacing: '-0.025em',
                color: 'var(--ink)', lineHeight: 1.05,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {activeProjectObj && <span style={{ width: 14, height: 14, borderRadius: '50%', background: activeProjectObj.color, display: 'inline-block', flexShrink: 0 }} />}
                {view === 'today' ? <>
                  <span>{greeting},</span>
                  <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Auto</span>
                </> : viewTitle}
              </h1>
              <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 8 }}>
                {view === 'today' && filtered.length > 0 && (
                  <span>{filtered.length} task{filtered.length === 1 ? '' : 's'} on your plate today.</span>
                )}
                {view === 'today' && filtered.length === 0 && (
                  <span>Nothing scheduled. A clear day.</span>
                )}
                {view !== 'today' && (
                  <span className="mono">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>
                )}
                {tagFilter && <span> · filtered by <span style={{ color: 'var(--accent)' }}>#{tagFilter}</span> <button onClick={() => setTagFilter(null)} style={{ background: 'transparent', border: 'none', color: 'var(--ink3)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>clear</button></span>}
              </div>
            </div>
          </div>

          {/* View toggle (for project view) */}
          {(view === 'project' || view === 'kanban') && activeProject && (
            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg2)', borderRadius: 9, border: '1px solid var(--border)' }}>
              <button onClick={() => setView('project')} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: view === 'project' ? 'var(--card)' : 'transparent',
                boxShadow: view === 'project' ? 'var(--shadow-sm)' : 'none',
                color: view === 'project' ? 'var(--ink)' : 'var(--ink3)',
                fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
              }}><Icons.all size={13} /> List</button>
              <button onClick={() => setView('kanban')} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: view === 'kanban' ? 'var(--card)' : 'transparent',
                boxShadow: view === 'kanban' ? 'var(--shadow-sm)' : 'none',
                color: view === 'kanban' ? 'var(--ink)' : 'var(--ink3)',
                fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
              }}><Icons.kanban size={13} /> Board</button>
            </div>
          )}
        </div>

        {/* Project notes */}
        {(view === 'project' || view === 'kanban') && activeProjectObj?.notes && (
          <div style={{
            padding: '14px 20px', borderRadius: 10,
            background: activeProjectObj.color + '0d',
            borderLeft: `3px solid ${activeProjectObj.color}`,
            marginBottom: 20, fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.6,
            display: 'flex', alignItems: 'flex-start', gap: 11,
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
              <div style={{ marginBottom: 18 }}>
                <TaskComposer
                  projects={projects}
                  defaultProjectId={activeProject}
                  onCreate={createTask}
                />
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
                  <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 10px', animation: 'pulse 1.2s ease infinite' }} />
                  Loading
                </div>
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
      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 7, border: 'none',
      background: active ? 'var(--card)' : 'transparent',
      boxShadow: active ? 'var(--shadow-sm)' : 'none',
      color: active ? 'var(--ink)' : 'var(--ink2)',
      fontSize: 13.5, fontWeight: active ? 500 : 400, textAlign: 'left',
      transition: 'all .12s ease', marginBottom: 1,
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
      <span style={{
        display: 'inline-flex', flexShrink: 0,
        color: active ? 'var(--accent)' : (highlight ? 'var(--red)' : 'var(--ink3)'),
      }}>{icon}</span>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="mono" style={{
          fontSize: 11, padding: '1px 8px', borderRadius: 10,
          background: active ? 'var(--accent)' : 'var(--bg3)',
          color: active ? '#fff' : 'var(--ink3)',
          fontWeight: 500,
        }}>{count}</span>
      )}
    </button>
  )
}

function EmptyState({ view }: { view: ViewType }) {
  const messages: Record<string, { title: string; sub: string }> = {
    today: { title: 'Nothing for today', sub: "Your day is clear. Add a task above, or take the time back." },
    upcoming: { title: 'No upcoming tasks', sub: 'Tasks with future due dates will appear here.' },
    overdue: { title: 'Nothing overdue', sub: "You're on top of things." },
    all: { title: 'No tasks yet', sub: 'Add your first task above to get started.' },
    project: { title: 'Empty project', sub: 'Add tasks to this project above.' },
  }
  const m = messages[view] || messages.all
  return (
    <div style={{
      padding: '64px 28px', textAlign: 'center', background: 'var(--bg2)',
      borderRadius: 14, border: '1px solid var(--border)',
    }}>
      <div className="serif" style={{ fontSize: 26, color: 'var(--ink)', marginBottom: 8, letterSpacing: '-0.02em' }}>{m.title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink3)', lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>{m.sub}</div>
    </div>
  )
}
