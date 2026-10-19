#!/usr/bin/env python3
"""
Local studio server for Chetna's birthday site.

    python3 admin_server.py            # http://localhost:5173  (site)
                                       # http://localhost:5173/admin.html  (studio)

- Serves the site with caching disabled, so edits show up on refresh.
- POST /api/save-config  writes config.js (previous version kept in .backups/).
- POST /api/upload       saves a photo into assets/photos/ or a song into assets/music/.
- POST /api/log, GET/DELETE /api/logs  the same activity log the live site keeps on
  Vercel (api/log.js), stored here in .logs/events.jsonl so the dashboard works locally.

It only listens on 127.0.0.1, so nothing outside this computer can reach it.
No third-party packages needed.
"""

import base64
import json
import re
import shutil
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / "config.js"
BACKUPS = ROOT / ".backups"
MAX_BODY = 40 * 1024 * 1024

UPLOAD_KINDS = {
    "photo": (ROOT / "assets" / "photos", {".jpg", ".jpeg", ".png", ".webp", ".gif"}),
    "music": (ROOT / "assets" / "music", {".mp3", ".m4a", ".aac", ".ogg", ".wav"}),
}
SLOT_RE = re.compile(r"^[a-z0-9-]{1,40}$")

LOG_FILE = ROOT / ".logs" / "events.jsonl"
LOG_MAX_ENTRY = 4000  # bytes of JSON per event
TYPE_RE = re.compile(r"^[a-z_]{1,24}$")

CONFIG_HEADER = """// ==============================================================================
// 💛 CHETNA'S BIRTHDAY — ALL CONTENT LIVES HERE
// Edit this file directly, or run the admin studio (see README.md) to edit
// texts and upload photos from a friendly page. The admin studio rewrites this file.
// ==============================================================================

"""


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or ""):
            super().log_message(fmt, *args)

    def _json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            raise ValueError("Body missing or too large")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        if self.path.startswith("/api/ping"):
            return self._json(200, {"ok": True})
        if self.path.startswith("/api/logs"):
            return self._json(200, {"ok": True, "events": self._read_logs()})
        return super().do_GET()

    def do_POST(self):
        try:
            if self.path == "/api/save-config":
                return self._save_config(self._read_json())
            if self.path == "/api/upload":
                return self._upload(self._read_json())
            if self.path == "/api/log":
                return self._append_log(self._read_json())
            return self._json(404, {"error": "Unknown endpoint"})
        except Exception as exc:  # report every failure back to the studio page
            return self._json(400, {"error": str(exc)})

    def do_DELETE(self):
        # /api/logs?clear=preview removes only test entries; ?clear=all wipes everything
        if not self.path.startswith("/api/logs"):
            return self._json(404, {"error": "Unknown endpoint"})
        keep = []
        if "clear=preview" in self.path:
            keep = [e for e in self._read_logs() if not e.get("preview")]
        LOG_FILE.parent.mkdir(exist_ok=True)
        LOG_FILE.write_text("".join(json.dumps(e, ensure_ascii=False) + "\n" for e in keep), encoding="utf-8")
        return self._json(200, {"ok": True, "kept": len(keep)})

    # ---- activity log -------------------------------------------------------
    def _append_log(self, data):
        entry = {
            "type": str(data.get("type", "")),
            "data": data.get("data") if isinstance(data.get("data"), dict) else {},
            "at": str(data.get("at", ""))[:40],
            "device": str(data.get("device", ""))[:24],
            "preview": bool(data.get("preview")),
            "t": int(time.time() * 1000),
        }
        if not TYPE_RE.match(entry["type"]):
            raise ValueError("Bad event type")
        line = json.dumps(entry, ensure_ascii=False)
        if len(line.encode("utf-8")) > LOG_MAX_ENTRY:
            raise ValueError("Event too large")
        LOG_FILE.parent.mkdir(exist_ok=True)
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
        return self._json(200, {"ok": True})

    def _read_logs(self):
        if not LOG_FILE.exists():
            return []
        events = []
        for line in LOG_FILE.read_text(encoding="utf-8").splitlines():
            try:
                events.append(json.loads(line))
            except ValueError:
                continue
        return events

    def _save_config(self, data):
        cfg = data.get("config")
        if not isinstance(cfg, dict) or "herName" not in cfg:
            raise ValueError("Config looks wrong; not saved")
        BACKUPS.mkdir(exist_ok=True)
        if CONFIG.exists():
            shutil.copy2(CONFIG, BACKUPS / f"config-{time.strftime('%Y%m%d-%H%M%S')}.js")
        text = CONFIG_HEADER + "window.SURPRISE_CONFIG = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n"
        CONFIG.write_text(text, encoding="utf-8")
        return self._json(200, {"ok": True})

    def _upload(self, data):
        kind = data.get("kind", "photo")
        slot = str(data.get("slot", ""))
        filename = str(data.get("filename", ""))
        if kind not in UPLOAD_KINDS:
            raise ValueError("Unknown upload kind")
        folder, allowed = UPLOAD_KINDS[kind]
        if not SLOT_RE.match(slot):
            raise ValueError("Bad slot name")
        ext = Path(filename).suffix.lower()
        if ext not in allowed:
            raise ValueError(f"File type {ext or '?'} not allowed. Use: {', '.join(sorted(allowed))}")
        raw = base64.b64decode(data.get("data", ""), validate=True)
        folder.mkdir(parents=True, exist_ok=True)
        # Remove older uploads for this slot (keep the .svg placeholder)
        for old in folder.glob(f"{slot}.*"):
            if old.suffix.lower() != ".svg":
                old.unlink()
        target = folder / f"{slot}{ext}"
        target.write_bytes(raw)
        rel = target.relative_to(ROOT).as_posix()
        return self._json(200, {"ok": True, "path": rel})


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=str(ROOT)))
    print(f"💛 Site:   http://localhost:{port}/?preview")
    print(f"🛠  Studio: http://localhost:{port}/admin.html")
    print(f"📬 Dashboard: http://localhost:{port}/dashboard.html")
    print("Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
