import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import NotFoundPage from '@/pages/NotFoundPage';

const ADMIN_ID = import.meta.env.VITE_ADID;

function ResolvingSession() {
    return (
        <div className="grid min-h-screen place-items-center bg-[#0A0A0A] text-white">
            <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#1E90FF]" />
                <p className="text-sm text-gray-500">Deep searching for the requested content/page…</p>
            </div>
        </div>
    );
}

export default function AdminGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useKindeAuth();

    // Don't decide anything until Kinde has actually resolved — deciding early
    // would either flash a wrong 404 for you or briefly expose the admin page
    // before we know who's asking.
    if (isLoading) {
        return <ResolvingSession />;
    }

    // Not you (or not signed in at all) → the route simply doesn't exist,
    // same as any other bad URL. No "access denied", nothing to signal that
    // /admin is even a real page.
    if (!isAuthenticated || !ADMIN_ID || user?.id !== ADMIN_ID) {
        return <NotFoundPage />;
    }

    return <>{children}</>;
}