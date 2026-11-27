import { useEffect } from 'react';

type Props = { onClose: () => void };

// x / y are percentages of the screenshot (/how-to.jpg) where each marker sits.
const STEPS = [
  { n: 1, x: 70.8, y: 2.8, title: 'Load a clip', body: 'Drop a dive video anywhere, or choose one. MP4 / MOV, 5–15s works best — it stays on your device.' },
  { n: 2, x: 45.4, y: 30, title: 'Analysis runs automatically', body: 'Once the clip and the pose model are ready, every frame is analyzed and the skeleton is drawn on the swimmer.' },
  { n: 3, x: 9.4, y: 73.3, title: 'Play, step, scrub', body: 'Use play / pause, ‹ › to step one frame at a time, or drag the scrub bar.' },
  { n: 4, x: 50.2, y: 66.7, title: 'Overlay controls', body: 'Toggle the Skeleton, or pick a landmark in Path to trace its motion.' },
  { n: 5, x: 92, y: 16.3, title: 'Hip angle & confidence', body: 'The big number is the hip angle for the current frame; the bar shows pose confidence.' },
  { n: 6, x: 12.8, y: 85.3, title: 'Hip angle chart', body: 'See the angle across the whole clip — the marker follows the playhead.' },
  { n: 7, x: 84.2, y: 5.8, title: 'Reanalyze', body: 'If the pose looks wrong, run the analysis again from the top bar.' },
];

export default function HowToModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(880px, calc(100% - 32px))', maxHeight: '85vh', overflowY: 'auto',
          borderRadius: 'var(--radius)', padding: '20px 22px 22px',
          background: 'var(--surface)',
          boxShadow: 'var(--glass-border-t), var(--glass-border-b), 0 24px 60px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 id="how-to-title" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400 }}>
            How to use SwimStarter
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 'var(--radius-pill)', flexShrink: 0,
              fontSize: 14, color: 'rgba(255,255,255,.85)',
              background: 'rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
            }}
          >✕</button>
        </div>

        <div style={{ position: 'relative' }}>
          <img
            src="/how-to.jpg"
            alt="SwimStarter after a video has been analyzed"
            style={{
              width: '100%', display: 'block', borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          />
          {STEPS.map(s => (
            <span
              key={s.n}
              aria-hidden="true"
              style={{
                position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 22, height: 22, borderRadius: 'var(--radius-pill)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent)', color: '#000',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                boxShadow: '0 0 0 3px rgba(0,0,0,.45)',
              }}
            >{s.n}</span>
          ))}
        </div>

        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map(s => (
            <li key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', minWidth: 14,
              }}>{s.n}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{s.title}</span> — {s.body}
              </span>
            </li>
          ))}
        </ol>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px', borderRadius: 'var(--radius-pill)',
              background: '#fff', color: '#000', fontSize: 12.5, fontWeight: 500,
            }}
          >Got it</button>
        </div>
      </div>
    </div>
  );
}
