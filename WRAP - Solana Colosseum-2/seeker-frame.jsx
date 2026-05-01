// Solana Seeker phone frame — 1080×2400 viewport, scaled down to ~360×800 for display.
// Dark, edgeless, single small camera punch-hole.

const SEEKER_W = 1080;
const SEEKER_H = 2400;
const FRAME_SCALE = 0.34; // ~367×816 displayed

function SeekerFrame({ children, label }) {
  const dispW = SEEKER_W * FRAME_SCALE;
  const dispH = SEEKER_H * FRAME_SCALE;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: dispW + 24, height: dispH + 24,
        padding: 12,
        borderRadius: 64,
        background: 'linear-gradient(160deg, #1a1a22 0%, #0a0a0f 50%, #1a1a22 100%)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        border: '1px solid #25252e',
      }}>
        <div style={{
          width: dispW, height: dispH,
          borderRadius: 52, overflow: 'hidden',
          background: '#0A0A0F', position: 'relative',
        }}>
          <div style={{
            width: SEEKER_W, height: SEEKER_H,
            transform: `scale(${FRAME_SCALE})`, transformOrigin: 'top left',
            background: '#0A0A0F', position: 'relative',
            color: '#fff',
          }}>
            {/* Status bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 110,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 80px', zIndex: 50,
              fontFamily: '"Inter Tight", sans-serif', fontSize: 38, fontWeight: 600,
              color: '#fff',
            }}>
              <span>9:41</span>
              <div style={{
                position: 'absolute', left: '50%', top: 30, transform: 'translateX(-50%)',
                width: 50, height: 50, borderRadius: '50%', background: '#000',
                border: '2px solid #1a1a22',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* signal */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  {[10, 16, 22, 28].map((h, i) => (
                    <div key={i} style={{ width: 6, height: h, background: '#fff', borderRadius: 1 }} />
                  ))}
                </div>
                {/* battery */}
                <div style={{
                  width: 56, height: 26, border: '2.5px solid #fff', borderRadius: 6,
                  position: 'relative', padding: 2,
                }}>
                  <div style={{ width: '78%', height: '100%', background: '#fff', borderRadius: 2 }} />
                  <div style={{
                    position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 10, background: '#fff', borderRadius: 1,
                  }} />
                </div>
              </div>
            </div>
            {children}
            {/* Home indicator */}
            <div style={{
              position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              width: 360, height: 10, borderRadius: 5, background: '#fff', opacity: 0.4,
              zIndex: 50,
            }} />
          </div>
        </div>
      </div>
      {label && (
        <div style={{
          fontFamily: '"Inter Tight", sans-serif', fontSize: 13, fontWeight: 500,
          color: '#6b6b78', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// Helper — gradient text
const gradText = {
  background: 'linear-gradient(95deg, #FE3B68 0%, #FF6B3B 35%, #9945FF 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

Object.assign(window, { SeekerFrame, SEEKER_W, SEEKER_H, FRAME_SCALE, gradText });
