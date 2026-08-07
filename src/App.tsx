import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavRail from "@/components/NavRail";

import IndexPage from "@/pages/IndexPage";
import CreateRoomPage from "@/pages/CreateRoomPage";
import NewsPage from "@/pages/NewsPage";
import SearchPage from "@/pages/SearchPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import OnboardingPage from "@/pages/OnboardingPage";   
const queryClient = new QueryClient();

const App = () => (
  <KindeProvider
    clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
    domain={import.meta.env.VITE_KINDE_DOMAIN}
    redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URI}
    logoutUri={import.meta.env.VITE_KINDE_LOGOUT_REDIRECT_URI}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <NavRail />
            <main className="pb-20 md:pb-0 md:pl-20">
              <Routes>
                <Route path="/" element={<IndexPage />} />
                <Route path="/create" element={<CreateRoomPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </KindeProvider>
);

export default App;
