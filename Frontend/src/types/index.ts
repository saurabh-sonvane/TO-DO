export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  user: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface DashboardStats {
  stats: {
    users: {
      total: number;
      active: number;
      inactive: number;
      admins: number;
      regularUsers: number;
      newLast7Days: number;
    };
    tasks: {
      total: number;
      todo: number;
      in_progress: number;
      done: number;
      completed: number;
      pending: number;
      high: number;
      medium: number;
      low: number;
      newLast7Days: number;
    };
  };
  charts: {
    userGrowth: Array<{ _id: string; count: number }>;
    taskTrend: Array<{ _id: { date: string; status: string }; count: number }>;
  };
  recentLogins: Array<{
    _id: string;
    user: User;
    createdAt: string;
  }>;
}

export interface TaskSummary {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

export interface UserDetail extends User {
  taskSummary: TaskSummary;
  recentActivity: Array<{
    _id: string;
    action: string;
    details: string;
    createdAt: string;
  }>;
}

export interface AdminEnums {
  roles: string[];
  statuses: string[];
  taskStatuses: string[];
  priorities: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityLog {
  _id: string;
  user: User;
  action: string;
  details: string;
  createdAt: string;
}
