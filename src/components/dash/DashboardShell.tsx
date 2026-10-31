// The store dashboard shell (/admin and the live demo at /demo/app). The dashboard (src/dashboard) fills it:
// #view gets each page and the chat panel its conversations; the icons are rendered here so nothing moves when it starts.
import Icon from "@/components/Icon";

const NAV: [string, string, string][] = [
  ["home", "home", "Home"], ["orders", "orders", "Orders"], ["products", "tag", "Products"], ["categories", "grid", "Categories"],
  ["customers", "customers", "Customers"], ["shipping", "truck", "Shipping & Delivery"], ["analytics", "barchart", "Analytics"], ["marketing", "megaphone", "Marketing"], ["discounts", "discount", "Discounts"],
];

export default function DashboardShell({ demo = false }: { demo?: boolean }) {
  return (
    <>
      {demo && (
        // Demo mode: the real dashboard running on a sample store that lives in this browser (see /assets/demo.js)
        <div className="demo-bar" role="status">
          <span className="demo-bar-dot" aria-hidden="true" />
          <span className="demo-text"><b>Live demo</b><span className="demo-sep"> · </span><span className="demo-long">You&apos;re managing a sample store, Dhaka Threads. Everything works — your changes are saved in this browser only.</span><span className="demo-short">Sample store · saved in this browser</span></span>
          <button className="btn btn-ghost" type="button" id="demo-reset"><Icon name="undo" /><span>Reset demo</span></button>
          <a className="btn btn-cta" href="/signup" target="_top">Create your own store →</a>
        </div>
      )}
      <div className="app">
        <aside className="side" id="dashboard-nav" aria-label="Dashboard navigation">
          <a className="brand" href="#/home" title="Dashboard home"><img className="brand-mark" src="/assets/logo.webp" width="34" height="34" alt="" />Shopilier</a>
          <nav className="side-nav">
            {NAV.map(([route, icon, label]) => (
              <a key={route} className="nav-item" data-route={route} href={`#/${route}`}><Icon name={icon} />{label}{route === "orders" && <span className="count" data-badge />}</a>
            ))}
          </nav>
          <div className="side-group">
            <div className="side-head">Sales channel</div>
            <button className="nav-item store-toggle" type="button" id="store-toggle" aria-expanded="false" aria-controls="store-sub"><Icon name="store" />Online Store<Icon name="chevronDown" /></button>
            <div className="store-sub" id="store-sub" hidden>
              <a className="nav-item sub" data-route="themes" href="#/themes">Themes</a>
              <a className="nav-item sub" data-route="pages" href="#/pages">Pages</a>
              <a className="nav-item sub" data-route="navigation" href="#/navigation">Navigation</a>
              <a className="nav-item sub" data-route="preferences" href="#/preferences">Preferences</a>
            </div>
          </div>
          <div className="side-foot">
            <button className="nav-item" type="button" data-settings="general"><Icon name="settings" />Settings</button>
          </div>
        </aside>
        <div className="main">
          <header className="topbar">
            <button className="top-icon menu-btn" type="button" aria-label="Open menu"><Icon name="menu" /></button>
            <label className="top-search"><Icon name="search" /><input id="top-search" type="search" placeholder="Search products, orders, customers…" aria-label="Search products, orders and customers" /></label>
            {/* Date filters for Home: a preset range, or one whole month */}
            <div className="top-filters" id="top-filters" hidden>
              <div className="dd" id="dd-range">
                <button className="top-select" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Date range"><Icon name="calendar" /><span className="dd-label" /><Icon name="chevronDown" /></button>
                <div className="dd-menu" role="listbox" aria-label="Date range" hidden />
              </div>
              <div className="dd" id="dd-month">
                <button className="top-select" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Month"><Icon name="calendar" /><span className="dd-label" /><Icon name="chevronDown" /></button>
                <div className="dd-menu dd-months" role="listbox" aria-label="Month" hidden />
              </div>
            </div>
            <div className="bell-wrap">
              <button className="top-bell" type="button" id="bell" aria-label="Notifications" title="Notifications" aria-haspopup="true" aria-expanded="false" aria-controls="bell-menu"><Icon name="bell" /><span className="badge" id="bell-count" /></button>
              <div className="bell-menu" id="bell-menu" hidden />
            </div>
            <div className="profile">
              <button className="profile-btn" type="button" id="profile-btn" aria-haspopup="menu" aria-expanded="false">
                <span className="profile-avatar" id="me-avatar" />
                <span className="profile-text"><b id="me-name">Owner</b><span id="me-store" /></span>
                <Icon name="chevronDown" />
              </button>
              <div className="profile-menu" id="profile-menu" role="menu" hidden>
                <div className="profile-menu-head"><b id="menu-name" /><span id="me-email" /><span className="tag green" id="me-plan" /></div>
                <a role="menuitem" href="#/themes"><Icon name="external" />My website</a>
                <button role="menuitem" type="button" data-settings="general"><Icon name="settings" />Settings</button>
                <button role="menuitem" type="button" data-settings="billing"><Icon name="billing" />Plan &amp; billing</button>
                {demo ? (
                  <>
                    <a role="menuitem" href="/" target="_top"><Icon name="logout" />Exit demo</a>
                    <button type="button" id="logout" hidden />
                  </>
                ) : (
                  <button role="menuitem" type="button" id="logout"><Icon name="logout" />Log out</button>
                )}
              </div>
            </div>
          </header>
          <div className="scroll"><div id="view" /></div>
        </div>
      </div>
      {/* Chat with the Shopilier team: a button at the bottom right opens the conversation panel */}
      <button className="chat-fab" type="button" id="chat-fab" aria-label="Chat with the Shopilier team" aria-controls="chat-panel" aria-expanded="false"><Icon name="chat" /><span className="chat-badge" id="msg-count" /></button>
      <aside className="chat-panel" id="chat-panel" aria-label="Chat with the Shopilier team" hidden>
        <header className="chat-head">
          <span className="chat-logo"><img src="/assets/logo.webp" width="34" height="34" alt="" /></span>
          <div className="chat-title"><b>Chat with Shopilier</b><span>Questions, problems or help with your website</span></div>
          <button className="chat-icon-btn" type="button" id="chat-new" title="New message" aria-label="New message"><Icon name="plus" /></button>
          <button className="chat-icon-btn" type="button" id="chat-close" title="Close" aria-label="Close chat"><Icon name="x" /></button>
        </header>
        <div className="chat-body" id="chat-root" />
      </aside>
    </>
  );
}
