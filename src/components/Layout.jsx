import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Shield, Warehouse,
  FlaskConical, Package, LogOut, Menu, X, Bell,
  ChevronRight, FileText, QrCode, CalendarDays,
  ClipboardList, Zap, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      { path: '/daily', icon: CalendarDays, label: 'Daily Overview', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    ]
  },
  {
    label: 'Case Management',
    items: [
      { path: '/intake', icon: UserPlus, label: 'Body Intake', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { path: '/intake-list', icon: ClipboardList, label: 'Intake List', color: 'text-teal-400', bg: 'bg-teal-500/10' },
      { path: '/custody', icon: Shield, label: 'Chain of Custody', color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { path: '/storage', icon: Warehouse, label: 'Storage', color: 'text-sky-400', bg: 'bg-sky-500/10' },
    ]
  },
  {
    label: 'Workflows',
    items: [
      { path: '/examinations', icon: FlaskConical, label: 'Examinations', color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { path: '/effects', icon: Package, label: 'Personal Effects', color: 'text-orange-400', bg: 'bg-orange-500/10' },
      { path: '/release', icon: LogOut, label: 'Release', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    ]
  },
  {
    label: 'System',
    items: [
      { path: '/scan', icon: QrCode, label: 'Scan / Lookup', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
      { path: '/audit', icon: FileText, label: 'Audit Logs', color: 'text-slate-400', bg: 'bg-slate-500/10' },
    ]
  }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col transition-all duration-300 ease-out lg:relative lg:translate-x-0",
        "bg-[hsl(231,35%,12%)]",
        sidebarOpen ? "translate-x-0 shadow-float" : "-translate-x-full"
      )}>
        {/* Logo area */}
        <div className="px-5 pt-6 pb-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-indigo shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm tracking-tight leading-none">MorgueSafe</p>
              <p className="text-[10px] text-indigo-300/60 mt-0.5 uppercase tracking-widest font-mono">Enterprise</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[9px] uppercase tracking-[0.12em] text-white/25 font-semibold px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ path, icon: Icon, label, color, bg }) => {
                  const active = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative",
                        active
                          ? "bg-white/10 text-white nav-active-glow"
                          : "text-white/55 hover:bg-white/6 hover:text-white/85"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-400" />
                      )}
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                        active ? bg : "bg-white/5 group-hover:bg-white/8"
                      )}>
                        <Icon className={cn("w-3.5 h-3.5", active ? color : "text-white/40 group-hover:text-white/65")} />
                      </div>
                      <span className={cn("text-[13px] font-medium flex-1", active ? "text-white" : "")}>{label}</span>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/8">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/6 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/85 truncate">Admin User</p>
              <p className="text-[10px] text-white/35 truncate">System Administrator</p>
            </div>
            <ChevronDown className="w-3 h-3 text-white/25" />
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-white/80 backdrop-blur-xl flex items-center px-5 gap-4 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Breadcrumb-style location */}
          <div className="flex-1 hidden sm:block">
            <p className="text-xs text-muted-foreground font-mono">{format(new Date(), 'EEE, MMM d · HH:mm')}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">Live</span>
            </div>

            <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </button>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <span className="text-xs font-medium text-slate-700 hidden md:block">Admin</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto bg-[hsl(220,25%,97%)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}