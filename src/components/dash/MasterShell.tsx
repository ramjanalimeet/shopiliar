// The master admin shell (/master-admin): users, messages, templates, payments, plans and activity
const I = ({ name }: { name: string }) => <span data-icon={name} />;

export default function MasterShell() {
  return (
    <div className="app">
      <aside className="side" aria-label="Master admin navigation">
        <a className="brand" href="/"><img className="brand-mark" src="/assets/logo.webp" width="34" height="34" alt="" />Shopilier<small>Admin</small></a>
        <nav className="side-nav">
          <a className="nav-item" data-route="overview" href="#/overview"><I name="home" />Overview</a>
          <a className="nav-item" data-route="users" href="#/users"><I name="customers" />Users<span className="count" id="count-users" /></a>
          <a className="nav-item" data-route="messages" href="#/messages"><I name="mail" />Messages<span className="count" id="msg-count" /></a>
          <a className="nav-item" data-route="templates" href="#/templates"><I name="layout" />Templates<span className="count" id="count-templates" /></a>
          <a className="nav-item" data-route="payments" href="#/payments"><I name="money" />Payments<span className="count" id="count-due" /></a>
          <a className="nav-item" data-route="plans" href="#/plans"><I name="tag" />Plans &amp; pricing</a>
          <a className="nav-item" data-route="activity" href="#/activity"><I name="clock" />Activity</a>
        </nav>
        <div className="side-group">
          <div className="side-head">Shortcuts</div>
          <a className="nav-item" href="/"><I name="globe" />Public website</a>
          <a className="nav-item" href="/admin"><I name="store" />User dashboard</a>
        </div>
        <div className="side-foot">
          <a className="nav-item" data-route="settings" href="#/settings"><I name="settings" />Settings</a>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="top-icon menu-btn" type="button" aria-label="Open menu"><I name="menu" /></button>
          <label className="top-search"><I name="search" /><input id="top-search" type="search" placeholder="Search users, businesses, emails…" aria-label="Search users" /></label>
          <span className="demo-badge" title="Master dashboard data is kept in this browser for now">Saved in this browser</span>
          <a className="top-bell" href="#/payments" id="bell" aria-label="Unpaid invoices" title="Unpaid invoices"><I name="bell" /><span className="badge" id="bell-count" /></a>
          <div className="profile">
            <button className="profile-btn" type="button" id="profile-btn" aria-haspopup="menu" aria-expanded="false">
              <span className="profile-avatar"><span className="avatar">SA</span></span>
              <span className="profile-text"><b>Shopilier Admin</b><span>Owner · master admin</span></span>
              <I name="chevronDown" />
            </button>
            <div className="profile-menu" id="profile-menu" role="menu" hidden>
              <div className="profile-menu-head"><b>Shopilier Admin</b><span>Protected with Cloudflare Access</span></div>
              <a role="menuitem" href="#/settings"><I name="settings" />Settings</a>
              <a role="menuitem" href="/"><I name="external" />Public website</a>
              <a role="menuitem" href="/admin"><I name="store" />User dashboard</a>
            </div>
          </div>
        </header>
        <div className="scroll"><div id="view" /></div>
      </div>
    </div>
  );
}
