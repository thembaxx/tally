'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { XIcon } from '@phosphor-icons/react';
import { useRef, type ReactNode } from 'react';
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
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
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
          <div className="modal-handle" />
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
