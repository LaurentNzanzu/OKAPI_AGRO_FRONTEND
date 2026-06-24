#!/usr/bin/env python3
"""Apply i18n replacements to React components."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src" / "components"

def patch_file(rel_path: str, patches: list[tuple[str, str]]) -> bool:
    fp = ROOT / rel_path
    if not fp.exists():
        print(f"MISSING {rel_path}")
        return False
    content = fp.read_text(encoding="utf-8")
    orig = content
    for old, new in patches:
        if old not in content:
            continue
        content = content.replace(old, new)
    if content != orig:
        fp.write_text(content, encoding="utf-8")
        print(f"UPDATED {rel_path}")
        return True
    print(f"UNCHANGED {rel_path}")
    return False

# NouvelleMaintenance
patch_file("maintenances/NouvelleMaintenance.jsx", [
    ("import { MAINTENANCE_TYPE_CONFIG, AppIcon, ArrowLeftIcon } from '../ui/icons';",
     "import { getMaintenanceTypeConfig, AppIcon, ArrowLeftIcon } from '../ui/icons';"),
    ("import React, { useState, useEffect } from 'react';",
     "import React, { useState, useEffect, useMemo } from 'react';"),
    ("  const { t } = useTranslation();\n    const navigate",
     "  const { t } = useTranslation();\n    const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);\n    const navigate"),
    ("setError(err.response?.data?.detail || 'Erreur lors de la création');",
     "setError(err.response?.data?.detail || t('maintenances.nouvelle.createError'));"),
    ("if (loading) return <div className=\"p-6 text-center\">Chargement...</div>;",
     "if (loading) return <div className=\"p-6 text-center\">{t('maintenances.nouvelle.loading')}</div>;"),
    ("<h1 className=\"text-2xl font-bold\">Planifier une maintenance</h1>",
     "<h1 className=\"text-2xl font-bold\">{t('maintenances.nouvelle.title')}</h1>"),
    ("<label className=\"block text-sm font-medium mb-1\">Bien concerné *</label>",
     "<label className=\"block text-sm font-medium mb-1\">{t('maintenances.nouvelle.bienLabel')}</label>"),
    ("<option value=\"\">Sélectionner un bien</option>",
     "<option value=\"\">{t('maintenances.nouvelle.selectBien')}</option>"),
    ("<label className=\"block text-sm font-medium mb-1\">Type de maintenance *</label>",
     "<label className=\"block text-sm font-medium mb-1\">{t('maintenances.nouvelle.typeLabel')}</label>"),
    ("Object.entries(MAINTENANCE_TYPE_CONFIG)",
     "Object.entries(maintenanceTypeConfig)"),
    ("<label className=\"block text-sm font-medium mb-1\">Date planifiée *</label>",
     "<label className=\"block text-sm font-medium mb-1\">{t('maintenances.nouvelle.dateLabel')}</label>"),
    ("<label className=\"block text-sm font-medium mb-1\">Description *</label>",
     "<label className=\"block text-sm font-medium mb-1\">{t('maintenances.nouvelle.descriptionLabel')}</label>"),
    ("<label className=\"block text-sm font-medium mb-1\">Périodicité (jours)</label>",
     "<label className=\"block text-sm font-medium mb-1\">{t('maintenances.nouvelle.periodiciteLabel')}</label>"),
    ('placeholder="Ex: 30"',
     "placeholder={t('maintenances.nouvelle.periodicitePlaceholder')}"),
    (">\n                        Annuler\n                    </button>",
     ">\n                        {t('common.cancel')}\n                    </button>"),
    ("{submitting ? 'Création...' : 'Planifier'}",
     "{submitting ? t('maintenances.nouvelle.submitting') : t('maintenances.nouvelle.submit')}"),
])

# PlanningMaintenance - icon config imports
patch_file("maintenances/PlanningMaintenance.jsx", [
    ("import React, { useState, useEffect, useCallback } from 'react';",
     "import React, { useState, useEffect, useCallback, useMemo } from 'react';"),
    ("    MAINTENANCE_TYPE_CONFIG,\n    MAINTENANCE_STATUT_CONFIG,",
     "    getMaintenanceTypeConfig,\n    getMaintenanceStatutConfig,"),
    ("  const { t } = useTranslation();\n    const navigate",
     "  const { t } = useTranslation();\n    const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);\n    const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);\n    const navigate"),
    ("    const FILTER_LABELS = {\n        all: { label: 'Toutes', Icon: ClipboardDocumentListIcon },\n        'a-venir': { label: 'À venir', Icon: CalendarDaysIcon },\n        'en-retard': { label: 'En retard', Icon: ExclamationTriangleIcon },\n        mes: { label: 'Mes interventions', Icon: UserIcon },\n    };",
     """    const FILTER_LABELS = useMemo(() => ({
        all: { label: t('maintenances.planning.filterAll'), Icon: ClipboardDocumentListIcon },
        'a-venir': { label: t('maintenances.planning.filterAVenir'), Icon: CalendarDaysIcon },
        'en-retard': { label: t('maintenances.planning.filterEnRetard'), Icon: ExclamationTriangleIcon },
        mes: { label: t('maintenances.planning.filterMes'), Icon: UserIcon },
    }), [t]);"""),
    ("const getTypeInfo = (type) => MAINTENANCE_TYPE_CONFIG[type] || MAINTENANCE_TYPE_CONFIG.PREVENTIVE;",
     "const getTypeInfo = (type) => maintenanceTypeConfig[type] || maintenanceTypeConfig.PREVENTIVE;"),
    ("const getStatutInfo = (statut) => MAINTENANCE_STATUT_CONFIG[statut] || MAINTENANCE_STATUT_CONFIG.PLANIFIEE;",
     "const getStatutInfo = (statut) => maintenanceStatutConfig[statut] || maintenanceStatutConfig.PLANIFIEE;"),
    ("setError('Impossible de charger les maintenances');",
     "setError(t('maintenances.planning.loadError'));"),
])

# ListeMaintenances
patch_file("maintenances/ListeMaintenances.jsx", [
    ("import React, { useState, useEffect, useCallback } from 'react';",
     "import React, { useState, useEffect, useCallback, useMemo } from 'react';"),
    ("  MAINTENANCE_TYPE_CONFIG,\n  MAINTENANCE_STATUT_CONFIG,",
     "  getMaintenanceTypeConfig,\n  getMaintenanceStatutConfig,"),
    ("  const { t } = useTranslation();\n",
     "  const { t } = useTranslation();\n    const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);\n    const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);\n"),
    ("    const TYPE_LABELS = MAINTENANCE_TYPE_CONFIG;\n    const STATUT_LABELS = MAINTENANCE_STATUT_CONFIG;",
     "    const TYPE_LABELS = maintenanceTypeConfig;\n    const STATUT_LABELS = maintenanceStatutConfig;"),
])

# FicheMaintenance + AlertesMaintenance icon imports
for f in ["maintenances/FicheMaintenance.jsx", "maintenances/AlertesMaintenance.jsx"]:
    patch_file(f, [
        ("import React, { useState, useEffect } from 'react';",
         "import React, { useState, useEffect, useMemo } from 'react';"),
        ("    MAINTENANCE_TYPE_CONFIG,\n    MAINTENANCE_STATUT_CONFIG,",
         "    getMaintenanceTypeConfig,\n    getMaintenanceStatutConfig,"),
        ("  const { t } = useTranslation();\n",
         "  const { t } = useTranslation();\n    const maintenanceTypeConfig = useMemo(() => getMaintenanceTypeConfig(t), [t]);\n    const maintenanceStatutConfig = useMemo(() => getMaintenanceStatutConfig(t), [t]);\n"),
        ("MAINTENANCE_TYPE_CONFIG[type] || MAINTENANCE_TYPE_CONFIG.PREVENTIVE",
         "maintenanceTypeConfig[type] || maintenanceTypeConfig.PREVENTIVE"),
        ("MAINTENANCE_STATUT_CONFIG[statut] || MAINTENANCE_STATUT_CONFIG.PLANIFIEE",
         "maintenanceStatutConfig[statut] || maintenanceStatutConfig.PLANIFIEE"),
    ])

print("Done phase 1")

# Phase 2: French UI strings -> t() calls
PHASE2 = {
"maintenances/PlanningMaintenance.jsx": [
    ("let errorMsg = 'Erreur lors de la planification';", "let errorMsg = t('maintenances.planning.planError');"),
    ("const field = e.loc?.slice(1)?.join('.') || 'champ';", "const field = e.loc?.slice(1)?.join('.') || t('common.errors.field');"),
    ("if (jours < 0) return { text: 'En retard', isLate: true };", "if (jours < 0) return { text: t('maintenances.planning.late'), isLate: true };"),
    ("if (jours === 0) return { text: \"Aujourd'hui\", isToday: true };", "if (jours === 0) return { text: t('maintenances.planning.today'), isToday: true };"),
    ("return { text: `${jours} jour(s) restant(s)`, isLate: false, isToday: false };",
     "return { text: t('maintenances.planning.daysRemaining', { count: jours }), isLate: false, isToday: false };"),
    ('return <div className="text-center py-12">Chargement du planning...</div>;',
     "return <div className=\"text-center py-12\">{t('maintenances.planning.loading')}</div>;"),
    ("Planning des maintenances", "{t('maintenances.planning.title')}"),
    ("Planifiez et suivez les interventions sur vos équipements", "{t('maintenances.planning.subtitle')}"),
    ("Nouvelle maintenance", "{t('maintenances.planning.newMaintenance')}"),
    ('placeholder="Rechercher..."', "placeholder={t('common.search')}"),
    ("Aucune maintenance trouvée", "{t('maintenances.planning.empty')}"),
    ("Planifier une maintenance →", "{t('maintenances.planning.planAction')}"),
    ("Bien: {m.bien_designation", "{t('maintenances.planning.bien')} {m.bien_designation"),
    ("Planifiée: {formatDate", "{t('maintenances.planning.planned')} {formatDate"),
    ("Début: {formatDate", "{t('maintenances.planning.start')} {formatDate"),
    ("Fin: {formatDate", "{t('maintenances.planning.end')} {formatDate"),
    (">Planifier une maintenance</h3>", ">{t('maintenances.planning.modalTitle')}</h3>"),
    ("Type de maintenance *", "{t('maintenances.planning.typeLabel')}"),
    ('<option value="PREVENTIVE">Préventive</option>\n                                    <option value="CORRECTIVE">Corrective</option>\n                                    <option value="PREDICTIVE">Prédictive</option>',
     "{Object.entries(maintenanceTypeConfig).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label}</option>))}"),
    ("Bien concerné *", "{t('maintenances.planning.bienLabel')}"),
    ('<option value="">Sélectionner un bien</option>', "<option value=\"\">{t('maintenances.planning.selectBien')}</option>"),
    ("Date planifiée *", "{t('maintenances.planning.dateLabel')}"),
    ("Description *", "{t('maintenances.planning.descriptionLabel')}"),
    ('placeholder="Décrivez l\'intervention à réaliser..."', "placeholder={t('maintenances.planning.descriptionPlaceholder')}"),
    ("Périodicité (jours)", "{t('maintenances.planning.periodiciteLabel')}"),
    ('placeholder="Ex: 30 (répéter tous les 30 jours)"', "placeholder={t('maintenances.planning.periodicitePlaceholder')}"),
    ("Si renseigné, une nouvelle maintenance sera automatiquement planifiée après chaque intervention.",
     "{t('maintenances.planning.periodiciteHint')}"),
    (">\n                                    Annuler\n                                </button>",
     ">\n                                    {t('common.cancel')}\n                                </button>"),
    ("{submitting ? 'Planification...' : (", "{submitting ? t('maintenances.planning.submitting') : ("),
    ("Planifier\n                                        </>", "{t('maintenances.planning.submit')}\n                                        </>"),
],
"maintenances/FicheMaintenance.jsx": [
    ("setError('Impossible de charger la maintenance');", "setError(t('maintenances.fiche.loadError'));"),
    ("alert(err.response?.data?.detail || 'Erreur lors du démarrage');", "alert(err.response?.data?.detail || t('maintenances.fiche.startError'));"),
    ("'Cette maintenance corrective est liée à une panne. À la clôture, le bien et la panne passeront en phase de test (EN_TEST). Confirmer ?'",
     "t('maintenances.fiche.closeConfirm')"),
    ("alert(err.response?.data?.detail || 'Erreur lors de la clôture');", "alert(err.response?.data?.detail || t('maintenances.fiche.closeError'));"),
    ("if (window.confirm('Annuler cette maintenance ?'))", "if (window.confirm(t('maintenances.fiche.cancelConfirm')))"),
    ("alert(err.response?.data?.detail || 'Erreur');", "alert(err.response?.data?.detail || t('common.errors.generic'));"),
    ('return <div className="text-center py-12">Chargement...</div>;', "return <div className=\"text-center py-12\">{t('maintenances.fiche.loading')}</div>;"),
    ("{error || 'Maintenance non trouvée'}", "{error || t('maintenances.fiche.notFound')}"),
    ("Maintenance #{maintenance.id_maintenance}", "{t('maintenances.fiche.title', { id: maintenance.id_maintenance })}"),
    ("Retour", "{t('maintenances.fiche.back')}"),
],
"maintenances/AlertesMaintenance.jsx": [
    ("setError('Impossible de charger les alertes');", "setError(t('maintenances.alertes.loadError'));"),
    ("let errorMsg = 'Erreur lors du report';", "let errorMsg = t('maintenances.alertes.reportError');"),
    ("if (window.confirm(`Annuler la maintenance \"${maintenance.description}\" ?`))",
     "if (window.confirm(t('maintenances.alertes.cancelConfirm', { description: maintenance.description })))"),
    ("setError(err.response?.data?.detail || 'Erreur lors de l\\'annulation');",
     "setError(err.response?.data?.detail || t('maintenances.alertes.cancelError'));"),
    ('Chargement des alertes...', "{t('maintenances.alertes.loading')}"),
    ("Alertes maintenances", "{t('maintenances.alertes.title')}"),
    (">Annuler<", ">{t('maintenances.alertes.annuler')}<"),
    ("Aucune alerte en cours", "{t('maintenances.alertes.noAlertes')}"),
    ("Toutes les maintenances sont à jour", "{t('maintenances.alertes.allUpToDate')}"),
    (">Reporter la maintenance</h3>", ">{t('maintenances.alertes.reporterTitle')}</h3>"),
],
"fournitures/FournituresEnAttente.jsx": [
    ('message="Chargement des fournitures..."', "message={t('common.loading')}"),
    ('title="Demandes de fourniture en attente"', "title={t('fournitures.attente.title')}"),
],
"depreciations/DepreciationHistory.jsx": [
    ("setError(err.response?.data?.detail || 'Impossible de charger l\\'historique');",
     "setError(err.response?.data?.detail || t('common.errors.generic'));"),
],
}

count = 0
for rel, patches in PHASE2.items():
    if patch_file(rel, patches):
        count += 1
print(f"Phase 2 updated {count} files")
