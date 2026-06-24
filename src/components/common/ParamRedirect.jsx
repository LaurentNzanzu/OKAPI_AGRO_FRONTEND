import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Redirige vers une route en remplaçant les paramètres (:id, :bienId, …).
 */
const ParamRedirect = ({ to, search = '' }) => {
  const params = useParams();

  let pathname = to;
  Object.entries(params).forEach(([key, value]) => {
    pathname = pathname.replace(`:${key}`, String(value));
  });

  let resolvedSearch = search;
  Object.entries(params).forEach(([key, value]) => {
    resolvedSearch = resolvedSearch.replace(`:${key}`, String(value));
  });

  const target = resolvedSearch ? `${pathname}${resolvedSearch}` : pathname;
  return <Navigate to={target} replace />;
};

export default ParamRedirect;
