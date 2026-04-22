import { useEffect, useRef, useState } from "react";

// ─── Demo data ───────────────────────────────
const DEMO_GROUP = {
  id: 1,
  name: "The Inner Circle",
  inviteCode: "XK9-VENOM",
  members: [
    { id: 1, email: "alice@example.com",   role: "ADMIN"  },
    { id: 2, email: "bob@example.com",     role: "MEMBER" },
    { id: 3, email: "carol@example.com",   role: "MEMBER" },
    { id: 4, email: "david@example.com",   role: "MEMBER" },
    { id: 5, email: "eve@example.com",     role: "MEMBER" },
    { id: 6, email: "frank@example.com",   role: "MEMBER" },
  ],
};

// ─── Utility ─────────────────────────────────
function toShortToken(str = "") {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return "#" + (h >>> 0).toString(16).toUpperCase().padStart(6, "0").slice(0, 6);
}

// ─── Constants ───────────────────────────────
const C = {
  bg:           "#050507",
  crimson:      "#8b0000",
  crimsonBright:"#c0001a",
  gold:         "#c8a97e",
  goldDim:      "#7a5f3a",
  text:         "#e8dcc8",
  textDim:      "#7a7060",
  memberBg:     "#0d0d12",
  memberBorder: "#2a1a2e",
};
const CENTER_R = 66;
const ORBIT_R  = 220;
const NODE_R   = 42;

// ─── SVG layer ───────────────────────────────
function OrbitSVG({ members, size, cx, cy, orbitAngle }) {
  const r = Math.min(ORBIT_R, size * 0.38);
  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
         viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Dashed orbit ring */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(139,0,0,0.18)" strokeWidth="1" strokeDasharray="4 9"/>
      {/* Second faint ring */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none"
        stroke="rgba(139,0,0,0.06)" strokeWidth="1" strokeDasharray="2 14"/>
      {/* Lines */}
      {members.map((m, i) => {
        const a = (i / members.length) * 2 * Math.PI - Math.PI / 2 + orbitAngle;
        const isAdmin = m.role === "ADMIN";
        return (
          <line key={m.id} x1={cx} y1={cy}
            x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
            stroke={isAdmin ? "rgba(200,169,126,0.35)" : "rgba(139,0,0,0.22)"}
            strokeWidth={isAdmin ? 1.5 : 1} filter="url(#glow)"/>
        );
      })}
    </svg>
  );
}

// ─── Member node ─────────────────────────────
function MemberNode({ member, angle, orbitR, cx, cy }) {
  const [hov, setHov] = useState(false);
  const token = toShortToken(member.email);
  const isAdmin = member.role === "ADMIN";
  const x = cx + orbitR * Math.cos(angle) - NODE_R;
  const y = cy + orbitR * Math.sin(angle) - NODE_R;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:"absolute", left:x, top:y, width: NODE_R * 2, height: NODE_R * 2,
        borderRadius:"50%",
        background: hov
          ? "radial-gradient(circle at 35% 35%, #1e0a20, #0a050a)"
          : "radial-gradient(circle at 35% 35%, #110b18, #07040a)",
        border: `2px solid ${isAdmin ? C.gold : (hov ? C.crimsonBright : C.memberBorder)}`,
        boxShadow: isAdmin
          ? `0 0 16px ${C.goldDim}, 0 0 4px rgba(200,169,126,0.15) inset`
          : hov ? "0 0 14px rgba(192,0,26,0.55)" : "none",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        cursor:"default", transition:"all 0.3s ease", zIndex:10,
      }}>
      <span style={{
        fontFamily:"'Courier New', monospace",
        fontSize:"10px",
        color: isAdmin ? C.gold : C.text,
        letterSpacing:"0.02em",
        textAlign:"center", padding:"0 3px",
        lineHeight:1.2,
      }}>{token}</span>
      {isAdmin && <span style={{ fontSize:"10px", lineHeight:1, marginTop:"1px" }}>♛</span>}

      {hov && (
        <div style={{
          position:"absolute", bottom:"calc(100% + 8px)",
          left:"50%", transform:"translateX(-50%)",
          background:"#0d0a10",
          border:`1px solid ${isAdmin ? C.goldDim : "rgba(139,0,0,0.4)"}`,
          borderRadius:"4px", padding:"4px 10px",
          whiteSpace:"nowrap", pointerEvents:"none", zIndex:999,
        }}>
          <span style={{ fontFamily:"Georgia, serif", fontSize:"12px",
            color: isAdmin ? C.gold : C.text }}>
            {isAdmin ? "⚑ Admin" : "Member"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────
export default function App() {
  const [entered, setEntered] = useState(false);
  const [enterHov, setEnterHov] = useState(false);
  const [orbitAngle, setOrbitAngle] = useState(0);
  const containerRef = useRef(null);
  const [size, setSize] = useState(480);
  const rafRef = useRef(null);
  const lastTs = useRef(null);

  useEffect(() => {
    const upd = () => {
      if (containerRef.current) {
        const s = Math.min(containerRef.current.offsetWidth, containerRef.current.offsetHeight, 500);
        setSize(Math.max(s, 320));
      }
    };
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  useEffect(() => {
    const tick = (ts) => {
      if (lastTs.current !== null) {
        setOrbitAngle(a => a + (ts - lastTs.current) * 0.000042);
      }
      lastTs.current = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const cx = size / 2, cy = size / 2;
  const orbitR = Math.min(ORBIT_R, size * 0.38);
  const { members, name, inviteCode } = DEMO_GROUP;

  return (
    <div style={{
      minHeight:"100vh", background: C.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"Georgia, serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
        * { box-sizing: border-box; }
        @keyframes leaklyPulse {
          0%,100% { opacity:.55; transform:scale(1); }
          50%      { opacity:.08; transform:scale(1.09); }
        }
        @keyframes fadeSlide {
          from { opacity:0; transform: translateY(18px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>

      {entered ? (
        /* ── "You entered chat" confirmation ── */
        <div style={{
          textAlign:"center", animation:"fadeSlide 0.5s ease forwards",
        }}>
          <div style={{
            fontFamily:"'Cinzel', serif", fontSize:"28px",
            color: C.gold, letterSpacing:"0.2em",
            textTransform:"uppercase", marginBottom:"16px",
          }}>Welcome to the Dark</div>
          <div style={{ color: C.textDim, fontSize:"16px", marginBottom:"32px",
            fontFamily:"'Crimson Pro', Georgia, serif",
          }}>
            Chat navigation would happen here in Dashboard.jsx
          </div>
          <button onClick={() => setEntered(false)} style={{
            background:"rgba(139,0,0,0.15)",
            border:"1px solid rgba(139,0,0,0.4)",
            color: C.text, cursor:"pointer",
            fontFamily:"'Crimson Pro', Georgia, serif",
            fontSize:"14px", padding:"8px 22px",
            borderRadius:"3px", letterSpacing:"0.08em",
          }}>← Back to Orbit</button>
        </div>
      ) : (
        /* ── Main orbit view ── */
        <div style={{
          width:"100%", maxWidth:"600px",
          display:"flex", flexDirection:"column",
          height:"100vh",
        }}>

          {/* Header */}
          <div style={{
            display:"flex", alignItems:"center",
            justifyContent:"space-between",
            padding:"18px 28px 14px",
            borderBottom:"1px solid rgba(139,0,0,0.2)",
          }}>
            <span style={{ color: C.textDim, fontSize:"13px",
              fontFamily:"'Crimson Pro', Georgia, serif",
              letterSpacing:"0.04em" }}>← Back</span>

            <div style={{ textAlign:"center" }}>
              <div style={{
                fontFamily:"'Cinzel', serif", fontSize:"17px",
                color: C.text, letterSpacing:"0.14em",
                textTransform:"uppercase",
              }}>{name}</div>
              <div style={{ fontSize:"12px", color: C.textDim, marginTop:"2px",
                letterSpacing:"0.06em",
                fontFamily:"'Crimson Pro', Georgia, serif",
              }}>
                {members.length} whispers in the dark
              </div>
            </div>

            <div onClick={() => navigator.clipboard?.writeText(inviteCode)} style={{
              background:"rgba(139,0,0,0.12)",
              border:"1px solid rgba(139,0,0,0.3)",
              borderRadius:"20px", padding:"4px 12px",
              fontSize:"11px", fontFamily:"'Courier New', monospace",
              color: C.gold, cursor:"pointer",
              letterSpacing:"0.1em", userSelect:"none",
            }} title="Click to copy invite">{inviteCode}</div>
          </div>

          {/* Orbit Stage */}
          <div ref={containerRef} style={{
            flex:1, display:"flex",
            alignItems:"center", justifyContent:"center",
            position:"relative", overflow:"hidden",
          }}>
            {/* Background glow */}
            <div style={{
              position:"absolute",
              width: orbitR * 2.8, height: orbitR * 2.8,
              borderRadius:"50%",
              background:"radial-gradient(circle, rgba(139,0,0,0.07) 0%, transparent 65%)",
              pointerEvents:"none",
            }}/>

            <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
              <OrbitSVG members={members} size={size} cx={cx} cy={cy} orbitAngle={orbitAngle}/>

              {members.map((m, i) => {
                const baseA = (i / members.length) * 2 * Math.PI - Math.PI / 2;
                return (
                  <MemberNode key={m.id} member={m}
                    angle={baseA + orbitAngle}
                    orbitR={orbitR} cx={cx} cy={cy}/>
                );
              })}

              {/* Enter Chat button */}
              <button
                onClick={() => setEntered(true)}
                onMouseEnter={() => setEnterHov(true)}
                onMouseLeave={() => setEnterHov(false)}
                style={{
                  position:"absolute",
                  left: cx - CENTER_R, top: cy - CENTER_R,
                  width: CENTER_R * 2, height: CENTER_R * 2,
                  borderRadius:"50%",
                  border:`2px solid ${enterHov ? C.crimsonBright : "rgba(139,0,0,0.55)"}`,
                  background: enterHov
                    ? "radial-gradient(circle at 40% 38%, #3d0000, #1c0008)"
                    : "radial-gradient(circle at 40% 38%, #240000, #0e0009)",
                  boxShadow: enterHov
                    ? "0 0 36px rgba(139,0,0,0.75), 0 0 70px rgba(139,0,0,0.28), inset 0 0 24px rgba(200,0,0,0.12)"
                    : "0 0 20px rgba(139,0,0,0.45), 0 0 44px rgba(139,0,0,0.12)",
                  cursor:"pointer",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:"4px",
                  transition:"all 0.35s ease",
                  zIndex:20,
                  transform: enterHov ? "scale(1.07)" : "scale(1)",
                }}>
                {/* Pulse rings */}
                {[0, 10].map((offset, pi) => (
                  <div key={pi} style={{
                    position:"absolute",
                    inset: -(8 + offset * 1.2),
                    borderRadius:"50%",
                    border:`1px solid ${enterHov ? "rgba(139,0,0,0.4)" : "rgba(139,0,0,0.15)"}`,
                    animation:`leaklyPulse 2.4s ease-in-out ${pi * 0.8}s infinite`,
                    pointerEvents:"none",
                  }}/>
                ))}

                <span style={{
                  fontFamily:"'Cinzel', serif",
                  fontSize: enterHov ? "13px" : "12px",
                  color: enterHov ? "#ff4040" : C.crimsonBright,
                  letterSpacing:"0.14em",
                  textTransform:"uppercase",
                  transition:"all 0.3s",
                  lineHeight:1.25,
                  textAlign:"center",
                }}>Enter<br/>Chat</span>
              </button>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display:"flex", justifyContent:"center",
            gap:"24px", padding:"14px 28px 20px",
            borderTop:"1px solid rgba(139,0,0,0.1)",
          }}>
            {[
              { border: C.gold, shadow: C.goldDim, label:"Admin" },
              { border: C.memberBorder, shadow:"transparent", label:"Member" },
            ].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                <div style={{
                  width:13, height:13, borderRadius:"50%",
                  border:`2px solid ${l.border}`,
                  boxShadow: `0 0 5px ${l.shadow}`,
                }}/>
                <span style={{ fontSize:"12px", color: C.textDim,
                  letterSpacing:"0.06em",
                  fontFamily:"'Crimson Pro', Georgia, serif",
                }}>{l.label}</span>
              </div>
            ))}
            <span style={{ fontSize:"11px", color:"rgba(122,112,96,0.5)",
              fontFamily:"'Crimson Pro', Georgia, serif",
              letterSpacing:"0.04em", alignSelf:"center",
            }}>Identities hidden</span>
          </div>
        </div>
      )}
    </div>
  );
}
