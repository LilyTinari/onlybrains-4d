import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatTimecode } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function VideoStage() {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(10);
  const [muted, setMuted] = useState(true);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  }

  async function toggleFs() {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await box.requestFullscreen();
    }
  }

  return (
    <div
      ref={boxRef}
      className="group relative overflow-hidden rounded-xl bg-bg ring-1 ring-fg/10"
    >
      <video
        ref={videoRef}
        className="aspect-video w-full object-cover"
        src="/video/brain.mp4"
        poster="/images/brain.jpg"
        playsInline
        preload="metadata"
        muted={muted}
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 10)}
      />

      {!playing ? (
        <button
          type="button"
          className="absolute inset-0 grid place-items-center text-fg"
          onClick={togglePlay}
          aria-label="Play"
        >
          <span className="grid size-16 place-items-center rounded-full bg-fg/10 ring-1 ring-fg/20 backdrop-blur-sm md:size-20">
            <Play className="size-7 fill-current md:size-8" />
          </span>
        </button>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-bg/80 to-transparent px-3 py-3 transition-opacity duration-fast md:px-4",
          !started && "pointer-events-none opacity-0",
          started && playing && "opacity-0 group-hover:opacity-100",
          started && !playing && "opacity-100",
        )}
        aria-hidden={!started}
      >
        <button
          type="button"
          className="grid size-11 place-items-center text-fg"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
        </button>
        <p className="text-xs tabular-nums text-fg">
          {formatTimecode(t)}
          <span className="text-muted"> | {formatTimecode(dur)}</span>
        </p>
        <div className="ml-auto flex items-center">
          <button
            type="button"
            className="grid size-11 place-items-center text-fg"
            onClick={() => {
              setMuted((m) => !m);
              const v = videoRef.current;
              if (v) v.muted = !v.muted;
            }}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center text-fg"
            onClick={() => void toggleFs()}
            aria-label={fs ? "Exit full screen" : "Full screen"}
          >
            {fs ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
