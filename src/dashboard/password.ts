// @ts-nocheck — ported as-is from the original dashboard script; types can be tightened over time.
// Adds a show/hide "eye" button to every password field, including ones added later.
export const start = () => {
  const eye = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOff = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.9 3.8M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/></svg>';

  const style = document.createElement("style");
  style.textContent = `.pw-wrap{position:relative;display:block}
.pw-wrap>input{width:100%;padding-right:46px!important}
.pw-toggle{position:absolute;top:50%;right:6px;transform:translateY(-50%);width:36px;height:36px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:#6b7280;cursor:pointer;padding:0}
.pw-toggle:hover{color:#111827;background:rgba(0,0,0,.05)}
.pw-toggle:focus-visible{outline:2px solid #41a212;outline-offset:1px}`;
  document.head.appendChild(style);

  const enhance = (input) => {
    if (input.dataset.pwToggle) return;
    input.dataset.pwToggle = "1";
    const wrap = document.createElement("span");
    wrap.className = "pw-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pw-toggle";
    btn.innerHTML = eye;
    btn.setAttribute("aria-label", "Show password");
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show ? eyeOff : eye;
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.setAttribute("aria-pressed", String(show));
      input.focus();
    });
    wrap.appendChild(btn);
  };

  const scan = (root) => root.querySelectorAll?.('input[type="password"]:not([data-pw-toggle])').forEach(enhance);
  const start = () => {
    scan(document);
    new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches('input[type="password"]') ? enhance(n) : scan(n))))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
};
