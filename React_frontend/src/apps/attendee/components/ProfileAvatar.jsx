import React, { useState } from 'react';

export default function ProfileAvatar({ name = '', image, fallback, size = 'av-xl' }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <div className={`av ${size}`}>
    {image && !imageFailed ? <img src={image} alt={name} onError={() => setImageFailed(true)} />
      : fallback || name[0] || '?'}
  </div>;
}
