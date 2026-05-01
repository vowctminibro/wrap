// 4 screens of WRAP — all sized to 1080×2400 (Solana Seeker viewport).
// Each screen is a positioned region inside SeekerFrame.

// ─────────────────────────────────────────────────────────────
// SCREEN 1 — Onboarding
// ─────────────────────────────────────────────────────────────
function Screen1_Onboarding({ onConnect }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      paddingTop: 180, paddingLeft: 80, paddingRight: 80, paddingBottom: 140,
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter Tight", sans-serif',
      overflow: 'hidden',
    }}>
      {/* Ambient gradient blob */}
      <div style={{
        position: 'absolute', top: -200, left: -200, width: 900, height: 900,
        borderRadius: '50%', filter: 'blur(120px)', opacity: 0.45,
        background: 'radial-gradient(circle, #FE3B68 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -300, right: -200, width: 1000, height: 1000,
        borderRadius: '50%', filter: 'blur(140px)', opacity: 0.35,
        background: 'radial-gradient(circle, #9945FF 0%, transparent 70%)',
      }} />

      {/* WRAP wordmark */}
      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center', marginTop: 40,
      }}>
        <div style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: 200, fontWeight: 900,
          letterSpacing: '-0.06em', lineHeight: 0.85,
          ...gradText,
        }}>WRAP</div>
        <div style={{
          fontSize: 28, fontWeight: 500, color: '#6b6b78',
          letterSpacing: '0.32em', marginTop: 16, textTransform: 'uppercase',
        }}>
          ' 2 6
        </div>
      </div>

      {/* Floating cards stack */}
      <div style={{
        position: 'relative', flex: 1, marginTop: 50, marginBottom: 50,
      }}>
        <FloatingCard card={CARDS[1]} rotate={-14} top={120} left={-30} z={1} scale={0.78} />
        <FloatingCard card={CARDS[2]} rotate={6} top={60} left={180} z={3} scale={0.92} />
        <FloatingCard card={CARDS[3]} rotate={18} top={170} left={420} z={2} scale={0.82} />
      </div>

      {/* Headline */}
      <div style={{ position: 'relative', zIndex: 2, marginBottom: 60 }}>
        <h1 style={{
          fontSize: 96, fontWeight: 900, lineHeight: 0.95,
          letterSpacing: '-0.04em', color: '#fff',
          textWrap: 'balance', margin: 0,
        }}>
          Your wallet has stories.<br/>
          <span style={gradText}>We tell them.</span>
        </h1>
        <p style={{
          fontSize: 36, fontWeight: 500, color: '#9b9bab',
          marginTop: 32, lineHeight: 1.35,
        }}>
          Connect your Solana wallet.<br/>Get your Wrapped card.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onConnect}
        style={{
          width: '100%', height: 160, borderRadius: 80,
          border: 'none', cursor: 'pointer',
          background: 'linear-gradient(95deg, #FE3B68 0%, #FF6B3B 35%, #9945FF 100%)',
          boxShadow: '0 20px 60px rgba(254, 59, 104, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
          color: '#fff', fontFamily: '"Inter Tight", sans-serif',
          fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em',
          position: 'relative', zIndex: 2,
        }}
      >
        Connect Wallet
      </button>

      <div style={{
        textAlign: 'center', marginTop: 40, position: 'relative', zIndex: 2,
        fontSize: 26, color: '#5a5a68', fontWeight: 500, letterSpacing: '0.04em',
      }}>
        Powered by Solana
      </div>
    </div>
  );
}

function FloatingCard({ card, rotate, top, left, z, scale }) {
  return (
    <div style={{
      position: 'absolute', top, left, zIndex: z,
      width: 380, height: 540,
      borderRadius: 36, padding: 32,
      background: card.bg,
      transform: `rotate(${rotate}deg) scale(${scale})`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      fontFamily: '"Inter Tight", sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontSize: 18, fontWeight: 700, letterSpacing: '0.16em',
          color: card.accent, textTransform: 'uppercase', opacity: 0.9,
        }}>{card.label}</div>
        <CardIcon name={card.icon} size={56} color={card.accent} />
      </div>
      <div>
        <div style={{
          fontSize: 110, fontWeight: 900, lineHeight: 0.85,
          letterSpacing: '-0.05em', color: '#fff',
        }}>{card.stat}</div>
        {card.statUnit && (
          <div style={{
            fontSize: 28, fontWeight: 700, letterSpacing: '0.1em',
            color: card.accent, marginTop: 8,
          }}>{card.statUnit}</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2 — Card Reveal
// ─────────────────────────────────────────────────────────────
function Screen2_Reveal({ cardIndex, setCardIndex, onShare, onMint, onBack }) {
  const card = CARDS[cardIndex];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      paddingTop: 150, paddingBottom: 140,
      fontFamily: '"Inter Tight", sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '40px 60px 20px',
      }}>
        <button onClick={onBack} style={{
          width: 80, height: 80, borderRadius: 40, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, fontWeight: 700,
        }}>‹</button>
        <div style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '0.18em',
          color: '#9b9bab', textTransform: 'uppercase',
        }}>Your Wrapped</div>
        <div style={{ width: 80 }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 60px' }}>
        <ShareableCard card={card} />
      </div>

      {/* Dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16, marginTop: 30, marginBottom: 40,
      }}>
        {CARDS.map((c, i) => (
          <button key={c.id} onClick={() => setCardIndex(i)} style={{
            width: i === cardIndex ? 56 : 24, height: 24, borderRadius: 12, border: 'none',
            cursor: 'pointer', transition: 'all 0.3s',
            background: i === cardIndex
              ? 'linear-gradient(95deg, #FE3B68, #9945FF)'
              : 'rgba(255,255,255,0.18)',
          }} />
        ))}
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 60px', display: 'flex', gap: 24 }}>
        <button onClick={onShare} style={{
          flex: 1, height: 140, borderRadius: 70, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(95deg, #FE3B68 0%, #9945FF 100%)',
          color: '#fff', fontSize: 38, fontWeight: 700,
          fontFamily: '"Inter Tight", sans-serif',
          boxShadow: '0 16px 40px rgba(254, 59, 104, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          letterSpacing: '-0.02em',
        }}>
          Share to <span style={{ fontSize: 42, fontWeight: 900 }}>𝕏</span>
        </button>
        <button onClick={onMint} style={{
          flex: 1, height: 140, borderRadius: 70, cursor: 'pointer',
          background: 'transparent', border: '2px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: 38, fontWeight: 700,
          fontFamily: '"Inter Tight", sans-serif',
          letterSpacing: '-0.02em',
        }}>
          Mint as NFT
        </button>
      </div>
    </div>
  );
}

function ShareableCard({ card, mini = false, glowing = false }) {
  return (
    <div style={{
      width: '100%', aspectRatio: '9 / 14',
      borderRadius: mini ? 40 : 56,
      padding: mini ? 40 : 60,
      background: card.bg,
      boxShadow: glowing
        ? '0 40px 120px rgba(254, 59, 104, 0.6), 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 200px rgba(153,69,255,0.4)'
        : '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.18) inset',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      fontFamily: '"Inter Tight", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Noise/grain texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.3) 0%, transparent 50%)`,
      }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '0.18em',
            color: card.accent, textTransform: 'uppercase', opacity: 0.95,
          }}>{card.label}</div>
          <div style={{
            fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em',
            color: '#fff', marginTop: 8, opacity: 0.85,
          }}>WRAP / '26</div>
        </div>
        <CardIcon name={card.icon} size={120} color={card.accent} glow={card.accent} />
      </div>

      {/* Big stat */}
      <div style={{ position: 'relative', marginTop: 'auto' }}>
        <div style={{
          fontSize: card.stat.length > 4 ? 220 : 280,
          fontWeight: 900, lineHeight: 0.82,
          letterSpacing: '-0.06em', color: '#fff',
          textShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{card.stat}</div>
        {card.statUnit && (
          <div style={{
            fontSize: 64, fontWeight: 900, letterSpacing: '-0.03em',
            color: card.accent, marginTop: 0, lineHeight: 1,
          }}>{card.statUnit}</div>
        )}
        <div style={{
          fontSize: 36, fontWeight: 600, color: '#fff', opacity: 0.85,
          marginTop: 16, letterSpacing: '-0.01em',
        }}>{card.sub}</div>
      </div>

      {/* AI personality line */}
      <div style={{
        marginTop: 60, padding: '32px 0',
        borderTop: '2px solid rgba(255,255,255,0.18)',
        position: 'relative',
      }}>
        <div style={{
          fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1.25,
          letterSpacing: '-0.015em', textWrap: 'balance',
        }}>
          "{card.line}"
        </div>
      </div>

      {/* Pubkey + WRAP wordmark */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 40, position: 'relative',
      }}>
        <div style={{
          fontFamily: '"JetBrains Mono", "Courier New", monospace',
          fontSize: 26, fontWeight: 600, color: '#fff', opacity: 0.7,
          letterSpacing: '0.05em',
        }}>{card.pubkey}</div>
        <div style={{
          fontSize: 32, fontWeight: 900, color: '#fff',
          letterSpacing: '-0.04em',
        }}>WRAP</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 3 — Mint Confirmation
// ─────────────────────────────────────────────────────────────
function Screen3_Mint({ cardIndex, onSolscan, onShare, onBack }) {
  const card = CARDS[cardIndex];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      fontFamily: '"Inter Tight", sans-serif',
      display: 'flex', flexDirection: 'column',
      paddingTop: 150, paddingBottom: 140,
      overflow: 'hidden',
    }}>
      {/* Confetti / particles */}
      <Confetti />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: 600, left: '50%', transform: 'translateX(-50%)',
        width: 1200, height: 1200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(254,59,104,0.35) 0%, rgba(153,69,255,0.2) 40%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '40px 60px 20px', position: 'relative', zIndex: 2,
      }}>
        <button onClick={onBack} style={{
          width: 80, height: 80, borderRadius: 40, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)', color: '#fff',
          fontSize: 40, fontWeight: 700,
        }}>‹</button>
        <div style={{
          padding: '14px 28px', borderRadius: 100,
          background: 'rgba(0, 230, 118, 0.15)',
          border: '1.5px solid rgba(0, 230, 118, 0.5)',
          color: '#00E676', fontSize: 24, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: '#00E676' }} />
          Confirmed
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Mini card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 140px', position: 'relative', zIndex: 2 }}>
        <ShareableCard card={card} mini glowing />
      </div>

      {/* Headline */}
      <div style={{ padding: '0 80px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <h1 style={{
          fontSize: 96, fontWeight: 900, lineHeight: 0.95,
          letterSpacing: '-0.04em', color: '#fff', margin: 0,
        }}>
          Your story is<br/>
          <span style={gradText}>on-chain.</span>
        </h1>
        <div style={{
          fontSize: 32, fontWeight: 500, color: '#9b9bab',
          marginTop: 24, letterSpacing: '-0.01em',
        }}>
          cNFT minted to <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#fff', fontWeight: 600 }}>{card.pubkey}</span>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '40px 60px 0', display: 'flex', gap: 24, position: 'relative', zIndex: 2 }}>
        <button onClick={onSolscan} style={{
          flex: 1, height: 140, borderRadius: 70, cursor: 'pointer',
          background: 'transparent', border: '2px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: 36, fontWeight: 700,
          fontFamily: '"Inter Tight", sans-serif', letterSpacing: '-0.02em',
        }}>
          View on Solscan
        </button>
        <button onClick={onShare} style={{
          flex: 1, height: 140, borderRadius: 70, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(95deg, #FE3B68 0%, #9945FF 100%)',
          color: '#fff', fontSize: 36, fontWeight: 700,
          fontFamily: '"Inter Tight", sans-serif',
          boxShadow: '0 16px 40px rgba(254, 59, 104, 0.4)',
          letterSpacing: '-0.02em',
        }}>
          Share again
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  // Pre-generated confetti positions for stability
  const pieces = React.useMemo(() => {
    const colors = ['#FE3B68', '#FF6B3B', '#9945FF', '#FFB800', '#00E0FF', '#FFFFFF'];
    const arr = [];
    let seed = 1;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 60; i++) {
      arr.push({
        left: rand() * 100,
        top: rand() * 100,
        size: 8 + rand() * 18,
        rot: rand() * 360,
        color: colors[Math.floor(rand() * colors.length)],
        shape: rand() > 0.5 ? 'square' : 'circle',
      });
    }
    return arr;
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.left}%`, top: `${p.top}%`,
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.shape === 'circle' ? '50%' : 2,
          transform: `rotate(${p.rot}deg)`, opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 4 — Card Type Gallery
// ─────────────────────────────────────────────────────────────
function Screen4_Gallery({ cardIndex, setCardIndex, onPick, onBack }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      paddingTop: 150, paddingBottom: 140,
      fontFamily: '"Inter Tight", sans-serif',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '40px 60px 20px',
      }}>
        <button onClick={onBack} style={{
          width: 80, height: 80, borderRadius: 40, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)', color: '#fff',
          fontSize: 40, fontWeight: 700,
        }}>‹</button>
        <div style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '0.18em',
          color: '#9b9bab', textTransform: 'uppercase',
        }}>Gallery</div>
        <div style={{ width: 80 }} />
      </div>

      {/* Header */}
      <div style={{ padding: '40px 60px 50px' }}>
        <h1 style={{
          fontSize: 110, fontWeight: 900, lineHeight: 0.9,
          letterSpacing: '-0.05em', color: '#fff', margin: 0,
        }}>
          All your<br/>
          <span style={gradText}>stories.</span>
        </h1>
        <p style={{
          fontSize: 32, fontWeight: 500, color: '#9b9bab',
          marginTop: 24,
        }}>
          7 cards. Tap to open.
        </p>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {CARDS.map((c, i) => (
          <button key={c.id} onClick={() => onPick(i)} style={{
            border: 'none', padding: 0, cursor: 'pointer', background: 'transparent',
            textAlign: 'left',
          }}>
            <ThumbCard card={c} active={i === cardIndex} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ThumbCard({ card, active }) {
  return (
    <div style={{
      aspectRatio: '9 / 12',
      borderRadius: 32, padding: 28,
      background: card.bg,
      boxShadow: active
        ? '0 16px 50px rgba(0,0,0,0.5), 0 0 0 4px #fff inset'
        : '0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15) inset',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      fontFamily: '"Inter Tight", sans-serif',
      position: 'relative', overflow: 'hidden',
      transform: active ? 'scale(1.02)' : 'scale(1)',
      transition: 'transform 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontSize: 18, fontWeight: 800, letterSpacing: '0.16em',
          color: card.accent, textTransform: 'uppercase', opacity: 0.95,
          maxWidth: 140, lineHeight: 1.1,
        }}>{card.label}</div>
        <CardIcon name={card.icon} size={56} color={card.accent} />
      </div>
      <div>
        <div style={{
          fontSize: card.stat.length > 4 ? 64 : 92,
          fontWeight: 900, lineHeight: 0.85,
          letterSpacing: '-0.05em', color: '#fff',
        }}>{card.stat}</div>
        {card.statUnit && (
          <div style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '0.1em',
            color: card.accent, marginTop: 6,
          }}>{card.statUnit}</div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  Screen1_Onboarding, Screen2_Reveal, Screen3_Mint, Screen4_Gallery,
  ShareableCard, ThumbCard, FloatingCard,
});
