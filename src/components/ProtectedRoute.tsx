import { ReactNode, useEffect, useRef } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { PromptTypes } from '@kinde/js-utils';

/**
 * Wrap any route that requires a signed-in user.
 *
 * Why this exists:
 * - Previously, ProfilePage (and to a lesser extent OnboardingPage) each had
 *   their own ad-hoc "if not authenticated, do something" logic. ProfilePage's
 *   version called the bare `login()` inside a useEffect, which uses Kinde's
 *   default prompt behavior. If the user still has an active session at
 *   Kinde's hosted auth server (SSO), a bare `login()` call will silently
 *   redirect straight back through the callback with no credential prompt.
 *   That's the root cause of "click profile -> instantly back in" after logout.
 * - Centralizing the guard here means every protected page behaves the same
 *   way, and we always force `prompt: 'login'`, which tells Kinde to show the
 *   login screen even if an SSO session cookie exists.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, login } = useKindeAuth();
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !hasRedirected.current) {
            hasRedirected.current = true;
            // prompt: 'login' forces Kinde's hosted login screen to be shown even if
            // the browser still holds an active Kinde SSO session. Without this,
            // Kinde will happily reuse the existing session and skip credentials.
            login({ prompt: PromptTypes.login });
        }
    }, [isLoading, isAuthenticated, login]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
                <p className="text-sm text-gray-400">Redirecting to sign in…</p>
            </div>
        );
    }

    return <>{children}</>;
}