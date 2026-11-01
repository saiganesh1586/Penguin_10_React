import React from 'react';

export default function LegacyPageMarkup({ html }) {
  // Preserve the existing page layout while React hosts HTML from the portal renderers.
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}
