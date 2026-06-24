import React from 'react';

/**
 * Conteneur standard pour toutes les pages internes protégées.
 * Garantit espacements, largeur max et cohérence responsive.
 */
const AppPage = ({ children, className = '' }) => (
  <div className={`app-page ${className}`}>{children}</div>
);

export default AppPage;
