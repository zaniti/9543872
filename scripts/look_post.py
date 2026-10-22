"""The channel's finishing look, applied right after a chunk is rendered (fast: ffmpeg, in parallel per chunk).

The director's edit (public/director_edit.json, theme.look) says how strong each part is. In the browser these effects
rework every pixel of every frame and slow the render ~2-3x; here they cost a few seconds per minute of video:
- chromatic aberration: red pulled left, blue pulled right by `aberration` px, both slightly softened (as measured on
  the owner's reference channels, 2026-10-22);
- softer corners (`edgeBlur`) and a vignette (`vignette`).
Grain and the canvas texture stay in the browser (they are cheap image tiles there).

    python3 scripts/look_post.py <chunk.mp4> [public/director_edit.json]   # rewrites the chunk in place; no look = no-op
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path


def look_of(edit_path: Path) -> dict:
    try:
        edit = json.loads(edit_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    look = (edit.get("theme") or {}).get("look") or {}
    return look if look.get("post") else {}


def filter_graph(look: dict, w: int = 1920, h: int = 1080) -> str | None:
    ab = max(0.0, min(8.0, float(look.get("aberration") or 0)))
    edge = max(0.0, min(1.0, float(look.get("edgeBlur") or 0)))
    vig = max(0.0, min(1.0, float(look.get("vignette") or 0)))
    if not (ab or edge or vig):
        return None
    s = max(1, round(ab * w / 1920))  # the shift, in pixels of this render's size
    parts = ["[0:v]format=gbrp,setsar=1[src]"]
    last = "src"
    if ab:
        parts.append(f"[{last}]split=3[pa][pb][pc]")
        parts.append(f"[pa]extractplanes=r,crop=iw-{s}:ih:0:0,pad=iw+{s}:ih:{s}:0,gblur=sigma=0.7[pr]")
        parts.append("[pb]extractplanes=g[pg]")
        parts.append(f"[pc]extractplanes=b,crop=iw-{s}:ih:{s}:0,pad=iw+{s}:ih:0:0,gblur=sigma=0.7[pbl]")
        parts.append("[pg][pbl][pr]mergeplanes=0x001020:gbrp[ca]")
        last = "ca"
    R = "hypot((X-W/2)/(W/2),(Y-H/2)/(H/2))"  # 0 in the centre, 1 at the middle of each side, 1.41 in the corners
    if edge:
        # sharp centre, blurred corners: blend the frame with a blurred copy through a soft oval mask. The mask is made
        # once (one frame, repeated by the merge) and the blur is done on a quarter-size copy: both cheap
        parts.append(f"[{last}]split=2[e1][e2]")
        parts.append(f"[e2]scale=iw/4:ih/4,boxblur={max(1, round(2 * edge))},scale={w}:{h}[eb]")
        m = f"255*clip(({R}-0.75)/0.55,0,1)"
        parts.append(f"color=black:s={w}x{h}:d=0.04,format=gbrp,geq=r='{m}':g='{m}':b='{m}'[mask]")
        parts.append("[e1][eb][mask]maskedmerge[ed]")
        last = "ed"
    if vig:
        # a darkening image made once, multiplied over every frame
        d = f"255*(1-{0.55 * vig:.3f}*clip(({R}-0.55)/0.85,0,1))"
        parts.append(f"color=black:s={w}x{h}:d=0.04,format=gbrp,geq=r='{d}':g='{d}':b='{d}'[vm]")
        parts.append(f"[{last}][vm]blend=all_mode=multiply[vg]")
        last = "vg"
    out = f"[{last}]format=yuv420p"
    parts.append(out + "[v]")
    return ";".join(parts)


def main() -> None:
    chunk = Path(sys.argv[1])
    edit = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("public/director_edit.json")
    graph = filter_graph(look_of(edit))
    if not graph:
        print("look: none for this video")
        return
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("look: ffmpeg is not installed")
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                            "-of", "csv=p=0", str(chunk)], capture_output=True, text=True).stdout.strip().split(",")
    w, h = (int(probe[0]), int(probe[1])) if len(probe) == 2 and all(p.isdigit() for p in probe) else (1920, 1080)
    graph = filter_graph(look_of(edit), w, h)
    tmp = chunk.with_suffix(".look.mp4")
    # same encoder settings for every chunk, so the chunks still join without re-encoding
    subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(chunk), "-filter_complex", graph, "-map", "[v]", "-map", "0:a?",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", str(tmp)], check=True)
    tmp.replace(chunk)
    print(f"look: applied to {chunk.name}")


if __name__ == "__main__":
    main()
