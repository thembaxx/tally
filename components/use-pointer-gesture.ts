'use client';
import { useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from 'react';

export type Gesture = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  velocityX: number;
  velocityY: number;
};
type Options = {
  enabled?: boolean;
  onStart?: (gesture: Gesture) => void;
  onMove?: (gesture: Gesture) => void;
  onEnd: (gesture: Gesture) => void;
  onCancel: () => void;
};
type Session = {
  id: number;
  element: HTMLElement;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  time: number;
  velocityX: number;
  velocityY: number;
  moved: boolean;
  cleanup: () => void;
};

/** One pointer owns an interaction. OS cancellation and a second finger never submit it. */
export function usePointerGesture(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const session = useRef<Session | null>(null);
  const ignoreClickUntil = useRef(0);

  function stop() {
    const active = session.current;
    session.current = null;
    if (active) {
      active.cleanup();
      if (active.moved) ignoreClickUntil.current = Date.now() + 400;
      if (active.element.hasPointerCapture(active.id))
        active.element.releasePointerCapture(active.id);
    }
    return active;
  }
  function cancel() {
    if (stop()?.moved) latest.current.onCancel();
  }
  useEffect(() => {
    if (options.enabled === false) cancel();
    return () => {
      stop();
    };
    // Only enabled changes cancel a session; callbacks remain current through the ref.
  }, [options.enabled]);

  function position(event: PointerEvent<HTMLElement>, active: Session): Gesture {
    return {
      x: event.clientX,
      y: event.clientY,
      dx: event.clientX - active.startX,
      dy: event.clientY - active.startY,
      velocityX: event.timeStamp - active.time < 100 ? active.velocityX : 0,
      velocityY: event.timeStamp - active.time < 100 ? active.velocityY : 0,
    };
  }
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (latest.current.enabled === false || event.button !== 0 || !event.isPrimary) return;
      if (session.current) {
        cancel();
        return;
      }
      ignoreClickUntil.current = 0;
      const anotherPointer = (other: globalThis.PointerEvent) => {
        if (other.pointerId !== session.current?.id) cancel();
      };
      const hidden = () => {
        if (document.hidden) cancel();
      };
      document.addEventListener('pointerdown', anotherPointer, true);
      document.addEventListener('visibilitychange', hidden);
      window.addEventListener('blur', cancel);
      session.current = {
        id: event.pointerId,
        element: event.currentTarget,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        time: event.timeStamp,
        velocityX: 0,
        velocityY: 0,
        moved: false,
        cleanup: () => {
          document.removeEventListener('pointerdown', anotherPointer, true);
          document.removeEventListener('visibilitychange', hidden);
          window.removeEventListener('blur', cancel);
        },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const active = session.current;
      if (!active || event.pointerId !== active.id) return;
      const elapsed = Math.max(1, event.timeStamp - active.time);
      active.velocityX = (event.clientX - active.lastX) / elapsed;
      active.velocityY = (event.clientY - active.lastY) / elapsed;
      active.lastX = event.clientX;
      active.lastY = event.clientY;
      active.time = event.timeStamp;
      const gesture = position(event, active);
      if (!active.moved && Math.hypot(gesture.dx, gesture.dy) >= 8) {
        active.moved = true;
        latest.current.onStart?.(gesture);
      }
      if (active.moved) latest.current.onMove?.(gesture);
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const active = session.current;
      if (!active || event.pointerId !== active.id) return;
      const gesture = position(event, active);
      if (Math.hypot(gesture.dx, gesture.dy) >= 8) active.moved = true;
      stop();
      if (active.moved) {
        if (latest.current.enabled !== false) latest.current.onEnd(gesture);
        else latest.current.onCancel();
      }
    },
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (event.detail > 0 && Date.now() < ignoreClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}

export function swipeDirection(gesture: Gesture) {
  const horizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2;
  const vertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;
  const distance = horizontal ? Math.abs(gesture.dx) : Math.abs(gesture.dy);
  const velocity = horizontal ? Math.abs(gesture.velocityX) : Math.abs(gesture.velocityY);
  if ((!horizontal && !vertical) || (distance < 58 && !(distance >= 28 && velocity >= 0.5)))
    return null;
  return horizontal ? (gesture.dx < 0 ? 'left' : 'right') : gesture.dy < 0 ? 'up' : 'down';
}

/** Keep a captured drag usable when its destination is beyond a sheet's edge. */
export function useDragAutoScroll(
  active: boolean,
  point: RefObject<{ y: number }>,
  origin: RefObject<HTMLElement | null>,
  onScroll?: () => void,
) {
  const latest = useRef(onScroll);
  latest.current = onScroll;
  useEffect(() => {
    if (!active) return;
    const sheet = origin.current?.closest<HTMLElement>('[role="dialog"]');
    if (!sheet) return;
    let frame = 0;
    let previous = performance.now();
    function scroll(now: number) {
      const bounds = sheet!.getBoundingClientRect();
      const y = point.current.y;
      const speed =
        y < bounds.top + 60
          ? -Math.min(14, (bounds.top + 60 - y) / 4)
          : y > bounds.bottom - 60
            ? Math.min(14, (y - bounds.bottom + 60) / 4)
            : 0;
      if (speed) {
        sheet!.scrollTop += speed * Math.min(2, (now - previous) / 16.7);
        latest.current?.();
      }
      previous = now;
      frame = requestAnimationFrame(scroll);
    }
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [active, point, origin]);
}
