export interface Project {
  id: number
  name: string
  color: string
  icon: string
  notes: string
  archived: boolean
  task_count: number
  done_count: number
  created_at: string
}

export interface Subtask {
  id: number
  task_id: number
  title: string
  done: boolean
  position: number
}

export interface Task {
  id: number
  project_id: number | null
  project_name?: string
  project_color?: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  due_date: string | null
  tags: string[]
  position: number
  completed_at: string | null
  recurring: 'daily' | 'weekly' | 'monthly' | null
  subtasks: Subtask[]
  created_at: string
}

export type ViewType = 'today' | 'upcoming' | 'overdue' | 'all' | 'project' | 'kanban' | 'calendar'
