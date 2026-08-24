type Props = {
  progress: number;
  statusMessage: string;
  totalFrames: number;
  sampleRate: number;
};

export default function ProgressScreen({ progress, statusMessage, totalFrames, sampleRate }: Props) {
  const pct = Math.round(progress * 100);
  const currentFrame = Math.round(progress * totalFrames);

  return (
    <div style={{
      flex: 1, borderRadius: 'var(--radius)',
      backgroundColor: '#080a0c',
      backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 2px,transparent 2px 10px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: '0 44px',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, textAlign: 'center' }}>
        Analyzing frame-by-frame
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ height: 6, borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,.12)' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            borderRadius: 'var(--radius-pill)', background: 'var(--accent)',
            transition: 'width 0.15s ease-out',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'rgba(255,255,255,.45)',
        }}>
          <span>frame {currentFrame} / {totalFrames} · {sampleRate} Hz</span>
          <span>{pct}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          <span style={{
            width: 14, height: 14, borderRadius: 'var(--radius-pill)',
            background: 'var(--accent)', opacity: 0.85,
          }} />
          {statusMessage || 'Pose model loaded'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          <span style={{
            width: 14, height: 14, borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(255,255,255,.3)',
          }} />
          Sampling clip · upload and playback paused until this finishes
        </div>
      </div>
    </div>
  );
}
