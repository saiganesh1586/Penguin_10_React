import React from 'react';

export default function LegacyPageMarkup({ html }) {
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}
