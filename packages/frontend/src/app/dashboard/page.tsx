/**
 * Dashboard Page
 * @spec UI-004
 */

'use client';

import { Play, History, FileBox, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

const stats = [
  { name: 'Active Executions', value: '12', icon: Play, color: 'text-blue-500' },
  { name: 'Completed Today', value: '48', icon: History, color: 'text-green-500' },
  { name: 'Total Artifacts', value: '256', icon: FileBox, color: 'text-purple-500' },
  { name: 'Success Rate', value: '94.2%', icon: BarChart3, color: 'text-orange-500' },
];

export default function DashboardPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of your Claude Agent executions
              </p>
            </div>
            <Link href="/executions/new">
              <Button>
                <Play className="mr-2 h-4 w-4" />
                New Execution
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.name}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>
                  Your most recent agent executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No recent executions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/executions/new" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="mr-2 h-4 w-4" />
                    Start New Execution
                  </Button>
                </Link>
                <Link href="/history" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <History className="mr-2 h-4 w-4" />
                    View Execution History
                  </Button>
                </Link>
                <Link href="/artifacts" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileBox className="mr-2 h-4 w-4" />
                    Browse Artifacts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
