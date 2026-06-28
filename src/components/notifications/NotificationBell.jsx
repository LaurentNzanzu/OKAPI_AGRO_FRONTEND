// frontend/src/components/notifications/NotificationBell.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notificationsService, formatNotificationContent } from '../../services/notifications';
import { useNavigate } from 'react-router-dom';
import { safeNavigate } from '../../utils/safeNavigate';
import usePolling from '../../hooks/usePolling';
import AccessibleClickable from '../common/AccessibleClickable';
import { useTranslation } from '../../context/LanguageContext';
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { AppIcon } from '../ui/icons';

const NotificationBell = () => {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      
      // Vérifier si de nouvelles notifications sont arrivées
      if (count > unreadCount && unreadCount > 0) {
        setHasNewNotifications(true);
      }
      
      setUnreadCount(count);
      if (count > 0) {
        const all = await notificationsService.getAll();
        setRecentNotifs(all.filter(n => !n.est_lu).slice(0, 5));
      } else {
        setRecentNotifs([]);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Erreur chargement notifications', err);
      }
    }
  }, [unreadCount]);

  usePolling(fetchData, 15000);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        if (hasNewNotifications) setHasNewNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hasNewNotifications]);

  // Déterminer l'icône en fonction du type de notification
  const getNotificationIcon = (type) => {
    const typeMap = {
      'BESOIN_VALIDE': CheckCircleIcon,
      'BESOIN_REJETE': XCircleIcon,
      'STOCK_INSUFFISANT': ExclamationTriangleIcon,
      'ALERTE_VNC_ZERO': ExclamationTriangleIcon,
      'FOURNITURE_EN_ATTENTE': ClockIcon,
      'MAINTENANCE_PLANIFIEE': ClockIcon,
      'ALERTE_STOCK': ExclamationTriangleIcon,
      'BESOIN_CREE': DocumentTextIcon,
    };
    return typeMap[type] || BellIcon;
  };

  const getNotificationColor = (type) => {
    if (type === 'BESOIN_REJETE') return 'text-danger';
    if (type === 'BESOIN_VALIDE') return 'text-success';
    if (type === 'STOCK_INSUFFISANT' || type === 'ALERTE_VNC_ZERO') return 'text-danger';
    if (type === 'ALERTE_STOCK') return 'text-warning';
    return 'text-primary-600';
  };

  const handleNotifClick = async (notif) => {
    if (!notif.est_lu) await notificationsService.markAsRead(notif.id_notification);
    setIsOpen(false);
    if (notif.lien_action) safeNavigate(navigate, notif.lien_action);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifs([]);
    } catch (err) {
      console.error('Erreur marquage tout lu:', err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-full transition"
        aria-label={t('notifications')}
        aria-expanded={isOpen}
      >
        <AppIcon icon={BellIcon} size="md" className="text-gray-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 bg-danger text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${hasNewNotifications ? 'animate-pulse' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 modal-panel rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* En-tête */}
          <div className="p-3 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center border-b border-border-light dark:border-border-dark">
            <span className="font-semibold text-sm text-gray-700 dark:text-slate-300">
              {t('notifications')}
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-slate-400">
                  ({unreadCount} {t('notifications.unread')})
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button 
                type="button" 
                onClick={handleMarkAllRead}
                className="text-xs text-primary-600 hover:underline font-medium"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-64 overflow-y-auto">
            {recentNotifs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 dark:text-slate-500 text-sm">
                <AppIcon icon={BellIcon} size="lg" className="mx-auto mb-2 opacity-50" />
                {t('noNotifications')}
              </div>
            ) : (
              recentNotifs.map(notif => {
                const Icon = getNotificationIcon(notif.type_notification);
                const color = getNotificationColor(notif.type_notification);
                
                return (
                  <AccessibleClickable
                    key={notif.id_notification}
                    onClick={() => handleNotifClick(notif)}
                    ariaLabel={t('openNotification', { title: notif.titre })}
                    className="p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-gray-800 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full bg-opacity-10 ${color} bg-current shrink-0`}>
                        <AppIcon icon={Icon} size="sm" className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                            {notif.titre}
                          </p>
                          {!notif.est_lu && (
                            <span className="h-2 w-2 bg-primary-600 rounded-full mt-1.5 shrink-0" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {formatNotificationContent(notif.contenu)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          {new Date(notif.date_creation).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          {notif.type_notification && (
                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-night-muted rounded text-[10px]">
                              {notif.type_notification}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </AccessibleClickable>
                );
              })
            )}
          </div>

          {/* Pied */}
          <div className="p-2 text-center border-t bg-gray-50 dark:bg-slate-800/50">
            <button 
              type="button" 
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('seeAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;