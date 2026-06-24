import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Permissions granulaires — module Biens (et réutilisable ailleurs).
 * Aligné sur la matrice métier (ADMIN, GESTIONNAIRE/MANAGER, COMPTABLE, TECHNICIEN, MAGASINIER).
 */
export function usePermissions() {
  const { user, hasPermission, hasRole, hasAnyRole, authReady } = useAuth();

  return useMemo(() => {
    const isTechnicien = hasRole('TECHNICIEN');
    const isMagasinier = hasRole('MAGASINIER');

    const canViewBiensList = hasPermission('biens.view');
    const canViewPurchasePrice = hasPermission('biens.view.financial');
    const canCreateBien = hasPermission('biens.create');
    const canDeleteBien = hasPermission('biens.delete');
    const canEditBienFull = hasPermission('biens.update');
    const canEditBienTechnician = hasPermission('biens.update.limited');
    const canEditBien = canEditBienFull || canEditBienTechnician;
    const canViewQRCode = hasPermission('biens.view') || hasPermission('pieces.view');
    const canPreviewInventory = hasPermission('biens.inventory');

    const isTechnicianMode = isTechnicien && canEditBienTechnician && !canEditBienFull;

    return {
      user,
      authReady,
      isTechnicien,
      isMagasinier,
      isTechnicianMode,
      canViewBiensList,
      canViewPurchasePrice,
      canCreateBien,
      canDeleteBien,
      canEditBien,
      canEditBienFull,
      canEditBienTechnician,
      canViewQRCode,
      canPreviewInventory,
      hasRole,
      hasAnyRole,
      hasPermission,
    };
  }, [user, hasPermission, hasRole, hasAnyRole, authReady]);
}

export default usePermissions;
