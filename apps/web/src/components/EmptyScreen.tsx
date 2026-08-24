import { useRef } from 'react';

type Props = { onFile: (f: File) => void };

export default function EmptyScreen({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      style={{
        flex: 1, borderRadius: 'var(--radius)',
        border: '1px dashed rgba(255,255,255,.22)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 14, textAlign: 'center', padding: '0 40px',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 1.1,
      }}>
        Load a video to <em style={{ color: 'var(--text-muted)' }}>begin</em>
      </div>
      <p style={{
        margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-muted)',
      }}>
        Drop a dive clip here, or choose one from your device.
        Analysis starts on its own once the clip and the pose model are both ready.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '10px 22px', borderRadius: 'var(--radius-pill)',
            background: '#fff', color: '#000', fontSize: 12.5, fontWeight: 500,
          }}
        >Choose a clip</button>
        <button style={{
          padding: '10px 20px', borderRadius: 'var(--radius-pill)',
          fontSize: 12.5, color: 'rgba(255,255,255,.85)',
          background: 'rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
        }}>Open library</button>
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'rgba(255,255,255,.3)',
      }}>
        MP4 / MOV · 5–15s works best · stays on this device
      </span>
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
