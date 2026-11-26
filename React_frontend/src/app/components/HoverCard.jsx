import { useState } from 'react';

export default function HoverCard({ children, style, ...props }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      {...props}
      style={{
        ...style,
        transform: hovered ? 'translateY(-2px)' : '',
        boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.12)' : '',
      }}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      {children}
    </div>
  );
}
