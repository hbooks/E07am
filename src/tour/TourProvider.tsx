import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FULL_TOUR, type TourStep } from './tourSteps';

const STORAGE_KEY = 'ctr_tour_full_completed';

interface TourContextValue {
    isActive: boolean;
    stepIndex: number;
    currentStep: TourStep | null;
    totalSteps: number;
    isStepPage: boolean;
    startTour: () => void;
    nextStep: () => void;
    skipTour: () => void;
    completeTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isActive, setIsActive] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const currentStep = isActive ? FULL_TOUR[stepIndex] ?? null : null;
    const isStepPage = currentStep ? currentStep.page === location.pathname : false;

    const startTour = useCallback(() => {
        try {
            if (localStorage.getItem(STORAGE_KEY) === '1') return;
        } catch { /* ignore */ }
        setStepIndex(0);
        setIsActive(true);
        if (location.pathname !== '/') navigate('/');
    }, [navigate, location.pathname]);

    const completeTour = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, '1');
        } catch { /* ignore */ }
        setIsActive(false);
        setStepIndex(0);
        if (location.pathname !== '/') navigate('/');
    }, [navigate, location.pathname]);

    const skipTour = useCallback(() => {
        completeTour();
    }, [completeTour]);

    const nextStep = useCallback(() => {
        setStepIndex((idx) => {
            const next = idx + 1;
            if (next >= FULL_TOUR.length) {
                // Just finished the last step
                try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
                setIsActive(false);
                if (location.pathname !== '/') navigate('/');
                return 0;
            }
            const nextDef = FULL_TOUR[next];
            if (nextDef.page !== location.pathname) {
                navigate(nextDef.page);
            }
            return next;
        });
    }, [navigate, location.pathname]);

    // Testing hook: window.dispatchEvent(new CustomEvent('ctr:tour:start'))
    useEffect(() => {
        const handler = () => startTour();
        window.addEventListener('ctr:tour:start', handler);
        return () => window.removeEventListener('ctr:tour:start', handler);
    }, [startTour]);

    const value = useMemo<TourContextValue>(() => ({
        isActive,
        stepIndex,
        currentStep,
        totalSteps: FULL_TOUR.length,
        isStepPage,
        startTour,
        nextStep,
        skipTour,
        completeTour,
    }), [isActive, stepIndex, currentStep, isStepPage, startTour, nextStep, skipTour, completeTour]);

    return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
    const ctx = useContext(TourContext);
    if (!ctx) throw new Error('useTour must be used inside <TourProvider>');
    return ctx;
}