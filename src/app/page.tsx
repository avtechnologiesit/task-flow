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
    if (data.id) {
      await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    } else {
      await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
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
  const viewMeta = useMemo(() => {
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    if (view === 'today') return { title: 'Today', eyebrow: dateStr, sub: 'A calm space for what matters now.' }
    if (view === 'upcoming') return { title: 'Upcoming', eyebrow: 'Looking ahead', sub: 'Future tasks, ordered by date.' }
    if (view === 'overdue') return { title: 'Overdue', eyebrow: 'Needs attention', sub: 'Tasks that slipped past their date.' }
    if (view === 'all') return { title: 'All tasks', eyebrow: 'Complete library', sub: 'Every task across every project.' }
    if (view === 'kanban') return { title: activeProjectObj?.name || 'Board', eyebrow: 'Project board', sub: 'Drag cards across columns.' }
    if (view === 'calendar') return { title: 'Calendar', eyebrow: 'Month view', sub: 'See your work laid out in time.' }
    return { title: activeProjectObj?.name || 'Project', eyebrow: 'Project', sub: activeProjectObj?.notes || '' }
  }, [view, activeProjectObj])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? 264 : 0, flexShrink: 0,
        background: 'var(--bg)', borderRight: '1px solid var(--border)',
        transition: 'width .25s cubic-bezier(.16,1,.3,1)', overflow: 'hidden',
      }}>
        <div style={{ width: 264, padding: '24px 18px', height: '100vh', overflowY: 'auto' }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 28, padding: '0 6px' }}>
            <span className="serif" style={{ fontSize: 28, color: 'var(--ink)' }}>Task</span>
            <span className="serif" style={{ fontSize: 28, color: 'var(--accent)', fontStyle: 'italic' }}>flow</span>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 22, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink4)', pointerEvents: 'none' }}>
              <Icons.search size={13} />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks"
              style={{
                width: '100%', padding: '8px 11px 8px 32px', borderRadius: 9,
                border: '1px solid var(--border)', background: 'var(--card)',
                fontSize: 13, color: 'var(--ink)', outline: 'none',
              }} />
          </div>

          {/* Smart Views */}
          <div style={{ marginBottom: 22 }}>
            <SidebarItem icon={<Icons.today />} label="Today" active={view === 'today'} onClick={() => { setView('today'); setActiveProject(null) }} count={tasks.filter(t => t.due_date === new Date().toISOString().split('T')[0] && t.status !== 'done').length} />
            <SidebarItem icon={<Icons.upcoming />} label="Upcoming" active={view === 'upcoming'} onClick={() => { setView('upcoming'); setActiveProject(null) }} />
            <SidebarItem icon={<Icons.overdue color="var(--red)" />} label="Overdue" active={view === 'overdue'} onClick={() => { setView('overdue'); setActiveProject(null) }} highlight />
            <SidebarItem icon={<Icons.all />} label="All tasks" active={view === 'all'} onClick={() => { setView('all'); setActiveProject(null) }} />
            <SidebarItem icon={<Icons.calendar />} label="Calendar" active={view === 'calendar'} onClick={() => { setView('calendar'); setActiveProject(null) }} />
          </div>

          {/* Projects */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 10px' }}>
              <span className="eyebrow">Projects</span>
              <button onClick={() => setEditingProject(null)} style={{
                background: 'transparent', border: 'none', padding: 3, borderRadius: 5,
                color: 'var(--ink3)', display: 'inline-flex',
              }} title="Add project"><Icons.plus size={13} /></button>
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
                  position: 'absolute', right: 32, top: 8, opacity: 0,
                  background: 'transparent', border: 'none', padding: 3, borderRadius: 4,
                  color: 'var(--ink4)', transition: 'opacity .15s',
                }}><Icons.edit size={11} /></button>
              </div>
            ))}
            {projects.length === 0 && (
              <button onClick={() => setEditingProject(null)} style={{
                width: '100%', padding: '9px', borderRadius: 8, border: '1px dashed var(--border2)',
                background: 'transparent', color: 'var(--ink3)', fontSize: 11,
              }}>+ Create your first project</button>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <div className="eyebrow" style={{ padding: '0 8px 8px' }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 6px' }}>
                {allTags.slice(0, 12).map(tag => (
                  <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)} style={{
                    padding: '3px 9px', borderRadius: 6, fontSize: 11,
                    border: '1px solid var(--border)',
                    background: tagFilter === tag ? 'var(--accent)' : 'transparent',
                    color: tagFilter === tag ? '#fff' : 'var(--ink2)',
                  }}>{tag}</button>
                ))}
              </div>
            </div>
          )}

          {dbError && (
            <div style={{ marginTop: 18, padding: 12, borderRadius: 9, background: 'var(--amber-bg)', fontSize: 11, color: 'var(--amber)', lineHeight: 1.55, border: '1px solid #fde68a' }}>
              <strong>Setup needed.</strong> Add a free Neon Postgres URL as <code style={{ background: 'rgba(0,0,0,.06)', padding: '0 4px', borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>DATABASE_URL</code> in Vercel env vars to enable persistence.
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0, padding: '28px 36px 60px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => setSidebarOpen(s => !s)} style={{
            background: 'transparent', border: 'none', padding: 7, borderRadius: 7, color: 'var(--ink3)',
          }}><Icons.all size={16} /></button>

          {/* View toggle */}
          {(view === 'project' || view === 'kanban') && activeProject && (
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--bg2)', borderRadius: 9, border: '1px solid var(--border)' }}>
              <ViewToggleBtn active={view === 'project'} onClick={() => setView('project')} icon={<Icons.all size={12} />} label="List" />
              <ViewToggleBtn active={view === 'kanban'} onClick={() => setView('kanban')} icon={<Icons.kanban size={12} />} label="Board" />
            </div>
          )}
        </div>

        {/* Hero header */}
        <div style={{ marginBottom: 28, maxWidth: 760 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{viewMeta.eyebrow}</div>
          <h1 className="serif" style={{
            fontSize: 38, lineHeight: 1.05, marginBottom: 8,
            color: activeProjectObj ? activeProjectObj.color : 'var(--ink)',
          }}>
            {viewMeta.title}
          </h1>
          {viewMeta.sub && (
            <p style={{ fontSize: 14, color: 'var(--ink3)', lineHeight: 1.55, maxWidth: 540 }}>
              {viewMeta.sub}
            </p>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono">{filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}</span>
            {tagFilter && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>· filtered by {tagFilter}</span>
                <button onClick={() => setTagFilter(null)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: 12, padding: 0 }}>clear</button>
              </span>
            )}
          </div>
        </div>

        {/* Project notes */}
        {(view === 'project' || view === 'kanban') && activeProjectObj?.notes && (
          <div style={{
            padding: '14px 18px', borderRadius: 10, background: 'var(--card)',
            borderLeft: `3px solid ${activeProjectObj.color}`, border: '1px solid var(--border)',
            marginBottom: 20, fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6,
            display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 760,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Icons.notes size={14} color={activeProjectObj.color} />
            <span style={{ fontStyle: 'italic' }}>{activeProjectObj.notes}</span>
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
            <div style={{ maxWidth: 760 }}>
              <div style={{ marginBottom: 18 }}>
                <TaskComposer projects={projects} defaultProjectId={activeProject} onCreate={createTask} />
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>Loading...</div>
              ) : filtered.length === 0 ? (
                <EmptyState view={view} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

function ViewToggleBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 7, border: 'none',
      background: active ? 'var(--card)' : 'transparent',
      boxShadow: active ? 'var(--shadow-sm)' : 'none',
      color: active ? 'var(--ink)' : 'var(--ink3)',
      fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5,
      transition: 'all .15s',
    }}>{icon} {label}</button>
  )
}

function SidebarItem({ icon, label, active, onClick, count, highlight }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; count?: number; highlight?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 8, border: 'none',
      background: active ? 'var(--card)' : 'transparent',
      boxShadow: active ? 'var(--shadow-sm)' : 'none',
      color: active ? 'var(--ink)' : 'var(--ink2)',
      fontSize: 13, fontWeight: active ? 500 : 400, textAlign: 'left',
      transition: 'all .12s ease',
      marginBottom: 1,
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
      <span style={{ display: 'inline-flex', flexShrink: 0, color: active ? 'var(--accent)' : (highlight ? 'var(--red)' : 'var(--ink3)') }}>{icon}</span>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="mono" style={{
          fontSize: 10, padding: '1px 7px', borderRadius: 10,
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
    today: { title: 'A clear day ahead', sub: "Nothing on your plate. Take a breath, then plan something meaningful." },
    upcoming: { title: 'No upcoming tasks', sub: 'Tasks with future due dates will appear here.' },
    overdue: { title: "You're all caught up", sub: "No overdue tasks. Beautiful work." },
    all: { title: 'A blank canvas', sub: 'Add your first task above to begin.' },
    project: { title: 'Empty project', sub: 'Add tasks to this project above.' },
  }
  const m = messages[view] || messages.all
  return (
    <div style={{
      padding: '64px 28px', textAlign: 'center', background: 'var(--card)',
      borderRadius: 14, border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="serif" style={{ fontSize: 26, color: 'var(--ink2)', marginBottom: 8, fontStyle: 'italic' }}>{m.title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.6 }}>{m.sub}</div>
    </div>
  )
}
