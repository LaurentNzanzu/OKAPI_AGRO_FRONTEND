// frontend/src/components/common/Header.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import "../../styles/components/header.css";
import {
  AppIcon,
  BellAlertIcon,
  UserIcon,
  Cog8ToothIcon,
  ArrowRightOnRectangleIcon,
} from '../ui/icons';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    // Événement personnalisé pour ouvrir/fermer la sidebar sur mobile
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };

  const getRoleBadgeClass = (role) => {
    const badges = {
      'ADMIN': 'badge-admin',
      'DG': 'badge-dg', 
      'COMPTABLE': 'badge-comptable',
      'TECHNICIEN': 'badge-technicien',
      'CAISSE': 'badge-caisse'
    };
    return badges[role] || 'badge-default';
  };

  // Notifications fictives (à remplacer par un appel API)
  const notifications = [
    { id: 1, message: 'Nouvelle panne déclarée #4528', read: false, time: '2 min' },
    { id: 2, message: 'Maintenance préventive dans 3 jours', read: true, time: '1h' },
    { id: 3, message: 'Validation en attente : Achat pièces', read: false, time: '3h' }
  ];
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="main-header">
      {/* Logo et titre */}
      <div className="header-left">
        <button className="mobile-toggle" onClick={toggleMenu} aria-label="Menu">
          <span className="hamburger"></span>
        </button>
        <div className="logo">
          <span className="logo-icon">🏢</span>
          <h1>Gestion Immobilisations</h1>
        </div>
      </div>

      {/* Zone droite : user + notifications */}
      <div className="header-right">
        {/* Notifications */}
        <div className="notification-wrapper">
          <button 
            className="notification-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <span className="notification-icon">
              <AppIcon icon={BellAlertIcon} size="md" />
            </span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                <button className="mark-all-read">Tout marquer comme lu</button>
              </div>
              <div className="notification-list">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">{notif.time}</span>
                  </div>
                ))}
              </div>
              <div className="notification-footer">
                <button>Voir toutes les notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Menu utilisateur */}
        <div className="user-menu">
          <div 
            className="user-info" 
            onClick={() => setShowMenu(!showMenu)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowMenu(!showMenu)}
          >
            <div className="user-avatar">
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.prenom} {user?.nom}
              </span>
              {user?.roles?.[0] && (
                <span className={`user-role ${getRoleBadgeClass(user.roles[0])}`}>
                  {user.roles[0]}
                </span>
              )}
            </div>
            <span className="dropdown-arrow">▼</span>
          </div>

          {showMenu && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={() => navigate('/profil')}>
                <AppIcon icon={UserIcon} size="sm" className="inline mr-2" />
                Mon profil
              </button>
              <button className="dropdown-item" onClick={() => navigate('/parametres')}>
                <AppIcon icon={Cog8ToothIcon} size="sm" className="inline mr-2" />
                Paramètres
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <AppIcon icon={ArrowRightOnRectangleIcon} size="sm" className="inline mr-2" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;