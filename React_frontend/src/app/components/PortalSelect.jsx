import { useEffect, useState } from 'react';

export default function PortalSelect({ children, value: initialValue = '', onChange, ...props }) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);
  return (
    <select
      {...props}
      value={value}
      onChange={event => {
        setValue(event.target.value);
        onChange?.(event);
      }}
    >
      {children}
    </select>
  );
}
