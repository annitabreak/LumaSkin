import App from "./App"

// iPhone 15 Pro frame is 393×852. We render it at this scale.
const PHONE_W = 393
const PHONE_H = 852
const SCALE = 0.28
const THUMB_W = Math.round(PHONE_W * SCALE)  // ~110px
const THUMB_H = Math.round(PHONE_H * SCALE)  // ~239px
const GAP = 32

type Screen =
  | "splash" | "onboard1" | "onboard2" | "onboard3"
  | "login" | "signup"
  | "home" | "scan" | "scan-prep" | "scan-upload" | "scan-quality" | "scan-analyzing" | "report"
  | "history"
  | "profile" | "settings" | "location"

interface Node {
  id: Screen
  label: string
  col: number
  row: number
  group: "onboard" | "auth" | "main" | "scan"
}

const NODES: Node[] = [
  // row 0 — onboarding
  { id: "splash",     label: "Splash",       col: 0, row: 0, group: "onboard" },
  { id: "onboard1",   label: "Onboarding 1", col: 1, row: 0, group: "onboard" },
  { id: "onboard2",   label: "Onboarding 2", col: 2, row: 0, group: "onboard" },
  { id: "onboard3",   label: "Onboarding 3", col: 3, row: 0, group: "onboard" },
  // row 1 — auth
  { id: "login",      label: "Login",        col: 0, row: 1, group: "auth" },
  { id: "signup",     label: "Sign Up",      col: 1, row: 1, group: "auth" },
  // row 1 — main (same row, different group)
  { id: "home",       label: "Home",         col: 3, row: 1, group: "main" },
  { id: "history",    label: "History",      col: 4, row: 1, group: "main" },
  { id: "profile",    label: "Profile",      col: 6, row: 1, group: "main" },
  { id: "settings",   label: "Settings",     col: 7, row: 1, group: "main" },
  { id: "location",   label: "Location",     col: 8, row: 1, group: "main" },
  // row 2 — scan flow (5 internal steps)
  { id: "scan-prep",      label: "1 · Setup",        col: 0, row: 2, group: "scan" },
  { id: "scan-upload",    label: "2 · Upload",        col: 1, row: 2, group: "scan" },
  { id: "scan-quality",   label: "3 · Quality Check", col: 2, row: 2, group: "scan" },
  { id: "scan-analyzing", label: "4 · Analyzing",     col: 3, row: 2, group: "scan" },
  { id: "report",         label: "5 · Report",        col: 4, row: 2, group: "scan" },
]

// navigation edges [from, to, label, dashed?]
const EDGES: [Screen, Screen, string, boolean?][] = [
  ["splash",      "onboard1",    "auto 1.8s"],
  ["onboard1",    "onboard2",    "Next"],
  ["onboard2",    "onboard3",    "Next"],
  ["onboard3",    "login",       "Get Started", true],
  ["login",       "home",        "Login"],
  ["login",       "signup",      "Register"],
  ["signup",      "login",       "Confirmed", true],
  ["home",        "scan-prep",      "Scan Now"],
  ["home",        "history",     "History nav"],
  ["home",        "profile",     "Profile nav", true],
  ["home",        "location",    "Location icon", true],
  ["history",     "report",      "Tap a scan"],
  ["profile",     "settings",    "Settings"],
  ["settings",    "location",    "Manage"],
  ["settings",    "login",       "Log Out", true],
  ["location",    "home",        "Save→Home", true],
  ["location",    "settings",    "Save→Settings", true],
  ["scan-prep",      "scan-upload",    "Checklist ✓"],
  ["scan-upload",    "scan-quality",   "3 uploaded"],
  ["scan-quality",   "scan-analyzing", "Analyze"],
  ["scan-analyzing", "report",         "Complete"],
  ["report",         "home",           "Back"],
  ["scan-upload",    "scan-prep",      "Back", true],
  ["scan-quality",   "scan-upload",    "Back", true],
]

const GROUP_COLORS: Record<string, string> = {
  onboard: "#7c83d4",
  auth:    "#d47c9e",
  main:    "#5cc8d8",
  scan:    "#d4a87c",
}

// Compute pixel position for a node's center
function nodePos(node: Node) {
  const x = node.col * (THUMB_W + GAP)
  const y = node.row * (THUMB_H + 80)
  return { x, y, cx: x + THUMB_W / 2, cy: y + THUMB_H / 2 }
}

function nodeById(id: Screen) {
  return NODES.find(n => n.id === id) ?? null
}

// Compute SVG canvas size
const MAX_COL = Math.max(...NODES.map(n => n.col))
const MAX_ROW = Math.max(...NODES.map(n => n.row))
const CANVAS_W = MAX_COL * (THUMB_W + GAP) + THUMB_W + 80
const CANVAS_H = MAX_ROW * (THUMB_H + 80) + THUMB_H + 100

// ── Thumbnail: real App rendered at scale ───────────────────────
function PhoneThumbnail({ screen }: { screen: Screen }) {
  return (
    <div
      style={{
        width: THUMB_W,
        height: THUMB_H,
        overflow: "hidden",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        position: "relative",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {/* render real App at full size, scale it down */}
      <div
        style={{
          width: PHONE_W,
          height: PHONE_H,
          transform: `scale(${SCALE})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <App initialScreen={screen} />
      </div>
    </div>
  )
}

// ── Arrow drawing ────────────────────────────────────────────────
function Arrows() {
  const arrows = EDGES.map(([fromId, toId, label, dashed], i) => {
    const a = nodeById(fromId)
    const b = nodeById(toId)
    if (!a || !b) return null
    const ap = nodePos(a)
    const bp = nodePos(b)

    // Simple routing: prefer horizontal then vertical
    let x1 = ap.cx, y1 = ap.cy
    let x2 = bp.cx, y2 = bp.cy

    // exit/enter points
    if (b.row > a.row) {
      // going down
      y1 = ap.y + THUMB_H
      y2 = bp.y
    } else if (b.row < a.row) {
      y1 = ap.y
      y2 = bp.y + THUMB_H
    } else if (b.col > a.col) {
      x1 = ap.x + THUMB_W
      x2 = bp.x
    } else {
      x1 = ap.x
      x2 = bp.x + THUMB_W
    }

    const mid_x = (x1 + x2) / 2
    const mid_y = (y1 + y2) / 2

    // Stagger overlapping arrows slightly
    const offset = (i % 3 - 1) * 6

    let d: string
    if (a.row !== b.row && a.col !== b.col) {
      // diagonal: elbow routing
      const ex = x2 + offset
      d = `M ${x1} ${y1} C ${x1} ${y1 + 40}, ${ex} ${y2 - 40}, ${x2} ${y2}`
    } else if (a.row !== b.row) {
      d = `M ${x1 + offset} ${y1} L ${x2 + offset} ${y2}`
    } else {
      d = `M ${x1} ${y1 + offset} L ${x2} ${y2 + offset}`
    }

    const color = GROUP_COLORS[a.group]

    return (
      <g key={`${fromId}-${toId}`}>
        <defs>
          <marker id={`mh${i}`} markerWidth={7} markerHeight={5} refX={6} refY={2.5} orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill={color} opacity={0.7} />
          </marker>
        </defs>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={dashed ? "4,3" : undefined}
          markerEnd={`url(#mh${i})`}
          opacity={dashed ? 0.4 : 0.7}
        />
        <text
          x={mid_x + (a.row !== b.row ? 6 : 0)}
          y={mid_y + (a.col !== b.col && a.row === b.row ? -5 : 0)}
          fill="#8080a8"
          fontSize={8}
          fontFamily="Inter, sans-serif"
          textAnchor="middle"
        >{label}</text>
      </g>
    )
  })
  return <>{arrows}</>
}

// ── Group label ─────────────────────────────────────────────────
function groupBounds(group: string) {
  const nodes = NODES.filter(n => n.group === group)
  const cols = nodes.map(n => n.col)
  const rows = nodes.map(n => n.row)
  const minCol = Math.min(...cols), maxCol = Math.max(...cols)
  const minRow = Math.min(...rows), maxRow = Math.max(...rows)
  const pad = 14
  const x = minCol * (THUMB_W + GAP) - pad
  const y = minRow * (THUMB_H + 80) - 26
  const w = (maxCol - minCol) * (THUMB_W + GAP) + THUMB_W + pad * 2
  const h = (maxRow - minRow) * (THUMB_H + 80) + THUMB_H + 36
  return { x, y, w, h }
}

// ── Main component ───────────────────────────────────────────────
export default function FlowMap() {
  return (
    <div style={{ background: "#0c0c18", minHeight: "100vh", overflow: "auto" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(12,12,24,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 32px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <svg width={22} height={21} viewBox="0 0 125 116.5" fill="none">
          <defs><linearGradient id="hg" x1="9.5" x2="125" y1="77.8" y2="49.3" gradientUnits="userSpaceOnUse"><stop stopColor="#C9D6FF"/><stop offset="1" stopColor="#8DADFA"/></linearGradient></defs>
          <path d="M58 0H25C11.2 0 0 11.2 0 25V46C0 59.8 11.2 71 25 71H41L58 0Z" fill="url(#hg)"/>
          <path d="M0 60.5V91.5C0 105.3 11.2 116.5 25 116.5H64.75C76.2 116.5 85.5 107.2 85.5 95.75 85.5 84.3 76.2 75 64.76 75 52.2 75 36.3 75 23.5 75 5 75 0 60.5 0 60.5Z" fill="url(#hg)"/>
          <path d="M81.5 116.5C94.7 107 95 87.5 82.2 77.6L61.4 61.5C57.7 58.7 55.5 54.3 55.5 49.6 55.5 41.3 62.3 34.5 70.6 34.5H125L112.1 96.6C109.7 108.2 99.5 116.5 87.7 116.5H81.5Z" fill="url(#hg)"/>
        </svg>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
          LumaSkin <span style={{ fontWeight: 400, color: "#5a5a90", fontSize: 12 }}>— App Flow Map</span>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 20, alignItems: "center" }}>
          {(["onboard:#7c83d4", "auth:#d47c9e", "main:#5cc8d8", "scan:#d4a87c"] as const).map(s => {
            const [label, color] = s.split(":")
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7878a0" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ padding: 40, overflowX: "auto" }}>
        <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H }}>

          {/* SVG layer for group backgrounds + arrows */}
          <svg
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
          >
            {/* Group backgrounds */}
            {(["onboard", "auth", "main", "scan"] as const).map(g => {
              const b = groupBounds(g)
              const c = GROUP_COLORS[g]
              return (
                <g key={g}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={14}
                    fill={c + "08"} stroke={c + "25"} strokeWidth={1} />
                  <text x={b.x + 12} y={b.y + 14} fill={c} fontSize={8.5}
                    fontWeight={700} letterSpacing="0.1em" fontFamily="Inter, sans-serif" opacity={0.6}>
                    {g === "onboard" ? "ONBOARDING" : g === "auth" ? "AUTHENTICATION" : g === "main" ? "MAIN APP" : "SCAN FLOW"}
                  </text>
                </g>
              )
            })}

            {/* Arrows */}
            <Arrows />
          </svg>

          {/* Screen thumbnails */}
          {NODES.map(node => {
            const { x, y } = nodePos(node)
            const color = GROUP_COLORS[node.group]
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <PhoneThumbnail screen={node.id} />
                <div style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color,
                  letterSpacing: "0.03em",
                  fontFamily: "Inter, sans-serif",
                  opacity: 0.9,
                }}>
                  {node.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
