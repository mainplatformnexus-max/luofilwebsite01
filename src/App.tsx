import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Detail from "./pages/Detail.tsx";
import PlayPage from "./pages/PlayPage.tsx";
import DramaPage from "./pages/DramaPage.tsx";
import MoviePage from "./pages/MoviePage.tsx";
import AnimePage from "./pages/AnimePage.tsx";
import VarietyShowPage from "./pages/VarietyShowPage.tsx";
import RankingPage from "./pages/RankingPage.tsx";
import LiveTVPage from "./pages/LiveTVPage.tsx";
import SportPage from "./pages/SportPage.tsx";
import PursuitOfJadePage from "./pages/PursuitOfJadePage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminMovies from "./pages/admin/AdminMovies.tsx";
import AdminSeries from "./pages/admin/AdminSeries.tsx";
import AdminEpisodes from "./pages/admin/AdminEpisodes.tsx";
import AdminCelebrity from "./pages/admin/AdminCelebrity.tsx";
import AdminCarousels from "./pages/admin/AdminCarousels.tsx";
import AdminRanking from "./pages/admin/AdminRanking.tsx";
import AdminWallet from "./pages/admin/AdminWallet.tsx";
import AdminActivities from "./pages/admin/AdminActivities.tsx";
import AdminSubscription from "./pages/admin/AdminSubscription.tsx";
import AdminComments from "./pages/admin/AdminComments.tsx";
import AdminAds from "./pages/admin/AdminAds.tsx";
import AdminLiveTV from "./pages/admin/AdminLiveTV.tsx";
import AdminSports from "./pages/admin/AdminSports.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/drama" element={<DramaPage />} />
            <Route path="/movie" element={<MoviePage />} />
            <Route path="/anime" element={<AnimePage />} />
            <Route path="/variety-show" element={<VarietyShowPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/live-tv" element={<LiveTVPage />} />
            <Route path="/sport" element={<SportPage />} />
            <Route path="/pursuit-of-jade" element={<PursuitOfJadePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/detail/:slug" element={<Detail />} />
            <Route path="/play/:slug" element={<PlayPage />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/active" element={<AdminUsers />} />
              <Route path="users/inactive" element={<AdminUsers />} />
              <Route path="movies" element={<AdminMovies />} />
              <Route path="series" element={<AdminSeries />} />
              <Route path="episodes" element={<AdminEpisodes />} />
              <Route path="celebrity" element={<AdminCelebrity />} />
              <Route path="carousels" element={<AdminCarousels />} />
              <Route path="ranking" element={<AdminRanking />} />
              <Route path="wallet" element={<AdminWallet />} />
              <Route path="activities" element={<AdminActivities />} />
              <Route path="subscription" element={<AdminSubscription />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="ads" element={<AdminAds />} />
              <Route path="live-tv" element={<AdminLiveTV />} />
              <Route path="sports" element={<AdminSports />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
