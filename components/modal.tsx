'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { XIcon } from '@phosphor-icons/react';
import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { usePointerGesture } from './use-pointer-gesture';
const DialogContent = motion.create(Dialog.Content);
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const opener = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const canPull = useRef(false);
  const rebound = useRef<Animation | null>(null);
  const still = useReducedMotion();
  function resetPull() {
    const element = content.current;
    if (!element) return;
    rebound.current?.cancel();
    rebound.current = element.animate(
      [{ translate: element.style.translate || '0 0' }, { translate: '0 0' }],
      { duration: still ? 0 : 200, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
    element.style.translate = '0 0';
  }
  const pull = usePointerGesture({
    enabled: open,
    onStart: () => {
      canPull.current =
        matchMedia('(max-width: 760px)').matches && (content.current?.scrollTop || 0) <= 1;
      rebound.current?.cancel();
    },
    onMove: (move) => {
      if (canPull.current && content.current)
        content.current.style.translate = `0 ${Math.max(0, Math.min(190, move.dy * 0.7))}px`;
    },
    onEnd: (move) => {
      if (
        canPull.current &&
        move.dy > Math.abs(move.dx) * 1.4 &&
        (move.dy > 110 || (move.dy > 50 && move.velocityY > 0.6))
      )
        onClose();
      else resetPull();
    },
    onCancel: resetPull,
  });
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <DialogContent
          ref={content}
          layoutScroll
          className={`modal ${wide ? 'wide' : ''}`}
          onOpenAutoFocus={() => {
            opener.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            if (opener.current?.isConnected) {
              event.preventDefault();
              opener.current.focus({ preventScroll: true });
            }
          }}
        >
          <button
            type="button"
            className="modal-handle"
            aria-label="Dismiss panel"
            title="Drag down to close"
            onClick={onClose}
            {...pull}
          >
            <span />
          </button>
          <div className="modal-top">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description>{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title} panel</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="icon-button close-button" aria-label="Close">
                <XIcon size={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
