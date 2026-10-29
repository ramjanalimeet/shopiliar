// Mobile menu
document.querySelectorAll(".site-header").forEach((header) => {
  const btn = header.querySelector(".menu-toggle");
  if (!btn) return;
  const setOpen = (open) => {
    header.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  btn.addEventListener("click", () => setOpen(!header.classList.contains("open")));
  header.addEventListener("click", (e) => { if (e.target.closest(".main-nav a, .auth a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("open")) { setOpen(false); btn.focus(); }
  });
  matchMedia("(min-width: 761px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
});

// Templates: search, sort and preview
const tplList = document.getElementById("tpl-list");
if (tplList) {
  const cards = [...tplList.querySelectorAll(".tcard")];
  const search = document.getElementById("tpl-search");
  const sort = document.getElementById("tpl-sort");
  const empty = document.getElementById("tpl-empty");
  const niches = document.getElementById("tpl-niches");
  let niche = ""; // what the visitor sells (a chip under the search box); "" is every store

  const render = () => {
    const q = search.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const inNiche = !niche || (card.dataset.niche || "").split(" ").includes(niche);
      const match = inNiche && terms.every((t) => card.dataset.search.includes(t));
      card.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown > 0;
  };
  if (niches) {
    niches.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-niche]");
      if (!btn) return;
      niche = btn.dataset.niche;
      niches.querySelectorAll("button").forEach((b) => { const on = b === btn; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
      render();
    });
  }

  const sortCards = () => {
    const key = sort.value;
    const sorted = [...cards].sort((a, b) =>
      key === "az" ? a.dataset.name.localeCompare(b.dataset.name)
        : Number(a.dataset[key]) - Number(b.dataset[key]));
    sorted.forEach((card) => tplList.appendChild(card));
  };

  search.addEventListener("input", render);
  sort.addEventListener("change", sortCards);

  const modal = document.getElementById("tpl-modal");
  const modalShot = document.getElementById("tpl-modal-shot");
  const device = document.getElementById("tpl-device");
  const deviceSwitch = document.getElementById("tpl-devices");
  const deviceSize = document.getElementById("tpl-device-size");
  const deviceFit = document.getElementById("tpl-device-fit");
  const stage = deviceFit.parentElement;
  // Real screen sizes (CSS pixels) for each preview mode
  const devices = { desktop: [1440, 900], tablet: [768, 1024], mobile: [390, 844] };
  let current = "desktop";
  let lastFocus = null;

  const fitDevice = () => {
    const [w, h] = devices[current];
    const pad = parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    const scale = Math.min(1, (stage.clientWidth - pad) / w, (stage.clientHeight - pad) / h);
    device.style.width = w + "px";
    device.style.height = h + "px";
    device.style.transform = "scale(" + scale + ")";
    deviceFit.style.width = w * scale + "px";
    deviceFit.style.height = h * scale + "px";
    const label = current[0].toUpperCase() + current.slice(1);
    deviceSize.textContent = label + " · " + w + " × " + h + (scale < 1 ? " · " + Math.round(scale * 100) + "%" : "");
  };
  new ResizeObserver(() => { if (!modal.hidden) fitDevice(); }).observe(stage);

  const setDevice = (name) => {
    current = name;
    device.dataset.device = name;
    fitDevice();
    deviceSwitch.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.device === name;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    modalShot.scrollTop = 0;
  };
  deviceSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) setDevice(btn.dataset.device);
  });
  const closeModal = () => {
    modal.hidden = true;
    modalShot.innerHTML = "";
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  };
  tplList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview]");
    if (!btn) return;
    const card = btn.closest(".tcard");
    lastFocus = btn;
    document.getElementById("tpl-modal-title").textContent = card.dataset.name;
    document.getElementById("tpl-modal-use").href = card.querySelector(".btn-dark").getAttribute("href");
    const live = card.querySelector(".shot").cloneNode(true);
    live.classList.add("live");
    const burger = document.createElement("span");
    burger.className = "s-burger";
    burger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    live.querySelector(".s-nav").appendChild(burger);
    modalShot.appendChild(live);
    modal.hidden = false;
    setDevice("desktop");
    document.body.classList.add("no-scroll");
    modal.querySelector(".modal-close").focus();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}


// Pricing: monthly / yearly toggle
const billing = document.querySelector("[data-billing]");
if (billing) {
  const taka = (n) => n.toLocaleString("en-US");
  let yearly = false;

  const render = () => {
    billing.querySelectorAll("button").forEach((b) => {
      const on = (b.dataset.period === "yearly") === yearly;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.body.classList.toggle("is-yearly", yearly);
    document.querySelectorAll(".cat-panel .pcard").forEach((card) => {
      const price = card.querySelector("[data-month]");
      const month = Number(price.dataset.month);
      // The Free plan costs ৳0 whichever way it's billed
      price.textContent = taka(yearly && month ? month * 12 : month);
      card.querySelector("[data-per]").textContent = yearly && month ? "/year" : "/month";
      card.querySelector("[data-bill]").textContent = !month ? "Free forever · no card needed" : yearly ? "৳" + taka(month) + "/month, billed yearly" : "Billed monthly";
      card.querySelector("[data-plan-link]").href = "signup.html?plan=" + card.dataset.plan + "&billing=" + (yearly ? "yearly" : "monthly");
    });
  };
  billing.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    yearly = btn.dataset.period === "yearly";
    render();
  });
  render();
}

// Sign in (sign-up is the step-by-step flow in start.js). Accounts are kept by the Worker (src/index.js); the session is an HttpOnly cookie.
const api = async (path, body) => {
  const res = await fetch(path, body === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
};
const signedIn = fetch("/api/me").then((r) => r.ok).catch(() => false);

// Signed-in visitors get a Dashboard button instead of Sign in / Sign up
signedIn.then((yes) => {
  if (!yes) return;
  document.querySelectorAll(".site-header .auth").forEach((el) => {
    el.innerHTML = '<a class="btn btn-dark" href="/admin/">Dashboard</a>';
  });
});

document.querySelectorAll("form[data-auth]").forEach((form) => {
  const params = new URLSearchParams(location.search);
  // Only send people back to pages inside their dashboard
  const next = /^\/admin(\/|$)/.test(params.get("next") || "") ? params.get("next") : "/admin/";
  const msg = form.querySelector(".form-msg");
  const say = (text) => { msg.style.color = "#e03e3e"; msg.textContent = text; };

  form.querySelectorAll("a[data-google]").forEach((a) => { a.href = "/api/auth/google?" + new URLSearchParams({ next }); });
  const GOOGLE_ERRORS = {
    google: "Google sign-in didn't finish. Please try again.",
    google_email: "Your Google email isn't verified yet.",
    google_off: "Google sign-in isn't set up yet. Please use your email and password.",
  };
  if (GOOGLE_ERRORS[params.get("error")]) say(GOOGLE_ERRORS[params.get("error")]);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("[type=submit]");
    const val = (id) => (form.querySelector("#" + id)?.value || "").trim();
    msg.textContent = "";
    button.disabled = true;
    try {
      await api("/api/signin", {
        email: val("email"), password: form.querySelector("#password").value, remember: form.querySelector("#remember")?.checked,
      });
      location.href = next;
    } catch (err) {
      say(err.message);
      button.disabled = false;
    }
  });
});

// Watch video: a branded player in a popup. The YouTube video plays behind our own
// controls with its title, logo and suggestions cropped out of view. The player loads
// quietly after the page, so the popup opens straight into the video.
const videoModal = document.querySelector(".video-modal");
if (videoModal) {
  const frame = videoModal.querySelector(".video-frame");
  const triggers = [...document.querySelectorAll(".watch-btn, .watch-btn-card")];
  const videoId = triggers[0]?.dataset.video;
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;
  const PLAY = "M7 4.6v14.8a1.3 1.3 0 0 0 2 1.1l11.6-7.4a1.3 1.3 0 0 0 0-2.2L9 3.5a1.3 1.3 0 0 0-2 1.1z";
  const PAUSE = "M6 4h4v16H6zM14 4h4v16h-4z";
  const REPLAY = "M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z";
  const SOUND = "M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z";
  const MUTED = "M4 9v6h4l5 4V5L8 9H4zm16.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z";
  const FULL = "M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z";

  frame.innerHTML = `
    <div class="vp-stage"><div id="vp-yt"></div></div>
    <div class="vp-shield"></div>
    <div class="vp-cover">
      <img class="vp-poster" data-src="https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg" alt="" onerror="this.onerror=null;this.src=this.src.replace('maxresdefault','hqdefault')">
      <span class="vp-spinner" aria-hidden="true"></span>
      <button class="vp-big" type="button" aria-label="Play">${icon(PLAY)}</button>
    </div>
    <button class="vp-unmute" type="button" hidden>${icon(MUTED)}Tap for sound</button>
    <div class="vp-bar">
      <button class="vp-btn vp-toggle" type="button" aria-label="Play">${icon(PLAY)}</button>
      <div class="vp-track" role="slider" aria-label="Seek" tabindex="0"><div class="vp-fill"></div></div>
      <span class="vp-time">0:00 / 0:00</span>
      <button class="vp-btn vp-mute" type="button" aria-label="Mute">${icon(SOUND)}</button>
      <button class="vp-btn vp-full" type="button" aria-label="Full screen">${icon(FULL)}</button>
    </div>`;
  const $ = (sel) => frame.querySelector(sel);
  const cover = $(".vp-cover"), big = $(".vp-big"), toggle = $(".vp-toggle"), track = $(".vp-track"),
    fill = $(".vp-fill"), time = $(".vp-time"), muteBtn = $(".vp-mute"), fullBtn = $(".vp-full"), unmute = $(".vp-unmute");
  if (!document.fullscreenEnabled) fullBtn.hidden = true;

  let player = null, ready = false, ended = false, tick = 0, idle = 0, wantPlay = false;
  const fmt = (t) => { t = Math.max(0, Math.floor(t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
  const setState = (st) => { frame.dataset.state = st; };
  const setPlaying = (on) => {
    toggle.innerHTML = icon(on ? PAUSE : PLAY);
    toggle.setAttribute("aria-label", on ? "Pause" : "Play");
  };
  const setMuted = (m) => {
    muteBtn.innerHTML = icon(m ? MUTED : SOUND);
    muteBtn.setAttribute("aria-label", m ? "Unmute" : "Mute");
    if (!m) unmute.hidden = true;
  };
  const update = () => {
    if (!ready) return;
    const d = player.getDuration() || 0, c = player.getCurrentTime() || 0;
    fill.style.width = d ? `${(c / d) * 100}%` : "0";
    time.textContent = `${fmt(c)} / ${fmt(d)}`;
    track.setAttribute("aria-valuenow", Math.round(d ? (c / d) * 100 : 0));
  };
  // Controls fade out while the video plays and nobody moves the mouse
  const wake = () => {
    frame.classList.add("vp-awake");
    clearTimeout(idle);
    idle = setTimeout(() => { if (frame.dataset.state === "playing") frame.classList.remove("vp-awake"); }, 2600);
  };

  const play = () => {
    if (!ready) { wantPlay = true; setState("loading"); return; }
    if (ended) { player.seekTo(0, true); ended = false; }
    if (frame.dataset.state !== "playing") setState("loading");
    player.playVideo();
    // Browsers that block sound without a direct tap (mostly phones): play muted and offer sound
    setTimeout(() => {
      if (videoModal.open && ready && player.getPlayerState() !== YT.PlayerState.PLAYING && player.getPlayerState() !== YT.PlayerState.BUFFERING) {
        player.mute(); setMuted(true); unmute.hidden = false; player.playVideo();
        // Still not playing: show the big play button so a tap can start it
        setTimeout(() => { if (frame.dataset.state === "loading") setState("paused"); }, 1500);
      }
    }, 1500);
  };
  const pause = () => { if (ready) player.pauseVideo(); };
  const togglePlay = () => (frame.dataset.state === "playing" ? pause() : play());

  const onState = (e) => {
    const S = YT.PlayerState;
    if (e.data === S.PLAYING) { setState("playing"); setPlaying(true); ended = false; clearInterval(tick); tick = setInterval(update, 250); wake(); }
    else if (e.data === S.BUFFERING) { if (frame.dataset.state !== "playing") setState("loading"); }
    else if (e.data === S.PAUSED) { setState("paused"); setPlaying(false); clearInterval(tick); update(); frame.classList.add("vp-awake"); }
    else if (e.data === S.ENDED) { ended = true; setState("ended"); setPlaying(false); clearInterval(tick); fill.style.width = "100%"; big.innerHTML = icon(REPLAY); big.setAttribute("aria-label", "Replay"); }
    if (e.data !== S.ENDED) { big.innerHTML = icon(PLAY); big.setAttribute("aria-label", "Play"); }
  };

  const load = () => {
    if (player || !videoId) return;
    player = true; // loading
    const poster = $(".vp-poster");
    if (poster.dataset.src) { poster.src = poster.dataset.src; delete poster.dataset.src; }
    const create = () => {
      player = new YT.Player("vp-yt", {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, modestbranding: 1, origin: location.origin },
        events: {
          onReady: () => { ready = true; update(); if (wantPlay && videoModal.open) { wantPlay = false; play(); } else if (frame.dataset.state === "loading") setState("idle"); },
          onStateChange: onState,
        },
      });
    };
    if (window.YT && YT.Player) return create();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); create(); };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.append(tag);
  };

  setState("idle");
  // The player (and its poster) load as soon as someone reaches for the button, not on every visit
  triggers.forEach((btn) => {
    ["pointerenter", "touchstart", "focus"].forEach((ev) => btn.addEventListener(ev, load, { once: true, passive: true }));
    btn.addEventListener("click", () => {
      load();
      videoModal.showModal();
      play();
    });
  });

  big.addEventListener("click", play);
  $(".vp-shield").addEventListener("click", () => { togglePlay(); wake(); });
  toggle.addEventListener("click", togglePlay);
  muteBtn.addEventListener("click", () => {
    if (!ready) return;
    if (player.isMuted()) { player.unMute(); setMuted(false); } else { player.mute(); setMuted(true); }
  });
  unmute.addEventListener("click", () => { if (ready) { player.unMute(); setMuted(false); } });
  fullBtn.addEventListener("click", () => (document.fullscreenElement ? document.exitFullscreen() : frame.requestFullscreen()));
  frame.addEventListener("pointermove", wake);

  // Seek by clicking or dragging along the progress bar
  const seekTo = (x) => {
    if (!ready) return;
    const r = track.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (x - r.left) / r.width));
    player.seekTo(f * player.getDuration(), true);
    fill.style.width = `${f * 100}%`;
  };
  track.addEventListener("pointerdown", (e) => { track.setPointerCapture(e.pointerId); seekTo(e.clientX); });
  track.addEventListener("pointermove", (e) => { if (track.hasPointerCapture(e.pointerId)) seekTo(e.clientX); });
  track.addEventListener("keydown", (e) => {
    if (!ready || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    player.seekTo(player.getCurrentTime() + (e.key === "ArrowRight" ? 5 : -5), true);
    update();
  });
  videoModal.addEventListener("keydown", (e) => {
    if (e.target.closest("button, .vp-track")) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
    else if (e.key === "m") muteBtn.click();
    else if (e.key === "f" && !fullBtn.hidden) fullBtn.click();
  });

  videoModal.querySelector(".video-close").addEventListener("click", () => videoModal.close());
  // Click outside the video closes it
  videoModal.addEventListener("click", (e) => { if (e.target === videoModal) videoModal.close(); });
  // Closing pauses; opening again carries on from the same spot
  videoModal.addEventListener("close", () => { wantPlay = false; pause(); if (document.fullscreenElement) document.exitFullscreen(); });
}

// Live demo (demo.html): the real dashboard loads into a browser-style frame.
// Elsewhere a frame would only load when scrolled to or when "Start the live demo" is pressed.
const demoStage = document.getElementById("demo-stage");
if (demoStage) {
  const iframe = document.getElementById("demo-iframe");
  const start = document.getElementById("demo-start");
  let started = false;
  const startDemo = () => {
    if (started) return;
    started = true;
    start.classList.add("loading");
    iframe.addEventListener("load", () => demoStage.classList.add("ready"), { once: true });
    iframe.src = iframe.dataset.src;
  };
  start.addEventListener("click", startDemo);
  // On the Demo page the dashboard is the point, so it loads straight away
  if ("autoload" in demoStage.dataset || location.hash === "#demo") startDemo();
  else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { startDemo(); io.disconnect(); } }, { rootMargin: "200px 0px" });
    io.observe(demoStage);
  }
}

// Contact form: open the visitor's email app with the message filled in
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(contactForm);
    const subject = `Message from ${f.get("name")}`;
    const body = `${f.get("message")}\n\n${f.get("name")}\n${f.get("email")}`;
    location.href = `mailto:support@shopilier.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
