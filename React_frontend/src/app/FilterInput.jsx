import { useEffect, useState } from 'react';

// Keep the text controlled while a filter's API refresh is pending.
export default function FilterInput({ value: initialValue = '', onChange, ...inputProps }) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);

  return (
    <input
      {...inputProps}
      value={value}
      onChange={event => {
        setValue(event.target.value);
        onChange?.(event);
      }}
    />
  );
}
