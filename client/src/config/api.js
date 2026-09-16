// client/src/config/api.js
/**
 * Centralized API URL resolver for Blast Crackers.
 * Supports:
 * - Unified single-domain deployment (empty VITE_API_URL -> relative /api/...)
 * - Split deployment (e.g. Vercel frontend pointing to Render backend)
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function apiUrl(path = '') {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export default apiUrl;
