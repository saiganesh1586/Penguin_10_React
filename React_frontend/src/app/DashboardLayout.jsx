export default function DashboardLayout({ sidebar, navbar }) {
  return (
    <div id="app">
      <div className="app-shell">
        {sidebar}
        <div className="main">
          {navbar}
          <div className="page" id="page-content" />
        </div>
      </div>
    </div>
  );
}
