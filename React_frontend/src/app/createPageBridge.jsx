import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

// Existing navigation and workflow handlers keep their entry points, while React owns each page.
export default function createPageBridge(PageContainer, pages) {
  let active = null;
  return {
    hasPage(page) {
      return pages.includes(page);
    },
    isCurrentPage(page) {
      return active?.page === page;
    },
    clear(container) {
      if (!active || active.container !== container) return;
      active.root.unmount();
      active = null;
    },
    render(container, page, data) {
      if (!container) return;
      if (active?.container !== container) {
        active?.root.unmount();
        container.replaceChildren();
        active = { container, root: createRoot(container) };
      }
      active.page = page;
      const key = `${page}:${data?.pageProps?.id || ''}`;
      flushSync(() =>
        active.root.render(<PageContainer key={key} page={page} initialData={data} />)
      );
    },
  };
}
