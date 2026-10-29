"use client";
// Watch video: a branded player in a popup. The YouTube video plays behind our own controls with its
// title, logo and suggestions cropped out of view. The player loads quietly as soon as someone reaches
// for a play button, so the popup opens straight into the video.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type YTPlayer = {
  playVideo(): void; pauseVideo(): void; seekTo(s: number, allow: boolean): void; getDuration(): number; getCurrentTime(): number;
  getPlayerState(): number; mute(): void; unMute(): void; isMuted(): boolean;
};
type YTNamespace = {
  Player: new (id: string, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { PLAYING: number; BUFFERING: number; PAUSED: number; ENDED: number };
};
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }

type Video = { prime: (id: string) => void; open: (id: string) => void };
const VideoContext = createContext<Video>({ prime: () => {}, open: () => {} });
export const useVideo = () => useContext(VideoContext);

const PLAY = "M7 4.6v14.8a1.3 1.3 0 0 0 2 1.1l11.6-7.4a1.3 1.3 0 0 0 0-2.2L9 3.5a1.3 1.3 0 0 0-2 1.1z";
const PAUSE = "M6 4h4v16H6zM14 4h4v16h-4z";
const REPLAY = "M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z";
const SOUND = "M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z";
const MUTED = "M4 9v6h4l5 4V5L8 9H4zm16.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z";
const FULL = "M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z";
const Glyph = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d={d} /></svg>;
const fmt = (t: number) => { t = Math.max(0, Math.floor(t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

type State = "idle" | "loading" | "playing" | "paused" | "ended";

export function VideoProvider({ children }: { children: ReactNode }) {
  const modal = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | true | null>(null);
  const ready = useRef(false);
  const ended = useRef(false);
  const wantPlay = useRef(false);
  const tick = useRef(0);
  const idle = useRef(0);
  const [videoId, setVideoId] = useState("");
  const [poster, setPoster] = useState("");
  const [st, setSt] = useState<State>("idle");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [offerSound, setOfferSound] = useState(false);
  const [awake, setAwake] = useState(false);
  const [fill, setFill] = useState(0);
  const [time, setTime] = useState("0:00 / 0:00");
  const [canFull, setCanFull] = useState(true);
  const stRef = useRef<State>("idle");
  const setState = (s: State) => { stRef.current = s; setSt(s); };

  useEffect(() => { setCanFull(!!document.fullscreenEnabled); }, []);

  const current = () => (player.current && player.current !== true ? player.current : null);
  const update = useCallback(() => {
    const p = current();
    if (!ready.current || !p) return;
    const d = p.getDuration() || 0, c = p.getCurrentTime() || 0;
    setFill(d ? (c / d) * 100 : 0);
    setTime(`${fmt(c)} / ${fmt(d)}`);
  }, []);
  // Controls fade out while the video plays and nobody moves the mouse
  const wake = useCallback(() => {
    setAwake(true);
    clearTimeout(idle.current);
    idle.current = window.setTimeout(() => { if (stRef.current === "playing") setAwake(false); }, 2600);
  }, []);

  const play = useCallback(() => {
    const p = current();
    if (!ready.current || !p) { wantPlay.current = true; setState("loading"); return; }
    if (ended.current) { p.seekTo(0, true); ended.current = false; }
    if (stRef.current !== "playing") setState("loading");
    p.playVideo();
    // Browsers that block sound without a direct tap (mostly phones): play muted and offer sound
    setTimeout(() => {
      const YT = window.YT;
      if (modal.current?.open && ready.current && YT && p.getPlayerState() !== YT.PlayerState.PLAYING && p.getPlayerState() !== YT.PlayerState.BUFFERING) {
        p.mute(); setMuted(true); setOfferSound(true); p.playVideo();
        // Still not playing: show the big play button so a tap can start it
        setTimeout(() => { if (stRef.current === "loading") setState("paused"); }, 1500);
      }
    }, 1500);
  }, []);
  const pause = useCallback(() => { if (ready.current) current()?.pauseVideo(); }, []);
  const togglePlay = () => (stRef.current === "playing" ? pause() : play());

  const load = useCallback((id: string) => {
    if (player.current || !id) return;
    player.current = true; // loading
    setPoster(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
    const create = () => {
      const YT = window.YT!;
      player.current = new YT.Player("vp-yt", {
        host: "https://www.youtube-nocookie.com",
        videoId: id,
        playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, modestbranding: 1, origin: location.origin },
        events: {
          onReady: () => {
            ready.current = true; update();
            if (wantPlay.current && modal.current?.open) { wantPlay.current = false; play(); }
            else if (stRef.current === "loading") setState("idle");
          },
          onStateChange: (e: { data: number }) => {
            const S = YT.PlayerState;
            if (e.data === S.PLAYING) { setState("playing"); setPlaying(true); ended.current = false; clearInterval(tick.current); tick.current = window.setInterval(update, 250); wake(); }
            else if (e.data === S.BUFFERING) { if (stRef.current !== "playing") setState("loading"); }
            else if (e.data === S.PAUSED) { setState("paused"); setPlaying(false); clearInterval(tick.current); update(); setAwake(true); }
            else if (e.data === S.ENDED) { ended.current = true; setState("ended"); setPlaying(false); clearInterval(tick.current); setFill(100); }
          },
        },
      });
    };
    if (window.YT && window.YT.Player) return create();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); create(); };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, [play, update, wake]);

  const prime = useCallback((id: string) => { setVideoId((v) => v || id); load(id); }, [load]);
  const open = useCallback((id: string) => { prime(id); modal.current?.showModal(); play(); }, [prime, play]);

  // Seek by clicking or dragging along the progress bar
  const seekTo = (x: number) => {
    const p = current(), t = track.current;
    if (!ready.current || !p || !t) return;
    const r = t.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (x - r.left) / r.width));
    p.seekTo(f * p.getDuration(), true);
    setFill(f * 100);
  };
  const onClose = () => { wantPlay.current = false; pause(); if (document.fullscreenElement) document.exitFullscreen(); };
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("button, .vp-track")) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
    else if (e.key === "m") toggleMute();
    else if (e.key === "f" && canFull) toggleFull();
  };
  const toggleMute = () => {
    const p = current();
    if (!ready.current || !p) return;
    if (p.isMuted()) { p.unMute(); setMuted(false); setOfferSound(false); } else { p.mute(); setMuted(true); }
  };
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : frame.current?.requestFullscreen());
  const bigGlyph = st === "ended" ? REPLAY : PLAY;

  return (
    <VideoContext.Provider value={{ prime, open }}>
      {children}
      <dialog ref={modal} className="video-modal" aria-label="How to start with Shopilier" onClose={onClose} onKeyDown={onKey}
        onClick={(e) => { if (e.target === modal.current) modal.current?.close(); }}>
        <button className="video-close" type="button" aria-label="Close video" onClick={() => modal.current?.close()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div ref={frame} className={"video-frame" + (awake ? " vp-awake" : "")} data-state={st} onPointerMove={wake}>
          <div className="vp-stage"><div id="vp-yt" /></div>
          <div className="vp-shield" onClick={() => { togglePlay(); wake(); }} />
          <div className="vp-cover">
            {poster && <img className="vp-poster" src={poster} alt="" onError={(e) => { const im = e.currentTarget; if (im.src.includes("maxresdefault")) im.src = im.src.replace("maxresdefault", "hqdefault"); }} />}
            <span className="vp-spinner" aria-hidden="true" />
            <button className="vp-big" type="button" aria-label={st === "ended" ? "Replay" : "Play"} onClick={play}><Glyph d={bigGlyph} /></button>
          </div>
          <button className="vp-unmute" type="button" hidden={!offerSound} onClick={() => { const p = current(); if (ready.current && p) { p.unMute(); setMuted(false); setOfferSound(false); } }}><Glyph d={MUTED} />Tap for sound</button>
          <div className="vp-bar">
            <button className="vp-btn vp-toggle" type="button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}><Glyph d={playing ? PAUSE : PLAY} /></button>
            <div ref={track} className="vp-track" role="slider" aria-label="Seek" tabIndex={0} aria-valuenow={Math.round(fill)}
              onPointerDown={(e) => { track.current?.setPointerCapture(e.pointerId); seekTo(e.clientX); }}
              onPointerMove={(e) => { if (track.current?.hasPointerCapture(e.pointerId)) seekTo(e.clientX); }}
              onKeyDown={(e) => {
                const p = current();
                if (!ready.current || !p || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
                e.preventDefault();
                p.seekTo(p.getCurrentTime() + (e.key === "ArrowRight" ? 5 : -5), true);
                update();
              }}>
              <div className="vp-fill" style={{ width: `${fill}%` }} />
            </div>
            <span className="vp-time">{time}</span>
            <button className="vp-btn vp-mute" type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute}><Glyph d={muted ? MUTED : SOUND} /></button>
            <button className="vp-btn vp-full" type="button" aria-label="Full screen" hidden={!canFull} onClick={toggleFull}><Glyph d={FULL} /></button>
          </div>
        </div>
      </dialog>
    </VideoContext.Provider>
  );
}

/** A button that opens the video popup. The player (and its poster) load as soon as someone reaches for it. */
export function WatchButton({ videoId, children, ...rest }: { videoId: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { prime, open } = useVideo();
  return (
    <button type="button" {...rest} data-video={videoId}
      onPointerEnter={() => prime(videoId)} onTouchStart={() => prime(videoId)} onFocus={() => prime(videoId)} onClick={() => open(videoId)}>
      {children}
    </button>
  );
}
