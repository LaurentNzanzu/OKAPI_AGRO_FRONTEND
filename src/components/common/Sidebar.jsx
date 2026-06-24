// frontend/src/components/common/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import "../../styles/components/sidebar.css";
import {
  AppIcon,
  ChartBarIcon,
  UserGroupIcon,
  BookmarkIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  CubeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  Cog8ToothIcon,
  XMarkIcon,
} from '../ui/icons';

const renderMenuIcon = (Icon) => (
  <span className="menu-icon">
    <AppIcon icon={Icon} size="md" />
  </span>
);

const Sidebar = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // ✅ Fonction intelligente pour vérifier les rôles (insensible à la casse et aux espaces)
  const hasRequiredRole = (roles) => {
    if (!roles || roles.length === 0) return true;
    if (!user || !user.roles) return false;
    
    // Normaliser les rôles de l'utilisateur
    let userRoles = [];
    if (Array.isArray(user.roles)) {
      userRoles = user.roles;
    } else if (typeof user.roles === 'string') {
      userRoles = [user.roles];
    } else if (user.role) {
      userRoles = [user.role];
    }
    
    // Normaliser : trim + uppercase
    userRoles = userRoles.map(r => String(r).trim().toUpperCase());
    
    // Vérifier si au moins un rôle correspond
    return roles.some(requiredRole => {
      const normalizedRequired = String(requiredRole).trim().toUpperCase();
      return userRoles.includes(normalizedRequired);
    });
  };

  // Gestion de l'ouverture/fermeture sur mobile
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fermer le menu sur mobile après un clic
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  // Menu items avec permissions par rôle
  const menuItems = [
    {
      title: 'Tableau de bord',
      path: '/dashboard',
      Icon: ChartBarIcon,
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN', 'CAISSE'],
    },
    {
      title: 'Utilisateurs',
      path: '/utilisateurs',
      Icon: UserGroupIcon,
      roles: ['ADMIN'],
    },
    {
      title: 'Biens',
      Icon: BookmarkIcon,
      roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'],
      children: [
        { title: 'Tous les biens', path: '/biens', roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'] },
        {title: 'Save Biens', path: '/biens/nouveau', roles: ['ADMIN']},
        {title: 'voir bien', path: '/biens', roles: ['ADMIN']},
        {title: 'modifier bien', path: '/biens', roles: ['ADMIN']},
        { title: 'Véhicules', path: '/biens/vehicules', roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'] },
        { title: 'Machines', path: '/biens/machines', roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'] },
        { title: 'Ordinateurs', path: '/biens/ordinateurs', roles: ['ADMIN', 'DG', 'COMPTABLE', 'TECHNICIEN'] },
      ]
    },
    {
      title: 'Pannes',
      path: '/pannes',
      Icon: ExclamationTriangleIcon,
      roles: ['ADMIN', 'TECHNICIEN', 'DG'],
    },
    {
      title: 'Maintenances',
      path: '/maintenances',
      Icon: WrenchScrewdriverIcon,
      roles: ['ADMIN', 'TECHNICIEN', 'DG'],
    },
    {
      title: 'Amortissements',
      path: '/amortissements',
      Icon: DocumentChartBarIcon,
      roles: ['ADMIN', 'COMPTABLE', 'DG'],
    },
    {
      title: 'Validations',
      path: '/validations',
      Icon: ShieldCheckIcon,
      roles: ['ADMIN', 'DG', 'COMPTABLE'],
    },
    {
      title: 'Pièces',
      path: '/pieces',
      Icon: CubeIcon,
      roles: ['ADMIN', 'TECHNICIEN', 'COMPTABLE'],
    },
    {
      title: 'Rapports',
      path: '/rapports',
      Icon: DocumentTextIcon,
      roles: ['ADMIN', 'DG', 'COMPTABLE'],
    },
    {
      title: 'Audit',
      path: '/audit',
      Icon: MagnifyingGlassIcon,
      roles: ['ADMIN', 'DG'],
    },
    {
      title: 'Paramètres',
      path: '/parametres',
      Icon: Cog8ToothIcon,
      roles: ['ADMIN'],
    },
  ];

  // ✅ Fonction de filtrage CORRIGÉE
  const filterByRole = (item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!user) return false;
    
    // Utiliser la fonction intelligente
    return hasRequiredRole(item.roles);
  };

  const toggleSubmenu = (index) => {
    setActiveSubmenu(activeSubmenu === index ? null : index);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!isOpen) {
    return (
      <aside className="sidebar sidebar-collapsed">
        <button className="sidebar-toggle" onClick={() => setIsOpen(true)}>
          ☰
        </button>
        <nav className="sidebar-nav">
          {menuItems.filter(filterByRole).map((item, index) => (
            item.path ? (
              <NavLink
                key={index}
                to={item.path}
                className="nav-icon-only"
                title={item.title}
                onClick={handleNavClick}
              >
                <span className="nav-icon"><AppIcon icon={item.Icon} size="md" /></span>
              </NavLink>
            ) : (
              <div key={index} className="nav-icon-only" title={item.title}>
                <span className="nav-icon"><AppIcon icon={item.Icon} size="md" /></span>
              </div>
            )
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <>
      {/* Overlay pour mobile */}
      {window.innerWidth < 1024 && isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} role="presentation" aria-hidden="true" />
      )}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Fermer">
          <AppIcon icon={XMarkIcon} size="md" />
        </button>
        
        <nav className="sidebar-nav">
          {menuItems.filter(filterByRole).map((item, index) => {
            if (item.children) {
              const hasActiveChild = item.children.some(child => 
                filterByRole(child) && isActive(child.path)
              );
              const isSubmenuOpen = activeSubmenu === index || hasActiveChild;

              return (
                <div key={index} className="menu-item has-children">
                  <div 
                    className={`menu-title ${isSubmenuOpen ? 'open' : ''}`}
                    onClick={() => toggleSubmenu(index)}
                  >
                    {renderMenuIcon(item.Icon)}
                    <span className="menu-text">{item.title}</span>
                    <span className="menu-arrow">{isSubmenuOpen ? '▼' : '▶'}</span>
                  </div>
                  {isSubmenuOpen && (
                    <div className="submenu">
                      {item.children.filter(filterByRole).map((child, childIndex) => (
                        <NavLink
                          key={childIndex}
                          to={child.path}
                          className={({ isActive }) => 
                            `submenu-item ${isActive ? 'active' : ''}`
                          }
                          onClick={handleNavClick}
                        >
                          {child.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) => 
                  `menu-item ${isActive ? 'active' : ''}`
                }
                onClick={handleNavClick}
              >
                {renderMenuIcon(item.Icon)}
                <span className="menu-text">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;