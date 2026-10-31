// Route modules that are split out of the main bundle. Calling one starts the download early;
// React.lazy reuses the same promise, so hovering a nav link makes the page appear instantly on click.
export const pages = {
  '/dashboard': () => import('../pages/ops/Dashboard.jsx'),
  '/reports': () => import('../pages/ops/Reports.jsx'),
};
export const preload = (to) => pages[to]?.();
