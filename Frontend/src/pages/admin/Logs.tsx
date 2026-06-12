import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ActivityLog } from '@/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Search,
  Activity,
  User,
  Shield,
  LogIn,
  UserPlus,
  FileText,
  Settings,
  Clock,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const actionIcons: Record<string, React.ElementType> = {
  login: LogIn,
  register: UserPlus,
  task_create: FileText,
  task_update: FileText,
  task_delete: FileText,
  user_update: Settings,
  user_delete: User,
};

const actionColors: Record<string, string> = {
  login: 'text-green-600 bg-green-100',
  register: 'text-blue-600 bg-blue-100',
  task_create: 'text-emerald-600 bg-emerald-100',
  task_update: 'text-amber-600 bg-amber-100',
  task_delete: 'text-red-600 bg-red-100',
  user_update: 'text-purple-600 bg-purple-100',
  user_delete: 'text-red-600 bg-red-100',
};

const actionLabels: Record<string, string> = {
  login: 'User Login',
  register: 'User Registration',
  task_create: 'Task Created',
  task_update: 'Task Updated',
  task_delete: 'Task Deleted',
  user_update: 'User Updated',
  user_delete: 'User Deleted',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter !== 'all') params.action = actionFilter;
      const data = await api.getActivityLogs(params);
      setLogs(data);
    } catch {
      toast.error('Failed to fetch activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const stats = {
    total: logs.length,
    logins: logs.filter((l) => l.action === 'login').length,
    taskActions: logs.filter((l) => l.action?.startsWith('task_')).length,
    userActions: logs.filter((l) => l.action?.startsWith('user_')).length,
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">
          Monitor all user activities and system events
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <LogIn className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Logins</p>
              <p className="text-2xl font-bold">{stats.logins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Task Actions</p>
              <p className="text-2xl font-bold">{stats.taskActions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User Actions</p>
              <p className="text-2xl font-bold">{stats.userActions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Action Type" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map((action) => (
              <SelectItem key={action} value={action}>
                {actionLabels[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-1">No activity found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || actionFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Activity will appear here as users interact with the system'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[80px]">User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="hidden md:table-cell">Details</TableHead>
                      <TableHead className="w-[180px]">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const Icon = actionIcons[log.action] || Activity;
                      const colorClass = actionColors[log.action] || 'text-gray-600 bg-gray-100';
                      const label = actionLabels[log.action] || log.action;

                      return (
                        <TableRow key={log._id}>
                          <TableCell>
                            <div className={cn('p-2 rounded-lg w-fit', colorClass)}>
                              <Icon className="h-4 w-4" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={log.user?.avatar} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {log.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium line-clamp-1">
                                  {log.user?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {log.user?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {label}
                              </Badge>
                              {log.user?.role === 'admin' && (
                                <Shield className="h-3 w-3 text-purple-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">
                              {log.details}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(log.createdAt)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
