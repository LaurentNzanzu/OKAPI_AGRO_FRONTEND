import { describe, it, expect } from 'vitest';
import {
  userHasPermission,
  userHasAnyPermission,
  userCanAccessPath,
  getRoutePermissions,
} from './permissions';

const technicien = { roles: ['TECHNICIEN'], permissions: [] };
const gestionnaire = { roles: ['GESTIONNAIRE'], permissions: [] };
const magasinier = { roles: ['MAGASINIER'], permissions: [] };
const comptable = { roles: ['COMPTABLE'], permissions: [] };

describe('permissions biens — matrice TECHNICIEN', () => {
  it('technicien peut voir la liste des biens', () => {
    expect(userHasPermission(technicien, 'biens.view')).toBe(true);
    expect(userCanAccessPath(technicien, '/biens')).toBe(true);
  });

  it('technicien ne peut pas voir les données financières', () => {
    expect(userHasPermission(technicien, 'biens.view.financial')).toBe(false);
  });

  it('technicien ne peut pas créer ni supprimer un bien', () => {
    expect(userHasPermission(technicien, 'biens.create')).toBe(false);
    expect(userHasPermission(technicien, 'biens.delete')).toBe(false);
  });

  it('technicien peut modifier en mode limité mais pas en mode complet', () => {
    expect(userHasPermission(technicien, 'biens.update')).toBe(false);
    expect(userHasPermission(technicien, 'biens.update.limited')).toBe(true);
  });

  it('technicien peut accéder à la page édition via permission limitée', () => {
    expect(getRoutePermissions('/biens/42/edit')).toContain('biens.update.limited');
    expect(userCanAccessPath(technicien, '/biens/42/edit')).toBe(true);
  });

  it('technicien ne peut pas accéder à l\'aperçu inventaire', () => {
    expect(userHasPermission(technicien, 'biens.inventory')).toBe(false);
  });

  it('magasinier ne peut pas accéder aux biens', () => {
    expect(userCanAccessPath(magasinier, '/biens')).toBe(false);
  });

  it('gestionnaire a tous les droits biens sauf admin', () => {
    expect(userHasPermission(gestionnaire, 'biens.view.financial')).toBe(true);
    expect(userHasPermission(gestionnaire, 'biens.delete')).toBe(true);
    expect(userHasPermission(gestionnaire, 'biens.inventory')).toBe(true);
  });

  it('comptable peut modifier mais pas supprimer', () => {
    expect(userHasPermission(comptable, 'biens.update')).toBe(true);
    expect(userHasPermission(comptable, 'biens.delete')).toBe(false);
  });

  it('userHasAnyPermission accepte une liste de permissions', () => {
    expect(userHasAnyPermission(technicien, ['biens.update', 'biens.update.limited'])).toBe(true);
    expect(userHasAnyPermission(magasinier, ['biens.view', 'biens.create'])).toBe(false);
  });
});

describe('permissions plan comptable', () => {
  it('admin a toutes les permissions plan comptable', () => {
    expect(userHasPermission(admin, 'plan_comptable.view')).toBe(true);
    expect(userHasPermission(admin, 'plan_comptable.create')).toBe(true);
    expect(userHasPermission(admin, 'plan_comptable.update')).toBe(true);
    expect(userHasPermission(admin, 'plan_comptable.delete')).toBe(true);
    expect(userCanAccessPath(admin, '/plan-comptable')).toBe(true);
  });

  it('comptable a toutes les permissions plan comptable', () => {
    expect(userHasPermission(comptable, 'plan_comptable.view')).toBe(true);
    expect(userHasPermission(comptable, 'plan_comptable.create')).toBe(true);
    expect(userHasPermission(comptable, 'plan_comptable.update')).toBe(true);
    expect(userHasPermission(comptable, 'plan_comptable.delete')).toBe(true);
    expect(userCanAccessPath(comptable, '/plan-comptable')).toBe(true);
  });

  it('dg a uniquement la permission de consultation du plan comptable', () => {
    expect(userHasPermission(dg, 'plan_comptable.view')).toBe(true);
    expect(userHasPermission(dg, 'plan_comptable.create')).toBe(false);
    expect(userHasPermission(dg, 'plan_comptable.update')).toBe(false);
    expect(userHasPermission(dg, 'plan_comptable.delete')).toBe(false);
    expect(userCanAccessPath(dg, '/plan-comptable')).toBe(true);
  });

  it('technicien n\'a pas accès au plan comptable', () => {
    expect(userHasPermission(technicien, 'plan_comptable.view')).toBe(false);
    expect(userCanAccessPath(technicien, '/plan-comptable')).toBe(false);
  });

  it('magasinier n\'a pas accès au plan comptable', () => {
    expect(userHasPermission(magasinier, 'plan_comptable.view')).toBe(false);
    expect(userCanAccessPath(magasinier, '/plan-comptable')).toBe(false);
  });

  it('gestionnaire n\'a pas accès au plan comptable', () => {
    expect(userHasPermission(gestionnaire, 'plan_comptable.view')).toBe(false);
    expect(userCanAccessPath(gestionnaire, '/plan-comptable')).toBe(false);
  });
});
