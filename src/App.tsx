import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavRail from "@/components/NavRail";
import ProtectedRoute from "@/components/ProtectedRoute";
import VersionCheck from '@/components/VersionCheck';
import MaintenanceGate from "@/components/MaintenanceGate";
import AdminGate from "@/components/AdminGate";

import IndexPage from "@/pages/IndexPage";
import CreateRoomPage from "@/pages/CreateRoomPage";
import NewsPage from "@/pages/NewsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ResultsPage from "./pages/ResultsPage";
import UpdateSquadPage from "@/pages/UpdateSquadPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

// The normal consumer-app shell — nav rail, bell, page outlet. Everything
// EXCEPT /admin renders inside this, and this whole shell sits behind the
// maintenance gate.
function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavRail />
      <main className="pb-20 md:pb-0 md:pl-20">
        <Outlet />
      </main>
    </div>
  );
}

const App = () => (
  <KindeProvider
    clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
    domain={import.meta.env.VITE_KINDE_DOMAIN}
    redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URI}
    logoutUri={import.meta.env.VITE_KINDE_LOGOUT_REDIRECT_URI || import.meta.env.VITE_KINDE_REDIRECT_URI}
  >
    <QueryClientProvider client={queryClient}>
      <VersionCheck />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* /admin: no nav rail, no notification bell, no maintenance gate
                (so you can never lock yourself out of the page that turns
                maintenance off), and gated by your Kinde ID specifically —
                anyone else gets a 404, not a login screen. */}
            <Route
              path="/admin"
              element={
                <AdminGate>
                  <AdminPage />
                </AdminGate>
              }
            />

            {/* Everything else lives behind the maintenance gate + normal app shell */}
            <Route
              element={
                <MaintenanceGate>
                  <AppShell />
                </MaintenanceGate>
              }
            >
              <Route path="/" element={<IndexPage />} />
              <Route path="/create" element={<CreateRoomPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/update-squad" element={<UpdateSquadPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </KindeProvider>
);

export default App;