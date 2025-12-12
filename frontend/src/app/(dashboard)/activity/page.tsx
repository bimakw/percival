'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { projectsApi } from '@/lib/api';
import type { Project, ActivityLog, ActivityAction, EntityType } from '@/types';
import {
  Activity,
  FolderKanban,
  CheckSquare,
  Users,
  Target,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  Filter,
  ChevronDown,
} from 'lucide-react';

// Mock data for demonstration (replace with real API when backend is ready)
const mockActivities: ActivityLog[] = [
  {
    id: '1',
    user_name: 'John Doe',
    project_name: 'Website Redesign',
    action: 'created',
    entity_type: 'task',
    entity_id: 't1',
    entity_name: 'Update homepage layout',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    user_name: 'Jane Smith',
    project_name: 'Mobile App',
    action: 'status_changed',
    entity_type: 'task',
    entity_id: 't2',
    entity_name: 'Implement login screen',
    details: { from: 'inprogress', to: 'review' },
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    user_name: 'Bob Wilson',
    project_name: 'Website Redesign',
    action: 'commented',
    entity_type: 'task',
    entity_id: 't3',
    entity_name: 'Fix navigation bug',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '4',
    user_name: 'Alice Brown',
    project_name: 'API Development',
    action: 'assigned',
    entity_type: 'task',
    entity_id: 't4',
    entity_name: 'Create user endpoints',
    details: { assignee: 'Bob Wilson' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '5',
    user_name: 'John Doe',
    project_name: 'Website Redesign',
    action: 'created',
    entity_type: 'project',
    entity_id: 'p1',
    entity_name: 'Website Redesign',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '6',
    user_name: 'Jane Smith',
    project_name: 'Mobile App',
    action: 'updated',
    entity_type: 'milestone',
    entity_id: 'm1',
    entity_name: 'Phase 1 Complete',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

const actionIcons: Record<ActivityAction, typeof Plus> = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  status_changed: ArrowRight,
  assigned: Users,
  commented: MessageSquare,
};

const actionColors: Record<ActivityAction, string> = {
  created: 'bg-green-100 text-green-600',
  updated: 'bg-blue-100 text-blue-600',
  deleted: 'bg-red-100 text-red-600',
  status_changed: 'bg-purple-100 text-purple-600',
  assigned: 'bg-orange-100 text-orange-600',
  commented: 'bg-gray-100 text-gray-600',
};

const entityIcons: Record<EntityType, typeof FolderKanban> = {
  project: FolderKanban,
  task: CheckSquare,
  team: Users,
  milestone: Target,
  comment: MessageSquare,
};

function getActionText(activity: ActivityLog): string {
  const { action, entity_type, entity_name, details } = activity;

  switch (action) {
    case 'created':
      return `created ${entity_type} "${entity_name}"`;
    case 'updated':
      return `updated ${entity_type} "${entity_name}"`;
    case 'deleted':
      return `deleted ${entity_type} "${entity_name}"`;
    case 'status_changed':
      return `changed status of "${entity_name}" from ${details?.from} to ${details?.to}`;
    case 'assigned':
      return `assigned "${entity_name}" to ${details?.assignee}`;
    case 'commented':
      return `commented on "${entity_name}"`;
    default:
      return `performed action on "${entity_name}"`;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: days > 365 ? 'numeric' : undefined,
  });
}

interface ActivityItemProps {
  activity: ActivityLog;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const ActionIcon = actionIcons[activity.action];
  const EntityIcon = entityIcons[activity.entity_type];

  return (
    <div className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
      <div className={`p-2 rounded-full h-fit ${actionColors[activity.action]}`}>
        <ActionIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.user_name}</span>{' '}
          {getActionText(activity)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {activity.project_name && (
            <Badge variant="secondary" className="text-xs">
              <EntityIcon className="h-3 w-3 mr-1" />
              {activity.project_name}
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            {formatTimeAgo(activity.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>(mockActivities);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsRes = await projectsApi.list();
      if (projectsRes.data) setProjects(projectsRes.data);

      // TODO: Replace with real API call when backend is ready
      // const activitiesRes = await activityApi.list();
      // if (activitiesRes.data) setActivities(activitiesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities =
    selectedProject === 'all'
      ? activities
      : activities.filter((a) => a.project_name === selectedProject);

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
    return groups;
  }, {} as Record<string, ActivityLog[]>);

  if (loading) {
    return (
      <div>
        <Header title="Activity Feed" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Activity Feed" />

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Filter */}
          <div className="mb-6">
            <div className="relative inline-block">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm">
                  {selectedProject === 'all'
                    ? 'All Projects'
                    : selectedProject}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showProjectDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSelectedProject('all');
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                      selectedProject === 'all' ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    All Projects
                  </button>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project.name);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                        selectedProject === project.name ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity List */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {Object.keys(groupedActivities).length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No activity yet</p>
                </div>
              ) : (
                <div>
                  {Object.entries(groupedActivities).map(([date, items]) => (
                    <div key={date}>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          {date}
                        </p>
                      </div>
                      <div className="divide-y">
                        {items.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
