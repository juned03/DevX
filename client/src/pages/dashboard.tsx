import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Building2, FolderOpen, FileText, GitBranch, TrendingUp, Layers, Clock, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardMetrics {
  organizations: number;
  projects: number;
  sdlcProjects: number;
  goldenRepositories: number;
  totalWorkItems: number;
  workItems: {
    issues: number;
    epics: number;
    requirements: number;
    backlog: number;
    documents: number;
  };
  wikiPages: number;
  phases: {
    total: number;
    active: number;
    completed: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: string;
  }>;
  recentOrganizations: Array<{
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    status: string;
    createdAt: string;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const workItemsData = metrics ? [
    { name: 'Issues', value: metrics.workItems.issues, color: COLORS[0] },
    { name: 'Epics', value: metrics.workItems.epics, color: COLORS[1] },
    { name: 'Requirements', value: metrics.workItems.requirements, color: COLORS[2] },
    { name: 'Backlog', value: metrics.workItems.backlog, color: COLORS[3] },
    { name: 'Documents', value: metrics.workItems.documents, color: COLORS[4] },
  ].filter(item => item.value > 0) : [];

  const phaseProgressData = metrics ? [
    { name: 'Active', value: metrics.phases.active, color: '#10b981' },
    { name: 'Completed', value: metrics.phases.completed, color: '#3b82f6' },
    { name: 'Pending', value: metrics.phases.total - metrics.phases.active - metrics.phases.completed, color: '#6b7280' },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">Overview Dashboard</h2>
        <p className="text-muted-foreground" data-testid="text-dashboard-subtitle">
          Real-time insights into your SDLC management platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organizations</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950">
              <Building2 className="h-5 w-5 text-blue-600" data-testid="icon-organizations" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-organizations-count">{metrics?.organizations || 0}</div>
            <p className="text-xs text-muted-foreground">Active organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-950">
              <FolderOpen className="h-5 w-5 text-purple-600" data-testid="icon-projects" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-projects-count">{metrics?.projects || 0}</div>
            <p className="text-xs text-muted-foreground">Total projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SDLC Projects</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 dark:bg-green-950">
              <Layers className="h-5 w-5 text-green-600" data-testid="icon-sdlc-projects" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sdlc-projects-count">{metrics?.sdlcProjects || 0}</div>
            <p className="text-xs text-muted-foreground">Active SDLC projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Work Items</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-950">
              <FileText className="h-5 w-5 text-orange-600" data-testid="icon-work-items" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-work-items-count">{metrics?.totalWorkItems || 0}</div>
            <p className="text-xs text-muted-foreground">Total work items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Golden Repositories</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-950">
              <GitBranch className="h-5 w-5 text-indigo-600" data-testid="icon-repos" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-repos-count">{metrics?.goldenRepositories || 0}</div>
            <p className="text-xs text-muted-foreground">Template repositories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wiki Pages</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-100 dark:bg-cyan-950">
              <FileText className="h-5 w-5 text-cyan-600" data-testid="icon-wiki" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-wiki-count">{metrics?.wikiPages || 0}</div>
            <p className="text-xs text-muted-foreground">Documentation pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Phases</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-100 dark:bg-yellow-950">
              <Clock className="h-5 w-5 text-yellow-600" data-testid="icon-active-phases" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-phases-count">{metrics?.phases.active || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Phases</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" data-testid="icon-completed-phases" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-phases-count">{metrics?.phases.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Work Items Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown by category</p>
          </CardHeader>
          <CardContent>
            {workItemsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={workItemsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {workItemsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No work items available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phase Progress Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Current phase status distribution</p>
          </CardHeader>
          <CardContent>
            {phaseProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={phaseProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {phaseProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No phase data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg">Recent Projects</CardTitle>
            <Button asChild variant="ghost" size="sm" data-testid="button-view-all-projects">
              <Link href="/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {metrics?.recentProjects && metrics.recentProjects.length > 0 ? (
              <div className="space-y-4">
                {metrics.recentProjects.map((project) => (
                  <div key={project.id} className="flex items-start justify-between border-b pb-4 last:border-0" data-testid={`project-item-${project.id}`}>
                    <div className="space-y-1 flex-1">
                      <p className="font-medium" data-testid="text-project-name">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          project.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {project.status}
                        </span>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No recent projects
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-lg">Recent Organizations</CardTitle>
            <Button asChild variant="ghost" size="sm" data-testid="button-view-all-organizations">
              <Link href="/organizations">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {metrics?.recentOrganizations && metrics.recentOrganizations.length > 0 ? (
              <div className="space-y-4">
                {metrics.recentOrganizations.map((org) => (
                  <div key={org.id} className="flex items-start justify-between border-b pb-4 last:border-0" data-testid={`org-item-${org.id}`}>
                    <div className="space-y-1 flex-1">
                      <p className="font-medium" data-testid="text-org-name">{org.name}</p>
                      {org.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{org.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {org.industry && (
                          <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                            {org.industry}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          org.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {org.status}
                        </span>
                        <span>{new Date(org.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No recent organizations
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
