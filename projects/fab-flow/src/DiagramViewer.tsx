import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import './engineering-diagrams.css';

function prefixDiagramIds(node: ReactNode, prefix: string): ReactNode {
  return Children.map(node, child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    const props = child.props as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') continue;
      if (key === 'id' && typeof value === 'string') next[key] = `${prefix}-${value}`;
      else if ((key === 'aria-labelledby' || key === 'aria-describedby') && typeof value === 'string') next[key] = value.split(/\s+/).map(id => `${prefix}-${id}`).join(' ');
      else if (typeof value === 'string' && /^(?:marker(?:Start|Mid|End)|clipPath|filter|mask|fill|stroke)$/.test(key)) next[key] = value.replace(/url\(#([^)]*)\)/g, `url(#${prefix}-$1)`);
      else if (typeof value === 'string' && (key === 'href' || key === 'xlinkHref') && value.startsWith('#')) next[key] = `#${prefix}-${value.slice(1)}`;
      else next[key] = value;
    }
    return cloneElement(child, next, prefixDiagramIds(child.props.children, prefix));
  });
}

export function DiagramViewer({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [fit, setFit] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousOverflowRef = useRef('');
  const viewerId = useId().replace(/:/g, '');
  const titleId = `${viewerId}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      previousOverflowRef.current = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      if (dialog.open) dialog.close();
      document.documentElement.style.overflow = previousOverflowRef.current;
    };
  }, [open]);

  const close = () => {
    document.documentElement.style.overflow = previousOverflowRef.current;
    setOpen(false);
    setFit(true);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  };

  return <div className="ed-visual-wrap">
    <div className="ed-scroll" tabIndex={0} role="region" aria-label={label}>{children}</div>
    <div className="ed-visual-tools">
      <span>가로로 움직여 세부를 보거나, 크게 열어 읽을 수 있습니다</span>
      <button ref={triggerRef} type="button" onClick={() => { setFit(window.innerWidth > 640); setOpen(true); }} aria-haspopup="dialog">도식 크게 보기 ↗</button>
    </div>
    <dialog ref={dialogRef} className="diagram-viewer" aria-labelledby={titleId} onClose={close}>
      <div className="diagram-viewer-shell">
        <header className="diagram-viewer-toolbar">
          <strong id={titleId}>{label}</strong>
          <div>
            <button type="button" aria-pressed={fit} onClick={() => setFit(true)}>화면에 맞추기</button>
            <button type="button" aria-pressed={!fit} onClick={() => setFit(false)}>원본 크기</button>
            <button type="button" className="diagram-viewer-close" onClick={() => dialogRef.current?.close()}>닫기 <span aria-hidden="true">×</span></button>
          </div>
        </header>
        {open && <div className={'diagram-viewer-scroll' + (fit ? ' is-fit' : ' is-original')} tabIndex={0} role="region" aria-label="확대 도식. 원본 크기에서는 가로와 세로로 스크롤할 수 있습니다. 화살표 키와 Page Up·Page Down으로 이동합니다." onKeyDown={event => {
          const region = event.currentTarget;
          const amount = 48;
          if (event.key === 'ArrowRight') region.scrollBy({ left: amount });
          else if (event.key === 'ArrowLeft') region.scrollBy({ left: -amount });
          else if (event.key === 'ArrowDown' || event.key === 'PageDown') region.scrollBy({ top: amount * 3 });
          else if (event.key === 'ArrowUp' || event.key === 'PageUp') region.scrollBy({ top: -amount * 3 });
          else if (event.key === 'Home') region.scrollTo({ left: 0, top: 0 });
          else if (event.key === 'End') region.scrollTo({ left: region.scrollWidth, top: region.scrollHeight });
          else return;
          event.preventDefault();
        }}>
          <div className="diagram-viewer-content">{prefixDiagramIds(children, viewerId)}</div>
        </div>}
        <p className="diagram-viewer-help">키보드에서는 도식 영역에 초점을 두고 화살표 키나 Page Up·Page Down을 사용하세요. 터치에서는 도식을 가로·세로로 밀어 이동하고, Esc로 닫습니다.</p>
      </div>
    </dialog>
  </div>;
}
