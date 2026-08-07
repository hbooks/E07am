import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavRail from "@/components/NavRail";


import FeedPage from "@/pages/IndexPage";
import CreateRoomPage from "@/pages/CreateRoomPage";
import NewsPage from "@/pages/NewsPage";
import SearchPage from "@/pages/SearchPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import OnboardingPage from "@/pages/onboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <NavRail />
          <main className="pb-20 md:pb-0 md:pl-20">
            <Routes>
              <Route path="/" element={<FeedPage />} />
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
);

export default App;
