import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export function TurningPointVideo() {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      playerRef.current = new window.YT.Player("yt-player", {
        videoId: "mBnteRCiyH8",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (event: any) => {
            event.target.setPlaybackRate(1.2);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existing = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, []);

  return (
    <section className="pt-20 md:pt-28 pb-12 md:pb-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Play className="w-5 h-5 text-accent" />
            <h2 className="text-xl md:text-2xl font-display text-foreground">איך ליצור קליניקה יציבה ורווחית - הקלטת ההדרכה</h2>
          </div>

          <div
            id="player-container"
            className="shadow-elevated border border-border/50"
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              maxWidth: "100%",
              borderRadius: "12px",
            }}
          >
            <div
              id="yt-player"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            />
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            לכל מי שהשתתף בהדרכה המיוחדת שלנו – שמחים להזמין אתכם להצטרף לתוכנית "נקודת המפנה"
          </p>
        </motion.div>
      </div>
    </section>
  );
}
