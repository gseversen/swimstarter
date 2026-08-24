import type { FrameResult } from '@swimstarter/engine';

const VISIBILITY_THRESHOLD = 0.5;

type Props = {
  frame: FrameResult | null;
  state: string;
  sampleRate: number;
  totalFrames: number;
};

export default function MetricsPanel({ frame, state, sampleRate, totalFrames }: Props) {
  const lowConf = frame && frame.confidence < VISIBILITY_THRESHOLD;
  const showMetrics = state === 'ready' && frame && !lowConf;
  const dash = '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Hip angle card */}
      <div style={{
        borderRadius: 'var(--radius)', background: 'var(--surface)',
        border: '1px solid var(--border)', padding: 20,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5,
          letterSpacing: '.12em', color: 'rgba(255,255,255,.4)',
        }}>HIP ANGLE</div>

        {state === 'modelLoading' && (
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>Loading pose model…</div>
        )}
        {state === 'analyzing' && (
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>Analyzing…</div>
        )}
        {(state === 'idle' || state === 'modelReady' || state === 'fileSelected') && (
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>Load a video to begin analysis.</div>
        )}
        {state === 'ready' && !frame && (
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)' }}>Ready — press play to see metrics.</div>
        )}

        {state === 'ready' && frame && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 86, lineHeight: .9 }}>
                {lowConf ? dash : frame.metrics.hipAngleDeg.toFixed(1)}
              </span>
              {!lowConf && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'rgba(255,255,255,.45)' }}>°</span>
              )}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,.1)' }}>
                <div style={{
                  width: `${Math.round(frame.confidence * 100)}%`, height: '100%',
                  borderRadius: 'var(--radius-pill)', background: 'var(--accent)',
                }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-muted)' }}>
                conf {frame.confidence.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Data rows */}
      {state === 'ready' && frame && (
        <div style={{
          borderRadius: 'var(--radius)', background: 'var(--surface)',
          border: '1px solid var(--border)', padding: '6px 18px',
        }}>
          {[
            ['Shoulder mid', showMetrics ? `${frame.metrics.shoulderMid.x.toFixed(3)}, ${frame.metrics.shoulderMid.y.toFixed(3)}` : dash],
            ['Hip mid', showMetrics ? `${frame.metrics.hipMid.x.toFixed(3)}, ${frame.metrics.hipMid.y.toFixed(3)}` : dash],
            ['Knee mid', showMetrics ? `${frame.metrics.kneeMid.x.toFixed(3)}, ${frame.metrics.kneeMid.y.toFixed(3)}` : dash],
            ['Sample rate', `${sampleRate} Hz · ${totalFrames} frames`],
          ].map(([label, value], i, arr) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '13px 0',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.07)' : 'none',
            }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cache notice */}
      {state === 'ready' && (
        <div style={{
          borderRadius: 'var(--radius)', padding: '14px 18px',
          background: 'rgba(255,255,255,0.04)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.2)',
          fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)',
        }}>
          Analysis is cached. Play, scrub and step read from the cache — the model does not run again.
        </div>
      )}
    </div>
  );
}
