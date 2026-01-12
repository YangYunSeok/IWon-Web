import React, { createContext, useContext, useMemo, useState } from 'react';

/** Convert "Search|Save|Deploy" to Set("SEARCH","SAVE","DEPLOY") */
function toSet(butnId) {
  if (!butnId) return new Set();
  return new Set(
    String(butnId)
      .split('|')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
  );
}

const Ctx = createContext(null);

/** Provides active menuId and its allowed button set to the app */
export function PermissionProvider({ children }) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [byMenu, setByMenu] = useState({}); // { [menuId]: Set<string> }

  const api = useMemo(() => ({
    /** Called on menu click (or tab activate) */
    setActive(menuId, butnId) {
      if (!menuId && !butnId) return;
      if (menuId) setActiveMenuId(String(menuId));
      if (menuId && butnId !== undefined) {
        setByMenu(prev => ({ ...prev, [String(menuId)]: toSet(butnId) }));
      }
    },
    /** Returns Set<string> of allowed actions for current active menu */
    allowed() {
      const set = (activeMenuId && byMenu[activeMenuId]) || new Set();
      return set;
    },
    getActiveMenuId() { return activeMenuId; },
  }), [activeMenuId, byMenu]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePerm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('wrap App with <PermissionProvider>');
  return ctx;
}
