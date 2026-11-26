"use client";

import { useRef, useState } from "react";
import { ControlIcon } from "./control-icon";
import styles from "./introduction-video.module.css";

const source = "/videos/research-tour-4k.mp4";

export function IntroductionVideo() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function showVideo() {
    dialog.current?.showModal();
    setOpen(true);
  }

  return (
    <>
      <button className={styles.trigger} type="button" aria-haspopup="dialog" onClick={showVideo}>
        <span className={styles.play} aria-hidden="true"><ControlIcon name="play" /></span>
        <span>How to use</span>
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-label="How to use" onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}>
        {open && (
          <video className={styles.video} controls autoPlay playsInline preload="none"
            poster="/videos/research-tour-poster.jpg" src={source} aria-label="Research platform introduction">
            <track kind="captions" src="/videos/research-tour.en.vtt" srcLang="en" label="English" />
            <a href={source}>Watch the introduction video</a>
          </video>
        )}
        <button className={styles.close} type="button" aria-label="Close video" onClick={() => dialog.current?.close()}>
          <span className={styles.mobileGlyph} aria-hidden="true">×</span>
          <ControlIcon name="close" className={styles.desktopGlyph} />
        </button>
      </dialog>
    </>
  );
}
