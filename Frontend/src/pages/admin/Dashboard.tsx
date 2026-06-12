import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  CheckSquare,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  Shield,
  ArrowRight,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.getAdminDashboard();
        setData(response);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, charts, recentLogins } = data || { stats: null, charts: null, recentLogins: [] };

  const userGrowthData = charts?.userGrowth?.map((item) => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: item.count,
  })) || [];

  const taskTrendData = charts?.taskTrend?.reduce((acc, item) => {
    const date = new Date(item._id.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing[item._id.status] = item.count;
    } else {
      acc.push({ date, [item._id.status]: item.count });
    }
    return acc;
  }, [] as Record<string, unknown>[]) || [];

  const taskStatusData = stats?.tasks ? [
    { name: 'To Do', value: stats.tasks.todo, color: '#94a3b8' },
    { name: 'In Progress', value: stats.tasks.in_progress, color: '#3b82f6' },
    { name: 'Done', value: stats.tasks.done, color: '#22c55e' },
  ] : [];

  const priorityData = stats?.tasks ? [
    { name: 'High', value: stats.tasks.high, color: '#ef4444' },
    { name: 'Medium', value: stats.tasks.medium, color: '#f59e0b' },
    { name: 'Low', value: stats.tasks.low, color: '#22c55e' },
  ] : [];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your platform's performance and activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/users">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/tasks">
              <CheckSquare className="mr-2 h-4 w-4" />
              View Tasks
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats?.users.total || 0}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-100"
            trend={stats?.users.newLast7Days || 0}
            trendLabel="new this week"
          />
          <StatCard
            title="Active Users"
            value={stats?.users.active || 0}
            icon={UserCheck}
            color="text-green-500"
            bg="bg-green-100"
          />
          <StatCard
            title="Inactive Users"
            value={stats?.users.inactive || 0}
            icon={UserX}
            color="text-red-500"
            bg="bg-red-100"
          />
          <StatCard
            title="Admins"
            value={stats?.users.admins || 0}
            icon={Shield}
            color="text-purple-500"
            bg="bg-purple-100"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Task Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tasks"
            value={stats?.tasks.total || 0}
            icon={CheckSquare}
            color="text-blue-500"
            bg="bg-blue-100"
            trend={stats?.tasks.newLast7Days || 0}
            trendLabel="new this week"
          />
          <StatCard
            title="To Do"
            value={stats?.tasks.todo || 0}
            icon={Clock}
            color="text-slate-500"
            bg="bg-slate-100"
          />
          <StatCard
            title="In Progress"
            value={stats?.tasks.in_progress || 0}
            icon={TrendingUp}
            color="text-amber-500"
            bg="bg-amber-100"
          />
          <StatCard
            title="Completed"
            value={stats?.tasks.done || 0}
            icon={CheckSquare}
            color="text-green-500"
            bg="bg-green-100"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Trends</CardTitle>
            <CardDescription>Task activity over time by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="todo" stackId="a" fill="#94a3b8" />
                  <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="done" stackId="a" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Status</CardTitle>
            <CardDescription>Distribution of task statuses</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Priority</CardTitle>
            <CardDescription>Distribution of task priorities</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Logins</CardTitle>
            <CardDescription>Latest user login activities</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/logs">
              View All Logs
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLogins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No recent login activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogins.slice(0, 5).map((login) => (
                <div
                  key={login._id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={login.user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {login.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{login.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">{login.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={login.user?.role === 'admin' ? 'default' : 'secondary'}>
                      {login.user?.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(login.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  trend,
  trendLabel,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: number;
  trendLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
            {trend !== undefined && trendLabel && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500 font-medium">+{trend}</span> {trendLabel}
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', bg)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
