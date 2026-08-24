import { useRef } from 'react';

type Props = {
  error: string;
  onReanalyze: () => void;
  onFile: (f: File) => void;
};

export default function ErrorScreen({ error, onReanalyze, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{
      flex: 1, borderRadius: 'var(--radius)',
      backgroundColor: '#080a0c',
      backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 2px,transparent 2px 10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 34px',
    }}>
      <div style={{
        width: '100%', borderRadius: 14,
        background: 'var(--surface)', border: '1px solid rgba(255,255,255,.1)',
        padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5,
          letterSpacing: '.12em', color: 'var(--accent)',
        }}>ANALYSIS FINISHED · 0 FRAMES</span>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 29, lineHeight: 1.15 }}>
          No pose detected.
        </div>
        <p style={{
          margin: 0, fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-muted)',
        }}>
          {error || 'Nothing in this clip read as a body. A side-on angle with the whole diver in frame works best. You can also reset the model and try the same clip again.'}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onReanalyze}
            style={{
              padding: '9px 20px', borderRadius: 'var(--radius-pill)',
              background: '#fff', color: '#000', fontSize: 12.5, fontWeight: 500,
            }}
          >Reanalyze</button>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              padding: '9px 18px', borderRadius: 'var(--radius-pill)',
              fontSize: 12.5, color: 'rgba(255,255,255,.85)',
              background: 'rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
            }}
          >Choose another clip</button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/mov,.mp4,.mov"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
