import styles from "./introduction-video.module.css";

export function IntroductionVideo() {
  const configuredSource = process.env.PROVENANT_INTRO_VIDEO_URL?.trim();
  // The site's media policy allows video files served from its own origin.
  const source = configuredSource && /^\/videos\/[\w./-]+\.(mp4|webm)$/i.test(configuredSource)
    && !configuredSource.split("/").includes("..") ? configuredSource : "/videos/research-tour-4k.mp4";

  return (
    <section className={styles.panel} aria-label="Provenant introduction video" data-intro-video>
      {source ? (
        <video className={styles.video} aria-label="Research platform introduction video" controls playsInline preload="none" poster="/videos/research-tour-poster.jpg" src={source}>
          <track kind="captions" src="/videos/research-tour.en.vtt" srcLang="en" label="English" />
          <a href={source}>Watch the introduction video</a>
        </video>
      ) : (
        <div className={styles.placeholder}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="m10 9 5 3-5 3z" />
            </svg>
          </span>
          <h2>Introduction video</h2>
          <p>Coming soon</p>
        </div>
      )}
    </section>
  );
}
