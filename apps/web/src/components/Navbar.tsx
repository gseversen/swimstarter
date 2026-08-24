import { useRef } from 'react';
import type { AppContext } from '../machine/appMachine.js';

type Props = {
  ctx: AppContext;
  onFile: (f: File) => void;
  onReanalyze: () => void;
  onSave: () => void;
};

export default function Navbar({ ctx, onFile, onReanalyze, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const fileName = ctx.file?.name ?? '';
  const duration = ctx.state === 'ready' || ctx.state === 'analyzing' || ctx.state === 'error'
    ? '' : '';

  const showFileInfo = ctx.file && ctx.state !== 'idle' && ctx.state !== 'modelLoading';
  const showReanalyze = ctx.state === 'ready' || ctx.state === 'error';
  const showSave = ctx.state === 'ready';
  const disabled = ctx.state === 'analyzing';

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 14px 9px 18px', borderRadius: 'var(--radius-pill)',
      background: 'var(--glass)', backdropFilter: 'blur(8px)',
      boxShadow: 'var(--glass-border-t), var(--glass-border-b)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '.01em' }}>
            SwimStarter
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
            v2
          </span>
        </div>
        <div style={{ display: 'flex', gap: 22, fontSize: 13, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--text)' }}>Analyze</span>
          <span>Library</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showFileInfo && (
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            {fileName}
          </span>
        )}
        {showReanalyze && (
          <button
            onClick={onReanalyze}
            disabled={disabled}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-pill)', fontSize: 12.5,
              color: 'rgba(255,255,255,.85)',
              background: 'rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25)',
            }}
          >Reanalyze</button>
        )}
        {showSave && (
          <button
            onClick={onSave}
            style={{
              padding: '7px 18px', borderRadius: 'var(--radius-pill)', fontSize: 12.5,
              fontWeight: 500, background: '#fff', color: '#000',
            }}
          >Save session</button>
        )}
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
    </nav>
  );
}
