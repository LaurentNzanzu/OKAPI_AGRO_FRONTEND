import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PageActionsProvider } from '../context/PageActionsContext';
import Header from './Header';
import Sidebar from './Sidebar';
import PermissionRoute from '../routes/PermissionRoute';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLarge, setIsLarge] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => {
      const large = window.innerWidth >= 1024;
      setIsLarge(large);
      if (large) setSidebarOpen(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const sidebarWidth = isLarge
    ? sidebarCollapsed
      ? 'lg:ml-16'
      : 'lg:ml-64'
    : '';

  return (
    <PageActionsProvider>
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark transition-colors">
          <Header
            onMenuToggle={() => setSidebarOpen((v) => !v)}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarCollapse={() => setSidebarCollapsed((v) => !v)}
            isLarge={isLarge}
          />
          <div className="flex pt-16">
            <Sidebar
              isOpen={sidebarOpen}
              setIsOpen={setSidebarOpen}
              collapsed={sidebarCollapsed}
              isLarge={isLarge}
            />
            <main className={`app-main ${sidebarWidth}`}>
              <div className="app-main-inner">
                <PermissionRoute>
                  <Outlet />
                </PermissionRoute>
              </div>
            </main>
          </div>
        </div>
      </PageActionsProvider>
  );
};

export default Layout;
