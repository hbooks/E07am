import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useTour } from './TourProvider';
import { cn } from '@/lib/utils';

const PAD = 10;
const GAP = 18;
const TOOLTIP_MAX_W = 340;
const FAREWELL_MAX_W = 420;
const FADE_MS = 200;
const VIEWPORT_MARGIN = 16;
const POLL_MS = 100;
const TIMEOUT_MS = 5000;
const SKIP_W = 110;
const SKIP_H = 32;
const SKIP_M = 16;
const ARROW = 10;
const ARROW_EDGE = 18;
const DIM = 'rgba(0,0,0,0.7)';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const TOUR_CSS = `
@keyframes tour-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes tour-card-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes tour-ring-in {
  from { opacity: 0; transform: scale(1.05); }
  to { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .tour-root, .tour-root * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
`;

interface Rect { top: number; left: number; width: number; height: number; }
type Side = 'top' | 'bottom' | 'left' | 'right';
interface Arrow { side: Side; offset: number; }

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function arrowStyle(a: Arrow): React.CSSProperties {
    const base: React.CSSProperties = {
        position: 'absolute',
        width: ARROW,
        height: ARROW,
        background: '#141414',
        transform: 'rotate(45deg)',
        borderStyle: 'solid',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 0,
        zIndex: 1,
    };
    const half = ARROW / 2;
    switch (a.side) {
        // tooltip sits below the target, arrow on its top edge
        case 'bottom':
            return { ...base, top: -half, left: a.offset - half, borderTopWidth: 1, borderLeftWidth: 1 };
        // tooltip sits above the target, arrow on its bottom edge
        case 'top':
            return { ...base, bottom: -half, left: a.offset - half, borderBottomWidth: 1, borderRightWidth: 1 };
        // tooltip sits right of the target, arrow on its left edge
        case 'right':
            return { ...base, left: -half, top: a.offset - half, borderBottomWidth: 1, borderLeftWidth: 1 };
        // tooltip sits left of the target, arrow on its right edge
        case 'left':
            return { ...base, right: -half, top: a.offset - half, borderTopWidth: 1, borderRightWidth: 1 };
    }
}

function getRect(selector: string): Rect | null {
    const els = document.querySelectorAll(`[data-tour="${selector}"]`);
    for (const el of Array.from(els) as HTMLElement[]) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
            return {
                top: r.top - PAD,
                left: r.left - PAD,
                width: r.width + PAD * 2,
                height: r.height + PAD * 2,
            };
        }
    }
    return null;
}

function pickSide(preferred: Side, target: Rect, tip: { w: number; h: number }): Side {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const fits: Record<Side, boolean> = {
        top: target.top - GAP - tip.h >= VIEWPORT_MARGIN,
        bottom: target.top + target.height + GAP + tip.h <= vh - VIEWPORT_MARGIN,
        left: target.left - GAP - tip.w >= VIEWPORT_MARGIN,
        right: target.left + target.width + GAP + tip.w <= vw - VIEWPORT_MARGIN,
    };
    if (fits[preferred]) return preferred;
    const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    if (fits[opposite[preferred]]) return opposite[preferred];
    const others: Side[] = (['top', 'bottom', 'left', 'right'] as Side[]).filter(
        (s) => s !== preferred && s !== opposite[preferred],
    );
    for (const s of others) if (fits[s]) return s;
    return preferred;
}

function computeTooltipPos(side: Side, target: Rect, tip: { w: number; h: number }): { top: number; left: number } {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = 0;
    let left = 0;
    switch (side) {
        case 'bottom':
            top = target.top + target.height + GAP;
            left = target.left + target.width / 2 - tip.w / 2;
            break;
        case 'top':
            top = target.top - GAP - tip.h;
            left = target.left + target.width / 2 - tip.w / 2;
            break;
        case 'right':
            top = target.top + target.height / 2 - tip.h / 2;
            left = target.left + target.width + GAP;
            break;
        case 'left':
            top = target.top + target.height / 2 - tip.h / 2;
            left = target.left - GAP - tip.w;
            break;
    }
    left = Math.max(VIEWPORT_MARGIN, Math.min(vw - tip.w - VIEWPORT_MARGIN, left));
    top = Math.max(VIEWPORT_MARGIN, Math.min(vh - tip.h - VIEWPORT_MARGIN, top));
    return { top, left };
}

function targetCollidesWithSkipZone(target: Rect | null): boolean {
    if (!target) return false;
    const skipLeft = window.innerWidth - SKIP_M - SKIP_W;
    const skipTop = SKIP_M;
    const skipRight = window.innerWidth - SKIP_M;
    const skipBottom = SKIP_M + SKIP_H;
    const hitHorizontal = target.left < skipRight && target.left + target.width > skipLeft;
    const hitVertical = target.top < skipBottom && target.top + target.height > skipTop;
    return hitHorizontal && hitVertical;
}

export function TourOverlay() {
    const { isActive, currentStep, stepIndex, totalSteps, skipTour, nextStep, completeTour } = useTour();

    const [rect, setRect] = useState<Rect | null>(null);
    const [ready, setReady] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const [arrow, setArrow] = useState<Arrow | null>(null);
    const [skipOnLeft, setSkipOnLeft] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const isSkipTarget = currentStep?.target === 'tour-skip';
    const isFarewell = currentStep?.variant === 'farewell';

    // ---- Step 1: find target (or center for target:null) ----
    useLayoutEffect(() => {
        if (!isActive || !currentStep) {
            setRect(null);
            setReady(false);
            setPos(null);
            setSkipOnLeft(false);
            return;
        }
        setReady(false);
        setPos(null);

        if (currentStep.target === null) {
            setRect(null);
            setSkipOnLeft(false);
            requestAnimationFrame(() => setReady(true));
            return;
        }

        let cancelled = false;
        const startedAt = Date.now();

        const attempt = () => {
            if (cancelled) return;
            const r = getRect(currentStep.target!);
            if (r) {
                setRect(r);
                if (!isSkipTarget) setSkipOnLeft(targetCollidesWithSkipZone(r));
                else setSkipOnLeft(false);
                requestAnimationFrame(() => setReady(true));
                return;
            }
            if (Date.now() - startedAt > TIMEOUT_MS) {
                console.warn('[Tour] target missing, skipping step:', currentStep.id);
                nextStep();
                return;
            }
            setTimeout(attempt, POLL_MS);
        };
        attempt();
        return () => { cancelled = true; };
    }, [isActive, currentStep, nextStep, isSkipTarget]);

    // ---- Step 2: rAF re-measure ----
    useEffect(() => {
        if (!isActive || !currentStep || currentStep.target === null) return;
        let cancelled = false;
        let lastKey = '';
        let lastSkipSide: boolean | null = isSkipTarget ? false : null;

        const tick = () => {
            if (cancelled) return;
            const r = getRect(currentStep.target!);
            if (r) {
                const key = `${r.top}|${r.left}|${r.width}|${r.height}`;
                if (key !== lastKey) {
                    lastKey = key;
                    setRect(r);
                    if (!isSkipTarget) {
                        const collide = targetCollidesWithSkipZone(r);
                        if (collide !== lastSkipSide) {
                            lastSkipSide = collide;
                            setSkipOnLeft(collide);
                        }
                    }
                }
            }
            requestAnimationFrame(tick);
        };
        tick();
        return () => { cancelled = true; };
    }, [isActive, currentStep, isSkipTarget]);

    // ---- Step 3: tooltip position ----
    useLayoutEffect(() => {
        if (!ready || !currentStep || !tooltipRef.current) return;
        const tipEl = tooltipRef.current;
        const tip = { w: tipEl.offsetWidth, h: tipEl.offsetHeight };
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (!rect || currentStep.position === 'center') {
            setPos({ top: vh / 2 - tip.h / 2, left: vw / 2 - tip.w / 2 });
            setArrow(null);
            return;
        }
        const side = pickSide(currentStep.position as Side, rect, tip);
        const next = computeTooltipPos(side, rect, tip);
        setPos(next);
        if (side === 'top' || side === 'bottom') {
            const c = rect.left + rect.width / 2 - next.left;
            setArrow({ side, offset: clamp(c, ARROW_EDGE, tip.w - ARROW_EDGE) });
        } else {
            const c = rect.top + rect.height / 2 - next.top;
            setArrow({ side, offset: clamp(c, ARROW_EDGE, tip.h - ARROW_EDGE) });
        }
    }, [ready, rect, currentStep]);

    if (!isActive || !currentStep) return null;

    const isClickTarget = currentStep.interaction === 'click-target';

    const handleOverlayClick = () => {
        if (isClickTarget) return;
        if (isFarewell) return; // farewell has its own button
        nextStep();
    };

    // ============================================================
    // FAREWELL VARIANT
    // ============================================================
    if (isFarewell) {
        return (
            <div
                className="tour-root fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-label={currentStep.title}
                style={{ animation: `tour-fade-in ${FADE_MS}ms ease-out` }}
            >
                <style>{TOUR_CSS}</style>

                <div
                    className="w-full rounded-3xl border border-white/[0.08] bg-[#141414] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
                    style={{
                        maxWidth: FAREWELL_MAX_W,
                        animation: `tour-card-in 320ms ${EASE} both`,
                    }}
                >
                    <div className="flex flex-col items-center px-7 py-9 text-center">
                        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full border border-white/[0.1] bg-white/[0.04]">
                            <Check className="h-5 w-5 text-[#1E90FF]" strokeWidth={2.5} />
                        </div>

                        <h2 className="text-xl font-semibold tracking-tight text-white">
                            {currentStep.title}
                        </h2>
                        <p className="mt-2.5 max-w-[320px] text-[14px] leading-relaxed text-gray-400">
                            {currentStep.body}
                        </p>

                        <button
                            onClick={completeTour}
                            className="mt-7 inline-flex items-center justify-center rounded-full bg-[#1E90FF] px-8 py-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E90FF]"
                        >
                            Let's play
                        </button>

                        <p className="mt-4 text-[11px] text-gray-500">
                            You can revisit any of this in Settings or on each page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // NORMAL SPOTLIGHT VARIANT
    // ============================================================
    const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

    return (
        <div
            className="tour-root fixed inset-0 z-[100]"
            role="dialog"
            aria-label="Guided tour"
            onClick={handleOverlayClick}
            style={{ animation: `tour-fade-in ${FADE_MS}ms ease-out` }}
        >
            <style>{TOUR_CSS}</style>

            {rect ? (
                <>
                    {/* One element: rounded cut-out + dimmed surround. Glides between targets. */}
                    <div
                        style={{
                            position: 'fixed',
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                            borderRadius: 14,
                            boxShadow: `0 0 0 9999px ${DIM}`,
                            pointerEvents: 'none',
                            zIndex: 100,
                            transition: `top 320ms ${EASE}, left 320ms ${EASE}, width 320ms ${EASE}, height 320ms ${EASE}`,
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 'inherit',
                                border: '1.5px solid rgba(255,255,255,0.9)',
                                animation: `tour-ring-in 320ms ${EASE} both`,
                            }}
                        />
                    </div>

                    {isClickTarget && (
                        <div
                            onClick={(e) => { e.stopPropagation(); nextStep(); }}
                            style={{
                                position: 'fixed',
                                top: rect.top,
                                left: rect.left,
                                width: rect.width,
                                height: rect.height,
                                cursor: 'pointer',
                                zIndex: 101,
                            }}
                        />
                    )}
                </>
            ) : (
                <div style={{ position: 'fixed', inset: 0, background: DIM, backdropFilter: 'blur(2px)' }} />
            )}

            <button
                data-tour="tour-skip"
                onClick={(e) => { e.stopPropagation(); skipTour(); }}
                aria-label="Skip tour"
                className={cn(
                    'fixed z-[103] inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#141414]/95 px-3.5 py-1.5 text-xs font-medium text-gray-300 backdrop-blur',
                    'transition-[left,right,background-color,border-color,color] duration-300 ease-out',
                    'hover:border-white/[0.2] hover:bg-[#1a1a1a] hover:text-white',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E90FF]',
                )}
                style={{
                    top: SKIP_M,
                    right: skipOnLeft ? 'auto' : SKIP_M,
                    left: skipOnLeft ? SKIP_M : 'auto',
                    animation: `tour-fade-in ${FADE_MS}ms ease-out`,
                }}
            >
                <X className="h-3.5 w-3.5" />
                Skip tour
            </button>

            <div
                ref={tooltipRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed z-[103] rounded-2xl border border-white/[0.08] bg-[#141414] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]"
                style={{
                    top: pos ? pos.top : -9999,
                    left: pos ? pos.left : -9999,
                    width: `min(${TOOLTIP_MAX_W}px, calc(100vw - 32px))`,
                    opacity: pos ? 1 : 0,
                    pointerEvents: pos ? 'auto' : 'none',
                    animation: pos ? `tour-card-in 260ms ${EASE} both` : undefined,
                }}
            >
                {/* Progress */}
                <div className="overflow-hidden rounded-t-2xl">
                    <div className="h-[2px] bg-white/[0.06]">
                        <div
                            className="h-full bg-[#1E90FF]"
                            style={{ width: `${progress}%`, transition: `width 320ms ${EASE}` }}
                        />
                    </div>
                </div>

                {pos && arrow && <span aria-hidden="true" style={arrowStyle(arrow)} />}

                <div className="p-5">
                    <p className="text-[11px] font-medium tabular-nums text-gray-500">
                        Step {stepIndex + 1} of {totalSteps}
                    </p>

                    <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-white">{currentStep.title}</h3>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.55] text-gray-400">{currentStep.body}</p>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3.5">
                        <span className="text-[11px] text-gray-500">
                            {isClickTarget ? 'Tap the highlighted area' : 'Tap anywhere to continue'}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextStep(); }}
                            className="shrink-0 rounded-full bg-[#1E90FF] px-4 py-1.5 text-[12px] font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E90FF]"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}