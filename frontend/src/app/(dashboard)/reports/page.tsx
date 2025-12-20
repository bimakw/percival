'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tasksApi, projectsApi, teamsApi, timeLogsApi } from '@/lib/api';
import type { Task, Project, Team, TimeLog, TaskStatus, Priority } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type ReportType = 'project' | 'task' | 'time' | 'workload';

interface DateRange {
  start: string;
  end: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const statusColors: Record<TaskStatus, string> = {
  Todo: '#9CA3AF',
  inprogress: '#3B82F6',
  Review: '#8B5CF6',
  Done: '#10B981',
  Blocked: '#EF4444',
};

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('project');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, teamsRes, timeLogsRes] = await Promise.all([
        tasksApi.list(),
        projectsApi.list(),
        teamsApi.list(),
        timeLogsApi.list({ start_date: dateRange.start, end_date: dateRange.end }),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (teamsRes.data) setTeams(teamsRes.data);
      if (timeLogsRes.data) setTimeLogs(timeLogsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((h) => {
          const value = row[h];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Project Summary Data
  const projectSummary = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    const completedTasks = projectTasks.filter((t) => t.status === 'Done').length;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const projectTimeLogs = timeLogs.filter((tl) =>
      projectTasks.some((t) => t.id === tl.task_id)
    );
    const totalHours = projectTimeLogs.reduce((sum, tl) => sum + tl.hours, 0);

    return {
      name: project.name,
      status: project.status,
      totalTasks,
      completedTasks,
      progress,
      totalHours,
    };
  });

  // Task Status Distribution
  const taskStatusData = (Object.keys(statusColors) as TaskStatus[]).map((status) => ({
    name: status === 'inprogress' ? 'In Progress' : status,
    value: tasks.filter((t) => t.status === status).length,
    color: statusColors[status],
  }));

  // Task Priority Distribution
  const priorityData = (['Low', 'Medium', 'High', 'Critical'] as Priority[]).map(
    (priority, index) => ({
      name: priority,
      value: tasks.filter((t) => t.priority === priority).length,
      color: COLORS[index],
    })
  );

  // Time Report Data
  const timeByProject = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    const hours = timeLogs
      .filter((tl) => projectTasks.some((t) => t.id === tl.task_id))
      .reduce((sum, tl) => sum + tl.hours, 0);
    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      hours,
    };
  }).filter((p) => p.hours > 0);

  // Workload Data
  const workloadData = Array.from(
    new Set(tasks.filter((t) => t.assignee_id).map((t) => t.assignee_id))
  ).map((userId) => {
    const userTasks = tasks.filter((t) => t.assignee_id === userId);
    const completed = userTasks.filter((t) => t.status === 'Done').length;
    const inProgress = userTasks.filter((t) => t.status === 'inprogress').length;
    const todo = userTasks.filter((t) => t.status === 'Todo').length;
    const userTimeLogs = timeLogs.filter((tl) => tl.user_id === userId);
    const hours = userTimeLogs.reduce((sum, tl) => sum + tl.hours, 0);
    const userName = userTimeLogs[0]?.user_name || 'Unknown';

    return {
      name: userName,
      completed,
      inProgress,
      todo,
      hours,
      total: userTasks.length,
    };
  });

  const handleExport = () => {
    switch (reportType) {
      case 'project':
        exportToCSV(projectSummary, 'project_report');
        break;
      case 'task':
        exportToCSV(
          tasks.map((t) => ({
            title: t.title,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date || '',
            estimated_hours: t.estimated_hours || 0,
            actual_hours: t.actual_hours || 0,
          })),
          'task_report'
        );
        break;
      case 'time':
        exportToCSV(
          timeLogs.map((tl) => ({
            date: tl.date,
            task: tl.task_name || '',
            project: tl.project_name || '',
            user: tl.user_name || '',
            hours: tl.hours,
            description: tl.description || '',
          })),
          'time_report'
        );
        break;
      case 'workload':
        exportToCSV(workloadData, 'workload_report');
        break;
    }
  };

  const reportTypes = [
    { id: 'project', name: 'Project Summary', icon: BarChart3 },
    { id: 'task', name: 'Task Report', icon: FileText },
    { id: 'time', name: 'Time Report', icon: Clock },
    { id: 'workload', name: 'Team Workload', icon: Users },
  ];

  return (
    <div>
      <Header title="Reports" />

      <div className="p-6">
        {/* Report Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id as ReportType)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                reportType === type.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <type.icon
                className={`h-6 w-6 mb-2 ${
                  reportType === type.id ? 'text-blue-600' : 'text-gray-500'
                }`}
              />
              <div
                className={`text-sm font-medium ${
                  reportType === type.id ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {type.name}
              </div>
            </button>
          ))}
        </div>

        {/* Date Range & Export */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setDateRange({
                    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                    end: format(new Date(), 'yyyy-MM-dd'),
                  })
                }
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Last 7 days
              </button>
              <button
                onClick={() =>
                  setDateRange({
                    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                    end: format(new Date(), 'yyyy-MM-dd'),
                  })
                }
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Last 30 days
              </button>
              <button
                onClick={() =>
                  setDateRange({
                    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
                  })
                }
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                This month
              </button>
            </div>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Project Summary Report */}
            {reportType === 'project' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Total Projects</div>
                      <div className="text-2xl font-bold">{projects.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Active Projects</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {projects.filter((p) => p.status === 'Active').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Completed Projects</div>
                      <div className="text-2xl font-bold text-green-600">
                        {projects.filter((p) => p.status === 'Completed').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Total Hours Logged</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {timeLogs.reduce((sum, tl) => sum + tl.hours, 0).toFixed(1)}h
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Project Progress Table */}
                <Card>
                  <CardContent className="p-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tasks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projectSummary.map((project) => (
                          <tr key={project.name}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              {project.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                className={
                                  project.status === 'Active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : project.status === 'Completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {project.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.completedTasks}/{project.totalTasks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-500">
                                  {project.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {project.totalHours.toFixed(1)}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Task Report */}
            {reportType === 'task' && (
              <div className="space-y-6">
                {/* Task Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {taskStatusData.map((status) => (
                    <Card key={status.name}>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-500">{status.name}</div>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: status.color }}
                        >
                          {status.value}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4">Tasks by Status</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={taskStatusData.filter((d) => d.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {taskStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-4">Tasks by Priority</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={priorityData.filter((d) => d.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {priorityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Completion Rate */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Task Completion Rate</h3>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-600">
                          {tasks.length > 0
                            ? Math.round(
                                (tasks.filter((t) => t.status === 'Done').length /
                                  tasks.length) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-600 h-4 rounded-full transition-all"
                        style={{
                          width: `${
                            tasks.length > 0
                              ? (tasks.filter((t) => t.status === 'Done').length /
                                  tasks.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Time Report */}
            {reportType === 'time' && (
              <div className="space-y-6">
                {/* Time Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Total Hours</div>
                      <div className="text-2xl font-bold">
                        {timeLogs.reduce((sum, tl) => sum + tl.hours, 0).toFixed(1)}h
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Time Entries</div>
                      <div className="text-2xl font-bold">{timeLogs.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Avg Hours/Entry</div>
                      <div className="text-2xl font-bold">
                        {timeLogs.length > 0
                          ? (
                              timeLogs.reduce((sum, tl) => sum + tl.hours, 0) /
                              timeLogs.length
                            ).toFixed(1)
                          : 0}
                        h
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Hours by Project Chart */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Hours by Project</h3>
                    {timeByProject.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={timeByProject}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No time data for this period
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Time Entries */}
                <Card>
                  <CardContent className="p-0">
                    <div className="px-6 py-4 border-b">
                      <h3 className="font-semibold">Recent Time Entries</h3>
                    </div>
                    {timeLogs.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Task
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Hours
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {timeLogs.slice(0, 10).map((tl) => (
                            <tr key={tl.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {format(new Date(tl.date), 'MMM d, yyyy')}
                              </td>
                              <td className="px-6 py-4 text-sm">{tl.task_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {tl.user_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {tl.hours}h
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No time entries for this period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Workload Report */}
            {reportType === 'workload' && (
              <div className="space-y-6">
                {/* Team Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Team Members</div>
                      <div className="text-2xl font-bold">{workloadData.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Total Tasks Assigned</div>
                      <div className="text-2xl font-bold">
                        {workloadData.reduce((sum, w) => sum + w.total, 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-500">Avg Tasks/Person</div>
                      <div className="text-2xl font-bold">
                        {workloadData.length > 0
                          ? (
                              workloadData.reduce((sum, w) => sum + w.total, 0) /
                              workloadData.length
                            ).toFixed(1)
                          : 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Workload Chart */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Task Distribution by Team Member</h3>
                    {workloadData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={workloadData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                          <Bar dataKey="inProgress" stackId="a" fill="#3B82F6" name="In Progress" />
                          <Bar dataKey="todo" stackId="a" fill="#9CA3AF" name="To Do" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No workload data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Workload Table */}
                <Card>
                  <CardContent className="p-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Team Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            To Do
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            In Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Completed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Hours Logged
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workloadData.map((member) => (
                          <tr key={member.name}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              {member.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {member.todo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                              {member.inProgress}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600">
                              {member.completed}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {member.hours.toFixed(1)}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
