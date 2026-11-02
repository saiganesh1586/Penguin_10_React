import { useEffect, useState } from 'react';

export default function ImageWithFallback({
  children,
  fallbackTag: Fallback = 'div',
  fallbackProps = {},
  ...imageProps
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageProps.src]);
  return (
    <>
      <img
        {...imageProps}
        style={{ ...imageProps.style, display: failed ? 'none' : imageProps.style?.display }}
        onError={() => setFailed(true)}
      />
      <Fallback
        {...fallbackProps}
        style={{
          ...fallbackProps.style,
          display: failed ? fallbackProps.style?.display || 'block' : 'none',
        }}
      >
        {children}
      </Fallback>
    </>
  );
}
