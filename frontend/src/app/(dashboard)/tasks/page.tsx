'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { tasksApi } from '@/lib/api';
import type { Task, TaskStatus, Priority } from '@/types';

const statusColors: Record<TaskStatus, string> = {
  Todo: 'bg-gray-100 text-gray-800',
  inprogress: 'bg-blue-100 text-blue-800',
  Review: 'bg-purple-100 text-purple-800',
  Done: 'bg-green-100 text-green-800',
  Blocked: 'bg-red-100 text-red-800',
};

const statusLabels: Record<TaskStatus, string> = {
  Todo: 'To Do',
  inprogress: 'In Progress',
  Review: 'Review',
  Done: 'Done',
  Blocked: 'Blocked',
};

const priorityColors: Record<Priority, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-600',
  High: 'bg-orange-100 text-orange-600',
  Critical: 'bg-red-100 text-red-600',
};

type ViewMode = 'list' | 'board';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksApi.list();
      if (response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tasksByStatus = {
    Todo: filteredTasks.filter((t) => t.status === 'Todo'),
    inprogress: filteredTasks.filter((t) => t.status === 'inprogress'),
    Review: filteredTasks.filter((t) => t.status === 'Review'),
    Done: filteredTasks.filter((t) => t.status === 'Done'),
    Blocked: filteredTasks.filter((t) => t.status === 'Blocked'),
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
          <Badge className={`${priorityColors[task.priority]} ml-2 flex-shrink-0`}>
            {task.priority}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          {task.due_date && (
            <div
              className={`flex items-center text-xs ${
                isOverdue(task.due_date) && task.status !== 'Done'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(task.due_date)}
            </div>
          )}
          {task.estimated_hours && (
            <span className="text-xs text-gray-400">{task.estimated_hours}h</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <Header title="Tasks" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
              <option value="Blocked">Blocked</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'board'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>

            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Filter className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating a new task'}
            </p>
          </div>
        )}

        {/* Board View */}
        {!loading && viewMode === 'board' && filteredTasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(Object.keys(tasksByStatus) as TaskStatus[]).map((status) => (
              <div key={status} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm text-gray-700">{statusLabels[status]}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {tasksByStatus[status].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {tasksByStatus[status].map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && filteredTasks.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.due_date ? (
                        <span
                          className={`text-sm ${
                            isOverdue(task.due_date) && task.status !== 'Done'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.estimated_hours ? `${task.estimated_hours}h` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
