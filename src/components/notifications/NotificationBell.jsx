import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notificationsService, formatNotificationContent } from '../../services/notifications';
import { useNavigate } from 'react-router-dom';
import { safeNavigate } from '../../utils/safeNavigate';
import usePolling from '../../hooks/usePolling';
import AccessibleClickable from '../common/AccessibleClickable';
import { useTranslation } from '../../context/LanguageContext';

const NotificationBell = () => {
    const { t } = useTranslation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [recentNotifs, setRecentNotifs] = useState([]);
    const navigate = useNavigate();
    const ref = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const count = await notificationsService.getUnreadCount();
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
    }, []);

    usePolling(fetchData, 30000);

    useEffect(() => {
        const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotifClick = async (notif) => {
        if (!notif.est_lu) await notificationsService.markAsRead(notif.id_notification);
        setIsOpen(false);
        if (notif.lien_action) safeNavigate(navigate, notif.lien_action);
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 modal-panel rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center border-b">
                        <span className="font-semibold text-sm text-gray-700 dark:text-slate-300">{t('notifications')}</span>
                        {unreadCount > 0 && <button type="button" onClick={notificationsService.markAllAsRead} className="text-xs text-primary-600 hover:underline font-medium">{t('markAllRead')}</button>}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {recentNotifs.length === 0 ? (
                            <p className="p-6 text-center text-gray-400 dark:text-slate-500 text-sm">{t('noNotifications')}</p>
                        ) : recentNotifs.map(n => (
                            <AccessibleClickable
                                key={n.id_notification}
                                onClick={() => handleNotifClick(n)}
                                ariaLabel={t('openNotification', { title: n.titre })}
                                className="p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 dark:bg-slate-800/50 dark:hover:bg-gray-800 transition"
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{n.titre}</p>
                                    {!n.est_lu && <span className="h-2 w-2 bg-primary-600 rounded-full mt-1.5 shrink-0" aria-hidden="true" />}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{formatNotificationContent(n.contenu)}</p>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{new Date(n.date_creation).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
                            </AccessibleClickable>
                        ))}
                    </div>
                    <div className="p-2 text-center border-t bg-gray-50 dark:bg-slate-800/50">
                        <button type="button" onClick={() => { setIsOpen(false); navigate('/notifications'); }} className="text-xs text-primary-600 hover:text-primary-700 font-medium">{t('seeAll')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default NotificationBell;
