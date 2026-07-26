import { getAdminConnection } from '../config/db.js';

/**
 * Lazy model proxy bound to the Admin Access Control connection (MONGODB_ADMIN).
 * Keeps existing `Organization.find()`-style imports working across two DBs.
 */
export function createAccessModelProxy(name, schema, collection) {
  const getModel = () => {
    const conn = getAdminConnection();
    if (!conn) {
      throw new Error('Admin database not connected (set MONGODB_ADMIN)');
    }
    return conn.models[name] || conn.model(name, schema, collection);
  };

  return new Proxy(function AccessModelProxy() {}, {
    construct(_target, args) {
      const Model = getModel();
      return Reflect.construct(Model, args);
    },
    get(_target, prop) {
      if (prop === 'prototype') return getModel().prototype;
      if (prop === 'name') return name;
      const model = getModel();
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    },
  });
}
