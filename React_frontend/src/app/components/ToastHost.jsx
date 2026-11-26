import { useEffect, useState } from 'react';

const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

export default function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const timers = new Set();
    const show = event => {
      const detail = event.detail || {};
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setItems(current => [
        ...current,
        { id, message: String(detail.message || ''), type: detail.type || 'info' },
      ]);
      const timer = window.setTimeout(() => {
        setItems(current => current.filter(item => item.id !== id));
        timers.delete(timer);
      }, 3800);
      timers.add(timer);
    };
    window.addEventListener('eventflow:toast', show);
    return () => {
      window.removeEventListener('eventflow:toast', show);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  return (
    <div id="toasts" aria-live="polite" aria-atomic="false">
      {items.map(item => (
        <div className={`toast ${item.type}`} key={item.id}>
          <span className="toast-icon" aria-hidden="true">
            {icons[item.type] || icons.info}
          </span>
          <span className="toast-msg">{item.message}</span>
        </div>
      ))}
    </div>
  );
}
