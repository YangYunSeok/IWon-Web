import React, { useEffect } from 'react';
import { usePerm } from '@/authz/PermissionStore';

/**
 * Global permission enforcer.
 * - Only affects elements that explicitly declare an auth/data-auth attribute.
 * - If attribute is missing, it does nothing (fail-open for untagged elements).
 * - Supports OR: "SAVE|EXPORT" or "SAVE,EXPORT", AND: "SAVE&APPROVE", PUBLIC: "PUBLIC".
 */
function parseAuthExpr(expr) {
  if (!expr) return { type: 'NONE', tokens: [] };
  const s = String(expr).trim().toUpperCase();
  if (s === 'PUBLIC') return { type: 'PUBLIC', tokens: [] };
  if (s.includes('&')) return { type: 'AND', tokens: s.split('&').map(t => t.trim()).filter(Boolean) };
  const tokens = s.split(/\||,/).map(t => t.trim()).filter(Boolean);
  return { type: 'OR', tokens };
}

function isAllowed(allowedSet, expr) {
  const { type, tokens } = parseAuthExpr(expr);
  if (type === 'PUBLIC') return true;
  if (type === 'AND') return tokens.length > 0 && tokens.every(t => allowedSet.has(t));
  if (type === 'OR')  return tokens.length > 0 && tokens.some(t => allowedSet.has(t));
  return false; // NONE
}

export default function PermissionEnforcer({ children, scopeSelector = '#app-content-root', audit = false }) {
  const { allowed, setActive } = usePerm();

  // Observe and enforce on subtree mutations
  useEffect(() => {
    const root =
      document.querySelector(scopeSelector) ||
      document.getElementById('root') ||
      document.body;

    const enforce = () => {
      const allow = allowed(); // Set<string>

      // Query only elements that declare permission attributes
      const selectors = [
        `${scopeSelector} [auth]`,
        `${scopeSelector} [data-auth]`,
        // Also cover common portals: modal/dropdown/popover/drawer
        `.ant-modal [auth]`, `.ant-modal [data-auth]`,
        `.ant-dropdown [auth]`, `.ant-dropdown [data-auth]`,
        `.ant-popover [auth]`, `.ant-popover [data-auth]`,
        `.ant-drawer [auth]`, `.ant-drawer [data-auth]`,
      ].join(',');

      const nodes = document.querySelectorAll(selectors);
      nodes.forEach(node => {
        const authAttr = node.getAttribute('auth') ?? node.getAttribute('data-auth');
        const ok = isAllowed(allow, authAttr);
        if (ok) {
          node.classList.remove('perm-hidden');
          if ('disabled' in node) node.disabled = false;
          if (audit) node.setAttribute('data-perm-audit', `ALLOW:${authAttr}`);
        } else {
          node.classList.add('perm-hidden');
          if (audit) node.setAttribute('data-perm-audit', `DENY:${authAttr}`);
        }
      });
    };

    enforce();
    const obs = new MutationObserver(() => enforce());
    obs.observe(root, { subtree: true, childList: true });
    // Also observe body portals (modals etc.)
    obs.observe(document.body, { subtree: true, childList: true });

    return () => obs.disconnect();
  }, [allowed, scopeSelector, audit]);

  return <>{children}</>;
}
