import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { notificationsService, formatNotificationContent } from '../services/notifications';
import {
  BellIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  BuildingOffice2Icon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { usePageActions } from '../context/PageActionsContext';
import { safeNavigate } from '../utils/safeNavigate';
import usePolling from '../hooks/usePolling';

const Header = ({ onMenuToggle, sidebarCollapsed, onSidebarCollapse, isLarge }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const { onExport, onPrint } = usePageActions();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);

      if (showNotifications || count > notifications.length) {
        setLoadingNotifs(true);
        const data = await notificationsService.getAll();
        setNotifications(data.slice(0, 5));
        setLoadingNotifs(false);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Erreur chargement notifications:', err);
      }
    }
  }, [user, showNotifications, notifications.length]);

  usePolling(fetchNotifications, 30000, { enabled: !!user });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (onMenuToggle) onMenuToggle();
    else window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const handleMarkAsRead = async (id, lien_action) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id_notification === id ? { ...n, est_lu: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (lien_action) {
        setShowNotifications(false);
        safeNavigate(navigate, lien_action);
      }
    } catch (err) {
      console.error('Erreur mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, est_lu: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur mark all read:', err);
    }
  };

  const getInitials = () => {
    const prenom = user?.prenom || '';
    const nom = user?.nom || '';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    const role = user?.roles?.[0] || user?.role?.nom || 'USER';
    const roleUpper = String(role).toUpperCase();
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      DG: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200',
      COMPTABLE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      TECHNICIEN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
      CAISSE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    };
    return colors[roleUpper] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getRoleLabel = () => {
    const role = user?.roles?.[0] || user?.role?.nom || 'USER';
    const roleUpper = String(role).toUpperCase();
    const roleAliases = {
      'DIRECTEUR GÉNÉRAL': 'DG',
      'DIRECTEUR GENERAL': 'DG',
      DIRECTEUR: 'DG',
      ADMINISTRATEUR: 'ADMIN',
      COMPTABLE: 'COMPTABLE',
      TECHNICIEN: 'TECHNICIEN',
      CAISSE: 'CAISSE',
      MAGASINIER: 'MAGASINIER',
    };
    const normalized = roleAliases[roleUpper] || roleUpper;
    const labels = {
      ADMIN: t('roleAdmin'),
      DG: t('roleDG'),
      COMPTABLE: t('roleComptable'),
      TECHNICIEN: t('roleTechnicien'),
      CAISSE: t('roleCaisse'),
      MAGASINIER: t('roleMagasinier'),
    };
    return labels[normalized] || role;
  };

  const formatTime = (dateString) => {
    if (!dateString) return t('justNow');
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header
      className="no-print fixed top-0 left-0 right-0 z-30 h-16
        bg-surface-light dark:bg-sidebar-dark
        border-b border-border-light dark:border-border-dark"
    >
      <div className="flex items-center justify-between w-full h-full px-4 md:px-6">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden header-icon-btn shrink-0"
            aria-label={t('menu')}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          {isLarge && onSidebarCollapse && (
            <button
              onClick={onSidebarCollapse}
              className="hidden lg:flex header-icon-btn shrink-0"
              aria-label={t('collapseSidebar')}
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}
          <div
            className="flex items-center gap-3 cursor-pointer min-w-0"
            onClick={() => navigate('/dashboard')}
          >
            <BuildingOffice2Icon className="w-7 h-7 text-primary-600 dark:text-slate-100 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
                {t('appTitle')}
              </h1>
              <p className="hidden sm:block text-xs text-gray-500 dark:text-slate-400 -mt-0.5 truncate">
                {t('appSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {actionMessage && (
            <span className="hidden md:block text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 max-w-[200px] truncate">
              {actionMessage}
            </span>
          )}

          <div className="hidden sm:flex items-center rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
            {['fr', 'en'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1.5 text-xs font-semibold uppercase transition-colors
                  ${
                    lang === l
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-night-active'
                  }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="header-icon-btn"
            aria-label={theme === 'light' ? t('darkMode') : t('lightMode')}
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5" />
            ) : (
              <SunIcon className="w-5 h-5" />
            )}
          </button>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="header-icon-btn relative"
              aria-label={t('notifications')}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-sidebar-dark">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[384px] rounded-xl shadow-dropdown
                  border border-border-light dark:border-border-dark overflow-hidden z-50
                  bg-surface-light dark:bg-surface-dark"
              >
                <div className="flex justify-between items-center px-4 py-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-night-active/50">
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                    {t('notifications')}
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary-600 dark:text-primary-200 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <CheckCircleIcon className="w-3 h-3" /> {t('markAllRead')}
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifs ? (
                    <div className="p-6 text-center text-gray-400 text-sm">{t('loading')}</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <BellIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {t('noNotifications')}
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id_notification}
                        onClick={() => handleMarkAsRead(notif.id_notification, notif.lien_action)}
                        className={`px-4 py-3 border-b border-border-light dark:border-border-dark cursor-pointer
                          hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative
                          ${!notif.est_lu ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}`}
                      >
                        {!notif.est_lu && (
                          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-600 rounded-full" />
                        )}
                        <div className={`pl-2 ${!notif.est_lu ? '' : 'opacity-80'}`}>
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-200 line-clamp-1">
                            {notif.titre}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {formatNotificationContent(notif.contenu)}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 text-right">
                            {formatTime(notif.date_creation)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div
                  className="p-2 text-center border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
                  onClick={() => navigate('/notifications')}
                >
                  <span className="text-xs text-primary-600 dark:text-primary-200 font-medium">
                    {t('seeAll')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={t('userMenu')}
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {getInitials()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  {user?.prenom} {user?.nom}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleBadge()}`}>
                  {getRoleLabel()}
                </span>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl shadow-dropdown
                  border border-border-light dark:border-border-dark overflow-hidden z-20
                  bg-surface-light dark:bg-surface-dark"
              >
                <div className="px-4 py-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                  <span
                    className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full ${getRoleBadge()}`}
                  >
                    {getRoleLabel()}
                  </span>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profil');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    {t('myProfile')}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/parametres');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4 text-gray-400" />
                    {t('settings')}
                  </button>
                  <hr className="my-1 border-border-light dark:border-border-dark" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;