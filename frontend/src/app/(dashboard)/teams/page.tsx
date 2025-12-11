'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Users, UserPlus } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { teamsApi } from '@/lib/api';
import type { Team, TeamMember } from '@/types';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamsApi.list();
      if (response.data) {
        setTeams(response.data);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    setMembersLoading(true);
    try {
      const response = await teamsApi.getMembers(teamId);
      if (response.data) {
        setTeamMembers(response.data);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleTeamClick = async (team: Team) => {
    setSelectedTeam(team);
    await loadTeamMembers(team.id);
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <Header title="Teams" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}

            {!loading && filteredTeams.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No teams found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Get started by creating a new team'}
                </p>
                {!searchQuery && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                )}
              </div>
            )}

            {!loading && filteredTeams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTeams.map((team) => (
                  <Card
                    key={team.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTeam?.id === team.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleTeamClick(team)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{team.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                            {team.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Created {formatDate(team.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Team Details */}
          <div className="lg:col-span-1">
            {selectedTeam ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedTeam.name}</span>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTeam.description && (
                    <p className="text-sm text-gray-600 mb-4">{selectedTeam.description}</p>
                  )}

                  <h4 className="text-sm font-medium text-gray-700 mb-3">Team Members</h4>

                  {membersLoading && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  )}

                  {!membersLoading && teamMembers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No members yet</p>
                  )}

                  {!membersLoading && teamMembers.length > 0 && (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">U</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">User {member.user_id.slice(0, 8)}</p>
                              <p className="text-xs text-gray-500">
                                Joined {formatDate(member.joined_at)}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={
                              member.role === 'Lead'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a team to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
