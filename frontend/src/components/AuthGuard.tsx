'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import Sidebar from './Sidebar';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!isInitializing) {
      if (!isAuthenticated && !isAuthPage) {
        router.push('/login');
      } else if (isAuthenticated && isAuthPage) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isInitializing, isAuthPage, router]);

  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0b0d',
        color: '#f3f4f6',
        gap: '16px',
        fontFamily: 'var(--font-outfit), sans-serif'
      }}>
        <div className="loading-spinner" />
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Initializing Xeno CRM...
        </div>
      </div>
    );
  }

  // If not authenticated and trying to view CRM dashboard/pages, show nothing during redirect
  if (!isAuthenticated && !isAuthPage) {
    return null;
  }

  // For Auth pages, render them raw (without Sidebar or CRM container)
  if (isAuthPage) {
    return (
      <div className="app-container auth-layout" style={{ display: 'block', minHeight: '100vh', padding: 0 }}>
        {children}
      </div>
    );
  }

  // For normal pages, render with sidebar
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
