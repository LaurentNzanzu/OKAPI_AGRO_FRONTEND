import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, CheckCircleIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import AppPage from '../ui/AppPage';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { notificationsService, formatNotificationContent, buildNotificationQueryParams } from '../../services/notifications';
import { useLanguage } from '../../context/LanguageContext';
import { safeNavigate } from '../../utils/safeNavigate';
import AccessibleClickable from '../common/AccessibleClickable';

const priorityClass = {
  critique: 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10',
  importante: 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10',
  information: 'border-l-4 border-l-primary-600 bg-primary-50/30 dark:bg-primary-900/10',
};

const HistoriqueNotifications = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [archivingId, setArchivingId] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const query = { limit: 100 };

      if (filter === 'unread') query.est_lu = false;
      else if (filter === 'read') query.est_lu = true;
      else if (filter === 'critical') query.priorite = 'critique';
      else if (filter === 'important') query.priorite = 'importante';

      const data = await notificationsService.getAll(buildNotificationQueryParams(query));
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id, lien) => {
    await notificationsService.markAsRead(id);
    fetchNotifications();
    if (lien) safeNavigate(navigate, lien);
  };

  const handleMarkAll = async () => {
    await notificationsService.markAllAsRead();
    fetchNotifications();
  };

  const handleArchive = async (id) => {
    try {
      setArchivingId(id);
      await notificationsService.archive(id);
      setNotifications((prev) => prev.filter((n) => n.id_notification !== id));
    } catch {
      // L'élément reste visible en cas d'échec
    } finally {
      setArchivingId(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const filters = [
    { id: 'all', label: t('filterAll') },
    { id: 'unread', label: t('filterUnread') },
    { id: 'read', label: t('filterRead') },
    { id: 'critical', label: t('filterCritical') },
    { id: 'important', label: t('filterImportant') },
  ];

  return (
    <AppPage>
      <PageHeader
        title={t('notificationsHistory')}
        subtitle={t('notificationsHistorySubtitle')}
        icon={BellIcon}
        actions={
          <Button variant="secondary" onClick={handleMarkAll}>
            {t('markAllRead')}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === f.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-border-light dark:border-border-dark text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-night-active'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <p className="text-center py-8 text-gray-500 dark:text-slate-400">{t('loading')}</p>
        ) : notifications.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-slate-400">
            {t('noNotificationsHistory')}
          </p>
        ) : (
          <ul className="divide-y divide-border-light dark:divide-border-dark">
            {notifications.map((n) => (
              <li
                key={n.id_notification}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  priorityClass[n.priorite] || priorityClass.information
                } ${!n.est_lu ? 'font-medium' : 'opacity-80'}`}
              >
                <AccessibleClickable
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleMarkRead(n.id_notification, n.lien_action)}
                  ariaLabel={`Ouvrir la notification : ${n.titre}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-900 dark:text-slate-100">{n.titre}</span>
                    {!n.est_lu && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-600 text-white">
                        {t('filterUnread')}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-slate-300 uppercase">
                      {n.type_notification}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">{formatNotificationContent(n.contenu)}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formatDate(n.date_creation)}</p>
                </AccessibleClickable>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.est_lu && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id_notification, null)}
                      className="header-icon-btn"
                      title={t('markAsRead')}
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleArchive(n.id_notification)}
                    disabled={archivingId === n.id_notification}
                    className="header-icon-btn disabled:opacity-50"
                    title="Archiver"
                  >
                    <ArchiveBoxIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppPage>
  );
};

export default HistoriqueNotifications;
