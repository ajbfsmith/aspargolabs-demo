"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play } from "lucide-react";
import {
  DEMO_CHAPTERS,
  chapterAtTime,
  formatTimestamp,
  type DemoChapter,
} from "./demo-chapters";

const PLATFORM_COLORS: Record<string, string> = {
  "Social Dash": "text-teal border-teal/40 bg-teal/10",
  Reddit: "text-orange-300 border-orange-400/30 bg-orange-400/10",
  X: "text-sky-300 border-sky-400/30 bg-sky-400/10",
  Facebook: "text-blue-300 border-blue-400/30 bg-blue-400/10",
  Bluesky: "text-indigo-300 border-indigo-400/30 bg-indigo-400/10",
  Threads: "text-violet-300 border-violet-400/30 bg-violet-400/10",
};

function platformStyle(platform: string): string {
  return PLATFORM_COLORS[platform] ?? "text-teal border-teal/40 bg-teal/10";
}

function StrategyPanel({ chapter, fading }: { chapter: DemoChapter; fading: boolean }) {
  return (
    <div
      className={`transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider ${platformStyle(chapter.platform)}`}
        >
          {chapter.platform}
        </span>
        <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">
          {chapter.phase}
        </span>
      </div>

      <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-text-primary leading-tight mb-4 italic">
        {chapter.headline}
      </h2>

      <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
        {chapter.body}
      </p>

      <div className="border-t border-teal/10 pt-5">
        <p className="text-xs font-mono uppercase tracking-widest text-teal mb-3">
          Behind the video
        </p>
        <ul className="space-y-2.5">
          {chapter.deeper.map((item) => (
            <li
              key={item.slice(0, 48)}
              className="flex gap-2.5 text-sm text-text-secondary leading-relaxed"
            >
              <span className="text-teal shrink-0 mt-1.5 w-1 h-1 rounded-full bg-teal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SocialDashDemoClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chapterStripRef = useRef<HTMLDivElement>(null);
  const chapterBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [activeChapter, setActiveChapter] = useState<DemoChapter>(DEMO_CHAPTERS[0]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(83);
  const [playing, setPlaying] = useState(false);
  const [fading, setFading] = useState(false);
  const lastChapterId = useRef(DEMO_CHAPTERS[0].id);

  const applyChapter = useCallback((chapter: DemoChapter) => {
    if (chapter.id === lastChapterId.current) return;
    lastChapterId.current = chapter.id;
    setFading(true);
    window.setTimeout(() => {
      setActiveChapter(chapter);
      setFading(false);
    }, 150);
  }, []);

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    setCurrentTime(t);
    applyChapter(chapterAtTime(t));
  }, [applyChapter]);

  const seekToChapter = useCallback(
    (chapter: DemoChapter) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = chapter.start;
      setCurrentTime(chapter.start);
      applyChapter(chapter);
      void video.play();
      setPlaying(true);
    },
    [applyChapter],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      if (Number.isFinite(video.duration)) setDuration(video.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    const btn = chapterBtnRefs.current.get(activeChapter.id);
    if (!btn || !chapterStripRef.current) return;
    btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeChapter.id]);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen grid-surface flex flex-col">
      <header className="shrink-0 border-b border-teal/10 bg-void/80 backdrop-blur-sm z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-teal transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Aspargo Labs</span>
          </Link>
          <p className="text-xs font-mono text-text-secondary tabular-nums">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="text-center mb-6 md:mb-10 max-w-2xl mx-auto px-1">
            <p className="text-xs font-mono uppercase tracking-widest text-teal mb-3">
              Product demo
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-text-primary italic leading-tight mb-4">
              Social Dash
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Watch AI browser agents execute a coordinated growth strategy across Reddit,
              X, Facebook, Bluesky, and Threads.
            </p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 lg:gap-10 lg:items-start">
            {/* Video column */}
            <div className="w-full min-w-0 space-y-3 sm:space-y-4 order-1">
              <div className="grid-panel p-2 sm:p-3">
                <div className="relative rounded-lg overflow-hidden bg-obsidian aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain bg-black"
                    src="/Demo2.mp4"
                    playsInline
                    preload="metadata"
                    controls
                  />
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="hidden sm:inline-flex absolute bottom-4 left-4 items-center gap-2 rounded-full border border-teal/30 bg-void/80 px-4 py-2 text-sm font-mono text-text-primary hover:border-teal/60 transition-colors"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {playing ? "Pause" : "Play"}
                  </button>
                </div>

                <div className="mt-3 sm:mt-4 px-1">
                  <div className="relative h-1.5 rounded-full bg-obsidian overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-teal/80 transition-[width] duration-150"
                      style={{ width: `${progressPct}%` }}
                    />
                    {DEMO_CHAPTERS.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        title={ch.timelineLabel}
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded-sm bg-teal/40 hover:bg-teal hover:h-4 transition-all"
                        style={{ left: `${(ch.start / duration) * 100}%` }}
                        onClick={() => seekToChapter(ch)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div
                ref={chapterStripRef}
                className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth"
              >
                {DEMO_CHAPTERS.map((ch) => {
                  const active = ch.id === activeChapter.id;
                  return (
                    <button
                      key={ch.id}
                      ref={(el) => {
                        if (el) chapterBtnRefs.current.set(ch.id, el);
                        else chapterBtnRefs.current.delete(ch.id);
                      }}
                      type="button"
                      onClick={() => seekToChapter(ch)}
                      className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-teal/50 bg-teal/10 text-text-primary"
                          : "border-teal/10 bg-obsidian/50 text-text-secondary hover:border-teal/30"
                      }`}
                    >
                      <span className="block text-[10px] font-mono uppercase tracking-wider opacity-70">
                        {ch.platform}
                      </span>
                      <span className="block text-xs whitespace-nowrap">{ch.timelineLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Strategy panel */}
            <aside className="w-full min-w-0 order-2 lg:sticky lg:top-6 lg:self-start">
              <div className="grid-panel p-5 sm:p-6 md:p-8">
                <StrategyPanel chapter={activeChapter} fading={fading} />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
