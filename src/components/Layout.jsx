import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, UserPlus, Shield, Warehouse, 
  FlaskConical, Package, LogOut, Menu, X, Bell,
  ChevronRight, Fingerprint, FileText, QrCode,
  CalendarDays, ClipboardList, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-400' },
  { path: '/daily', icon: CalendarDays, label: 'Daily Overview', color: 'text-indigo-400' },
  { path: '/intake', icon: UserPlus, label: 'Body Intake', color: 'text-green-400' },
  { path: '/intake-list', icon: ClipboardList, label: 'Intake List', color: 'text-teal-400' },
  { path: '/custody', icon: Shield, label: 'Chain of Custody', color: 'text-amber-400' },
  { path: '/storage', icon: Warehouse, label: 'Storage', color: 'text-cyan-400' },
  { path: '/examinations', icon: FlaskConical, label: 'Examinations', color: 'text-purple-400' },
  { path: '/effects', icon: Package, label: 'Personal Effects', color: 'text-orange-400' },
  { path: '/release', icon: LogOut, label: 'Release', color: 'text-red-400' },
  { path: '/scan', icon: QrCode, label: 'Scan / Lookup', color: 'text-emerald-400' },
  { path: '/audit', icon: FileText, label: 'Audit Logs', color: 'text-slate-400' },
  { path: '/admin/users', icon: Users, label: 'Users', color: 'text-rose-400' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex flex-col items-center px-4 py-6 border-b border-sidebar-border gap-2">
          <img
            src="https://media.base44.com/images/public/69f965e3075699f1a1c46d47/b77390598_CustiviantLogo4k.png"
            alt="Custiviant"
            style={{ height: '150px', width: '240px', objectFit: 'contain', objectPosition: 'center' }}
          />
          <p className="text-[9px] text-sidebar-foreground/40 uppercase tracking-widest">Chain of Custody</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-3">Navigation</p>
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all group",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? color : "text-sidebar-foreground/50 group-hover:" + color)} />
                <span className="text-sm">{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto text-sidebar-foreground/40" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-foreground">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-[10px] text-sidebar-foreground/50">System Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <div className="h-6 w-px bg-border" />
            <span className="text-xs text-muted-foreground font-mono">SECURE SESSION</span>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}