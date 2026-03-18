"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, Settings, Workflow, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Toaster } from "react-hot-toast";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const isPublicPage = pathname === "/login" || pathname === "/register";

  // If it's a public page or user isn't authenticated, just render children (AuthGuard handles redirects for protected routes)
  if (isPublicPage || !isAuthenticated) {
    return (
        <>
            {children}
            <Toaster position="bottom-right" />
        </>
    );
  }

  return (
    <div className="flex min-h-screen w-full antialiased">
        {/* Sidebar */}
        <aside className="w-[240px] flex-shrink-0 bg-sidebar-bg border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-300">
          <div className="h-14 flex items-center px-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-white font-bold text-xs shadow-md shadow-accent/20 group-hover:scale-105 transition-transform">
                W
              </div>
              <span className="font-semibold text-sm tracking-tight text-foreground">Workflow App</span>
            </Link>
          </div>
          
          <nav className="flex-1 py-6 px-3 flex flex-col gap-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main</div>
            
            <Link href="/" className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all group ${pathname === "/" ? "bg-sidebar-hover text-foreground" : "text-slate-600 hover:bg-sidebar-hover hover:text-foreground"}`}>
              <LayoutDashboard size={18} className={`${pathname === "/" ? "text-accent" : "text-slate-400 group-hover:text-accent"} transition-colors`} />
              Overview
            </Link>
            
            <Link href="/workflows" className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all group ${pathname.startsWith("/workflows") ? "bg-sidebar-hover text-foreground" : "text-slate-600 hover:bg-sidebar-hover hover:text-foreground"}`}>
              <Workflow size={18} className={`${pathname.startsWith("/workflows") ? "text-accent" : "text-slate-400 group-hover:text-accent"} transition-colors`} />
              Workflows
            </Link>
            
            <Link href="/executions" className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all group ${pathname.startsWith("/executions") ? "bg-sidebar-hover text-foreground" : "text-slate-600 hover:bg-sidebar-hover hover:text-foreground"}`}>
              <Activity size={18} className={`${pathname.startsWith("/executions") ? "text-accent" : "text-slate-400 group-hover:text-accent"} transition-colors`} />
              Executions
            </Link>
            
            <div className="mt-8 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Settings</div>
            
            <Link href="#" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-sidebar-hover hover:text-foreground transition-all group">
              <Settings size={18} className="text-slate-400 group-hover:text-accent transition-colors" />
              Preferences
            </Link>

            <div className="mt-auto pt-6 border-t border-border">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold rounded-lg text-rose-500 hover:bg-rose-50 transition-all group"
                >
                  <LogOut size={18} className="text-rose-400 group-hover:text-rose-500 transition-colors" />
                  Logout
                </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen w-0">
          <header className="h-14 bg-background border-b border-border flex flex-shrink-0 items-center justify-between px-6 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/60">
             <div className="flex items-center gap-2 text-sm text-slate-500 leading-none">
                <span className="font-medium text-slate-400">Acme Corp</span>
                <span className="text-[10px] text-slate-300">/</span>
                <span className="text-foreground font-bold tracking-tight">
                    {pathname === "/" ? "Dashboard" : 
                     pathname.startsWith("/workflows") ? "Workflows" : 
                     pathname.startsWith("/executions") ? "Executions" : "Automation"}
                </span>
             </div>
             <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-accent to-purple-500 cursor-pointer shadow-lg shadow-accent/20 border border-white/20 transition-transform active:scale-95" title="User Profile"></div>
             </div>
          </header>
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fafafa]">
            <div className="max-w-6xl mx-auto p-6 md:p-8 w-full min-h-full">
              {children}
            </div>
          </main>
        </div>
        
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              fontSize: '14px',
              borderRadius: '12px'
            }
          }}
        />
    </div>
  );
}
