'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  CheckSquare,
  Target,
  Plus,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { projectsApi, tasksApi } from '@/lib/api';
import type { Project, Task, Milestone, ProjectStatus, Priority, TaskStatus } from '@/types';

const statusColors: Record<ProjectStatus, string> = {
  Planning: 'bg-gray-100 text-gray-800',
  Active: 'bg-green-100 text-green-800',
  OnHold: 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-blue-100 text-blue-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const priorityColors: Record<Priority, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-600',
  High: 'bg-orange-100 text-orange-600',
  Critical: 'bg-red-100 text-red-600',
};

const taskStatusColors: Record<TaskStatus, string> = {
  Todo: 'bg-gray-100 text-gray-800',
  inprogress: 'bg-blue-100 text-blue-800',
  Review: 'bg-purple-100 text-purple-800',
  Done: 'bg-green-100 text-green-800',
  Blocked: 'bg-red-100 text-red-800',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones'>('overview');

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const [projectRes, tasksRes, milestonesRes] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.getTasks(projectId),
        projectsApi.getMilestones(projectId),
      ]);

      if (projectRes.data) setProject(projectRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (milestonesRes.data) setMilestones(milestonesRes.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsApi.delete(projectId);
      router.push('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount?: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'Todo').length,
    inProgress: tasks.filter((t) => t.status === 'inprogress').length,
    done: tasks.filter((t) => t.status === 'Done').length,
  };

  if (loading) {
    return (
      <div>
        <Header title="Project" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Header title="Project" />
        <div className="p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900">Project not found</h2>
          <Link href="/projects" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={project.name} />

      <div className="p-6">
        {/* Back button and actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Link>
          <div className="flex gap-2">
            <Link href={`/projects/${projectId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Project header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600">{project.description || 'No description'}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={statusColors[project.status]}>{project.status}</Badge>
              <Badge className={priorityColors[project.priority]}>{project.priority}</Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium">{formatDate(project.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">End Date</p>
                <p className="text-sm font-medium">{formatDate(project.end_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium">{formatCurrency(project.budget)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tasks</p>
                <p className="text-sm font-medium">
                  {taskStats.done}/{taskStats.total} completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {(['overview', 'tasks', 'milestones'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Task Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Todo</span>
                    <span className="font-medium">{taskStats.todo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">In Progress</span>
                    <span className="font-medium">{taskStats.inProgress}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium">{taskStats.done}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {taskStats.total > 0
                        ? Math.round((taskStats.done / taskStats.total) * 100)
                        : 0}
                      % complete
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <p className="text-sm text-gray-500">No milestones yet</p>
                ) : (
                  <div className="space-y-3">
                    {milestones.slice(0, 3).map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-2">
                        <Target
                          className={`h-4 w-4 ${
                            milestone.completed ? 'text-green-600' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            milestone.completed ? 'line-through text-gray-400' : ''
                          }`}
                        >
                          {milestone.name}
                        </span>
                      </div>
                    ))}
                    {milestones.length > 3 && (
                      <button
                        onClick={() => setActiveTab('milestones')}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View all {milestones.length} milestones
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">No tasks yet</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1">{task.title}</span>
                        <Badge className={`${taskStatusColors[task.status]} ml-2`}>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                    {tasks.length > 3 && (
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View all {tasks.length} tasks
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Tasks ({tasks.length})</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No tasks yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={taskStatusColors[task.status]}>{task.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(task.due_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Milestones ({milestones.length})</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
            {milestones.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No milestones yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              milestone.completed ? 'bg-green-100' : 'bg-gray-100'
                            }`}
                          >
                            <Target
                              className={`h-5 w-5 ${
                                milestone.completed ? 'text-green-600' : 'text-gray-400'
                              }`}
                            />
                          </div>
                          <div>
                            <h3
                              className={`font-medium ${
                                milestone.completed ? 'line-through text-gray-400' : ''
                              }`}
                            >
                              {milestone.name}
                            </h3>
                            {milestone.description && (
                              <p className="text-sm text-gray-500">{milestone.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={milestone.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {milestone.completed ? 'Completed' : 'Pending'}
                          </Badge>
                          {milestone.due_date && (
                            <p className="text-sm text-gray-500 mt-1">
                              Due: {formatDate(milestone.due_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
