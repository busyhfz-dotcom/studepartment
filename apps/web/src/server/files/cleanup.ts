import { drainFileDeletions } from "./repository";

const state = globalThis as unknown as { fileCleanupTimer?: ReturnType<typeof setInterval>; fileCleanupRunning?: boolean };
export function startFileCleanup() {
  if (state.fileCleanupTimer || !process.env.FILE_STORAGE_BUCKET) return;
  const run = async () => {
    if (state.fileCleanupRunning) return;
    state.fileCleanupRunning = true;
    try { await drainFileDeletions(); }
    catch { console.error("File cleanup will retry on the next run."); }
    finally { state.fileCleanupRunning = false; }
  };
  state.fileCleanupTimer = setInterval(() => void run(), 5 * 60_000);
  state.fileCleanupTimer.unref();
  void run();
}
