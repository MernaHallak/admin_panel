import {DashboardNavbar} from "./dashboard-navbar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({children}: DashboardShellProps) {
  return (
    <main className="dashboard-page">
      <DashboardNavbar />
      <div className="dashboard-content" id="main-content">
        {children}
      </div>
    </main>
  );
}
