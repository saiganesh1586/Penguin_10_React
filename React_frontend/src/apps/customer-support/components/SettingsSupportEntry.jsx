import { canRequestSupport } from '../utils/supportConfig.js';

export default function SettingsSupportEntry({ user, onNavigate }) {
  if (!onNavigate || !canRequestSupport(user)) return null;

  return (
    <div className="card support-settings-entry">
      <button
        className="btn btn-ghost"
        type="button"
        onClick={() => onNavigate('customer-support')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
          <path d="M4 12h3v7H6a2 2 0 0 1-2-2v-5Zm16 0h-3v7h1a2 2 0 0 0 2-2v-5ZM17 19a5 5 0 0 1-5 3" />
        </svg>
        <span>Customer Support</span>
      </button>
    </div>
  );
}
