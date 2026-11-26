export default function DashboardLayout({ sidebar, navbar }) {
  return (
    <div id="app">
      <div className="app-shell">
        <aside className="sidebar">{sidebar}</aside>
        <div className="main">
          <div className="topbar">{navbar}</div>
          <div className="page" id="page-content" />
        </div>
      </div>
    </div>
  );
}
