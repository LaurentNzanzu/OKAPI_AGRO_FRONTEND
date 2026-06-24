// frontend/src/services/roles.js
import api from './api';

/**
 * Récupère le catalogue de toutes les permissions
 */
export const getPermissionsCatalog = async () => {
    try {
        const response = await api.get('/roles/permissions/catalog');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération du catalogue de permissions:', error);
        throw error;
    }
};

/**
 * Récupère la liste de tous les rôles
 */
export const getRoles = async () => {
    try {
        const response = await api.get('/roles/');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des rôles:', error);
        throw error;
    }
};

/**
 * Récupère un rôle par son ID
 */
export const getRoleById = async (id) => {
    try {
        const response = await api.get(`/roles/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la récupération du rôle ${id}:`, error);
        throw error;
    }
};

/**
 * Crée un nouveau rôle
 */
export const createRole = async (roleData) => {
    try {
        const response = await api.post('/roles', roleData);
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la création du rôle:', error);
        throw error;
    }
};

/**
 * Met à jour un rôle existant
 */
export const updateRole = async (id, roleData) => {
    try {
        const response = await api.put(`/roles/${id}`, roleData);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du rôle ${id}:`, error);
        throw error;
    }
};

/**
 * Supprime un rôle
 */
export const deleteRole = async (id) => {
    try {
        const response = await api.delete(`/roles/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la suppression du rôle ${id}:`, error);
        throw error;
    }
};

/**
 * Récupère les permissions d'un rôle
 */
export const getRolePermissions = async (roleId) => {
    try {
        const response = await api.get(`/roles/${roleId}/permissions`);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des permissions du rôle ${roleId}:`, error);
        throw error;
    }
};

/**
 * Met à jour les permissions d'un rôle
 */
export const updateRolePermissions = async (roleId, permissions) => {
    try {
        const response = await api.put(`/roles/${roleId}/permissions`, { permissions });
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour des permissions du rôle ${roleId}:`, error);
        throw error;
    }
};

/**
 * Récupère tous les rôles avec leurs utilisateurs associés
 */
export const getRolesWithUsers = async () => {
    try {
        const response = await api.get('/roles/with-users');
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la récupération des rôles avec utilisateurs:', error);
        throw error;
    }
};

/**
 * Assigne un rôle à un utilisateur
 */
export const assignRoleToUser = async (userId, roleId) => {
    try {
        const response = await api.post(`/utilisateurs/${userId}/roles/${roleId}`);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de l'assignation du rôle ${roleId} à l'utilisateur ${userId}:`, error);
        throw error;
    }
};

/**
 * Retire un rôle à un utilisateur
 */
export const removeRoleFromUser = async (userId, roleId) => {
    try {
        const response = await api.delete(`/utilisateurs/${userId}/roles/${roleId}`);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors du retrait du rôle ${roleId} de l'utilisateur ${userId}:`, error);
        throw error;
    }
};

/**
 * Récupère les rôles disponibles pour un utilisateur
 */
export const getAvailableRolesForUser = async (userId) => {
    try {
        const response = await api.get(`/utilisateurs/${userId}/roles-disponibles`);
        return response.data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des rôles disponibles pour l'utilisateur ${userId}:`, error);
        throw error;
    }
};

export default {
    getPermissionsCatalog,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    updateRolePermissions,
    getRolesWithUsers,
    assignRoleToUser,
    removeRoleFromUser,
    getAvailableRolesForUser
};