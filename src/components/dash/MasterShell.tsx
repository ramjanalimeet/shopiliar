// The master admin shell (/master-admin): users, messages, templates, payments, plans and activity
import Icon from "@/components/Icon";

export default function MasterShell() {
  return (
    <div className="app">
      <aside className="side" id="dashboard-nav" aria-label="Master admin navigation">
        <a className="brand" href="/"><img className="brand-mark" src="/assets/logo.webp" width="34" height="34" alt="" />Shopilier<small>Admin</small></a>
        <nav className="side-nav">
          <a className="nav-item" data-route="overview" href="#/overview"><Icon name="home" />Overview</a>
          <a className="nav-item" data-route="users" href="#/users"><Icon name="customers" />Users<span className="count" id="count-users" /></a>
          <a className="nav-item" data-route="messages" href="#/messages"><Icon name="mail" />Messages<span className="count" id="msg-count" /></a>
          <a className="nav-item" data-route="templates" href="#/templates"><Icon name="layout" />Templates<span className="count" id="count-templates" /></a>
          <a className="nav-item" data-route="payments" href="#/payments"><Icon name="money" />Payments<span className="count" id="count-due" /></a>
          <a className="nav-item" data-route="plans" href="#/plans"><Icon name="tag" />Plans &amp; pricing</a>
          <a className="nav-item" data-route="activity" href="#/activity"><Icon name="clock" />Activity</a>
        </nav>
        <div className="side-group">
          <div className="side-head">Shortcuts</div>
          <a className="nav-item" href="/"><Icon name="globe" />Public website</a>
          <a className="nav-item" href="/admin"><Icon name="store" />User dashboard</a>
        </div>
        <div className="side-foot">
          <a className="nav-item" data-route="settings" href="#/settings"><Icon name="settings" />Settings</a>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="top-icon menu-btn" type="button" aria-label="Open menu"><Icon name="menu" /></button>
          <label className="top-search"><Icon name="search" /><input id="top-search" type="search" placeholder="Search users, businesses, emails…" aria-label="Search users" /></label>
          <span className="demo-badge" title="Master dashboard data is kept in this browser for now">Saved in this browser</span>
          <a className="top-bell" href="#/payments" id="bell" aria-label="Unpaid invoices" title="Unpaid invoices"><Icon name="bell" /><span className="badge" id="bell-count" /></a>
          <div className="profile">
            <button className="profile-btn" type="button" id="profile-btn" aria-haspopup="menu" aria-expanded="false">
              <span className="profile-avatar"><span className="avatar">SA</span></span>
              <span className="profile-text"><b>Shopilier Admin</b><span>Owner · master admin</span></span>
              <Icon name="chevronDown" />
            </button>
            <div className="profile-menu" id="profile-menu" role="menu" hidden>
              <div className="profile-menu-head"><b>Shopilier Admin</b><span>Protected with Cloudflare Access</span></div>
              <a role="menuitem" href="#/settings"><Icon name="settings" />Settings</a>
              <a role="menuitem" href="/"><Icon name="external" />Public website</a>
              <a role="menuitem" href="/admin"><Icon name="store" />User dashboard</a>
            </div>
          </div>
        </header>
        <div className="scroll"><div id="view" /></div>
      </div>
    </div>
  );
}
