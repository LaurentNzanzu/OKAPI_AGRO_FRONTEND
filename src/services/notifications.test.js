import { describe, it, expect } from 'vitest';
import { buildNotificationQueryParams } from './notifications';

describe('buildNotificationQueryParams', () => {
  it('mappe le filtre non lues', () => {
    expect(buildNotificationQueryParams({ est_lu: false })).toEqual({
      limit: 100,
      est_lu: false,
    });
  });

  it('mappe le filtre lues', () => {
    expect(buildNotificationQueryParams({ est_lu: true })).toEqual({
      limit: 100,
      est_lu: true,
    });
  });

  it('mappe la priorité critique', () => {
    expect(buildNotificationQueryParams({ priorite: 'critique' })).toEqual({
      limit: 100,
      priorite: 'critique',
    });
  });

  it('n\'inclut pas include_archivees par défaut', () => {
    const params = buildNotificationQueryParams({});
    expect(params.include_archivees).toBeUndefined();
  });

  it('peut inclure les archivées', () => {
    expect(buildNotificationQueryParams({ include_archivees: true })).toEqual({
      limit: 100,
      include_archivees: true,
    });
  });
});
