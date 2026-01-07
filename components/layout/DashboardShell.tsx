'use client';

import * as React from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AdminDataProvider, useAdminData } from '@/lib/store';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function ShellFrame({ children }: { children: React.ReactNode }) {
  const { hydrated } = useAdminData();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-64">
        <TopBar setSidebarOpen={setSidebarOpen} />
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      <ShellFrame>{children}</ShellFrame>
    </AdminDataProvider>
  );
}
