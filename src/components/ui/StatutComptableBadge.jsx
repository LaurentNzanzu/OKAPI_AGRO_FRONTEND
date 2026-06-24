// frontend/src/components/ui/StatutComptableBadge.jsx
import React from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { STATUT_COLORS, STATUT_ICONS, getStatutLabel } from '../../utils/statutHelpers';
import { AppIcon } from './icons';
import { CheckCircleIcon, PlayIcon, ExclamationTriangleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const ICON_MAP = {
    CheckCircleIcon,
    PlayIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    TrashIcon
};

const StatutComptableBadge = ({ statut, size = 'sm', className = '' }) => {
    const { t } = useTranslation();
    
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base'
    };
    
    const colorClass = STATUT_COLORS[statut] || 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';
    const iconName = STATUT_ICONS[statut] || 'CheckCircleIcon';
    const IconComponent = ICON_MAP[iconName] || CheckCircleIcon;
    const label = getStatutLabel(statut, t);
    
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${colorClass} ${className}`}>
            <AppIcon icon={IconComponent} size="xs" />
            {label}
        </span>
    );
};

export default StatutComptableBadge;