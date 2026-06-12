# People Will Want

Things users will ask for that aren't on the KC gap list. Captured as they come up during build.

`open` = not yet built · `done` = shipped · `deferred` = known, skipped intentionally

---

## Bracket / Row Marker

- `open` **Bracket color picker** — bracket defaults to app teal; users will want to match their physical row marker or just personalize. Already wired for: the corner border color is the only thing that needs to change.
- `open` **Row highlight color picker** — the current-row highlight strip in the active knitting chart defaults to the accent color. Users will want to change it (e.g. softer tint, different color for different projects). Stored per-project or as a global default in settings.

---

## Reminder Chimes

- `deferred` **Custom chime upload** — let users upload an audio file (MP3/WAV) to use instead of the built-in tones. Moderate difficulty: file input + `FileReader` to get a data URL, store it in settings (IndexedDB via a Zustand persist adapter, since localStorage can't hold audio blobs reliably), decode with `AudioContext.decodeAudioData`, play via a `BufferSourceNode`. The tricky part is storage — a typical chime is 50–200 KB which is fine for IndexedDB but blows past localStorage limits, so the persist config would need a custom storage adapter or a separate `idb-keyval` store. UI is a simple file picker + a "clear" button. Estimate: 2–3 hours of work, no third-party audio lib needed.

---
