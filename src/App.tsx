import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NewVersionDialog } from "@/components/NewVersionDialog";
import Landing from "./pages/Landing";
import ToolPageLayout from "./components/ToolPageLayout";
import ScrollToTop from "./components/ScrollToTop";
import OfferStickyBar from "./components/OfferStickyBar";
import UpgradePlanBanner from "./components/UpgradePlanBanner";
import ScrollToHash from "./components/ScrollToHash";
import { useAuthErrorHandler } from "./hooks/useAuthErrorHandler";
import WalkthroughTour from "./components/WalkthroughTour";
import AmbienceWalkthroughTour from "./components/AmbienceWalkthroughTour";

// Lazy-loaded routes (route-based code splitting)
const AtmosphericLanding = lazy(() => import("./pages/AtmosphericLanding"));
const FashionLanding = lazy(() => import("./pages/FashionLanding"));
const CreatorStudioLanding = lazy(() => import("./pages/CreatorStudioLanding"));
const IdeaStudioLanding = lazy(() => import("./pages/IdeaStudioLanding"));
const AdsStudioLanding = lazy(() => import("./pages/AdsStudioLanding"));
const ListingStudio = lazy(() => import("./pages/ListingStudio"));
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const AtmosphericGenerator = lazy(() => import("./pages/AtmosphericGenerator"));
const FashionGenerator = lazy(() => import("./pages/FashionGenerator"));
const CreatorStudioGenerator = lazy(() => import("./pages/CreatorStudioGenerator"));
const IdeaStudioGenerator = lazy(() => import("./pages/IdeaStudioGenerator"));
const BulkMockupGenerator = lazy(() => import("./pages/BulkMockupGenerator"));
const UltimateOutfitMakerV2 = lazy(() => import("./pages/UltimateOutfitMakerV2"));
const SimplePoseMaker = lazy(() => import("./pages/SimplePoseMaker"));
const AdsListingGenerator = lazy(() => import("./pages/AdsListingGenerator"));
const ListingStudioGenerator = lazy(() => import("./pages/ListingStudioGenerator"));
const ProductVideoCreator = lazy(() => import("./pages/ProductVideoCreator"));
const FlatlayStudio = lazy(() => import("./pages/FlatlayStudio"));
const FlatlayLanding = lazy(() => import("./pages/FlatlayLanding"));
const Tools = lazy(() => import("./pages/Tools"));
const RemixStudioGenerator = lazy(() => import("./pages/RemixStudioGenerator"));
const VirtualTourStudio = lazy(() => import("./pages/VirtualTourStudio"));
const CustomModels = lazy(() => import("./pages/CustomModels"));
const Community = lazy(() => import("./pages/Community"));
const MyGenerations = lazy(() => import("./pages/MyGenerations"));
const Editor = lazy(() => import("./pages/Editor"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminTools = lazy(() => import("./pages/AdminTools"));
const AdminTeam = lazy(() => import("./pages/AdminTeam"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminCases = lazy(() => import("./pages/AdminCases"));
const AdminIndustries = lazy(() => import("./pages/AdminIndustries"));
const DynamicBlogPost = lazy(() => import("./pages/DynamicBlogPost"));
const Settings = lazy(() => import("./pages/Settings"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Payment = lazy(() => import("./pages/Payment"));
const WelcomeOffer = lazy(() => import("./pages/WelcomeOffer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OurStory = lazy(() => import("./pages/OurStory"));
const OurMission = lazy(() => import("./pages/OurMission"));
const Team = lazy(() => import("./pages/Team"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PricingOneEuroOffer = lazy(() => import("./pages/PricingOneEuroOffer"));
const PricingFiftyOff = lazy(() => import("./pages/PricingFiftyOff"));
const Cases = lazy(() => import("./pages/Cases"));
const DynamicCase = lazy(() => import("./pages/DynamicCase"));
const Industries = lazy(() => import("./pages/Industries"));
const DynamicIndustryPage = lazy(() => import("./pages/DynamicIndustryPage"));
const Blog = lazy(() => import("./pages/Blog"));
const Contact = lazy(() => import("./pages/Contact"));
const RequestDemo = lazy(() => import("./pages/RequestDemo"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const UploadEmailHeader = lazy(() => import("./pages/UploadEmailHeader"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const KnowledgeBaseHub = lazy(() => import("./pages/KnowledgeBaseHub"));
const KnowledgeBaseAmbience = lazy(() => import("./pages/KnowledgeBaseAmbience"));
const KnowledgeBaseCreatorStudio = lazy(() => import("./pages/KnowledgeBaseCreatorStudio"));
const KnowledgeBaseFashion = lazy(() => import("./pages/KnowledgeBaseFashion"));
const KnowledgeBaseFlatlay = lazy(() => import("./pages/KnowledgeBaseFlatlay"));
const KnowledgeBaseIdeaStudio = lazy(() => import("./pages/KnowledgeBaseIdeaStudio"));
const KnowledgeBaseListingStudio = lazy(() => import("./pages/KnowledgeBaseListingStudio"));
const KnowledgeBaseAdsStudio = lazy(() => import("./pages/KnowledgeBaseAdsStudio"));
const KnowledgeBaseVirtualVideoStudio = lazy(() => import("./pages/KnowledgeBaseVirtualVideoStudio"));
const VirtualVideoStudioLanding = lazy(() => import("./pages/VirtualVideoStudioLanding"));
const FashionStudioProLanding = lazy(() => import("./pages/FashionStudioProLanding"));
const SocialMediaScraper = lazy(() => import("./pages/SocialMediaScraper"));
const KnowledgeBaseFashionPro = lazy(() => import("./pages/KnowledgeBaseFashionPro"));
const KnowledgeBasePromptGuide = lazy(() => import("./pages/KnowledgeBasePromptGuide"));

const queryClient = new QueryClient();

function langRoutes(path: string, element: React.ReactNode) {
  return <Route path={path} element={element} />;
}

const allRoutes = (
  <>
    <Route index element={<Landing />} />
    {langRoutes("ambience-studio", <AtmosphericLanding />)}
    {langRoutes("fashion-studio", <FashionLanding />)}
    {langRoutes("creator-studio", <CreatorStudioLanding />)}
    {langRoutes("idea-studio", <IdeaStudioLanding />)}
    {langRoutes("ads-studio", <AdsStudioLanding />)}
    {langRoutes("listing-studio", <ListingStudio />)}
    {langRoutes("flatlay-studio", <FlatlayLanding />)}
    {langRoutes("virtual-video-studio", <VirtualVideoStudioLanding />)}
    {langRoutes("fashion-studio-pro", <FashionStudioProLanding />)}
    {langRoutes("social-media-scraper", <SocialMediaScraper />)}
    {langRoutes("solutions", <Tools />)}
    {langRoutes("auth", <Auth />)}
    {langRoutes("reset-password", <ResetPassword />)}
    {langRoutes("onboarding", <Onboarding />)}
    {langRoutes("home", <Home />)}
    {langRoutes("editor", <Editor />)}
    {langRoutes("community", <Community />)}
    {langRoutes("my-generations", <MyGenerations />)}
    {langRoutes("settings", <Settings />)}
    {langRoutes("subscriptions", <Subscriptions />)}
    {langRoutes("payment", <Payment />)}
    {langRoutes("welcome-offer", <WelcomeOffer />)}
    {langRoutes("our-story", <OurStory />)}
    {langRoutes("our-mission", <OurMission />)}
    {langRoutes("team", <Team />)}
    {langRoutes("pricing", <Pricing />)}
    {langRoutes("pricing-1-euro-offer", <PricingOneEuroOffer />)}
    {langRoutes("pricing-50-off", <PricingFiftyOff />)}
    {langRoutes("blog", <Blog />)}
    <Route path="blog/:slug" element={<DynamicBlogPost />} />
    {langRoutes("cases", <Cases />)}
    <Route path="cases/:slug" element={<DynamicCase />} />
    {langRoutes("industries", <Industries />)}
    <Route path="industries/:slug" element={<DynamicIndustryPage />} />
    {langRoutes("knowledge-base", <KnowledgeBase />)}
    {langRoutes("knowledge-base-hub", <KnowledgeBaseHub />)}
    {langRoutes("knowledge-base/ads-studio", <KnowledgeBaseAdsStudio />)}
    {langRoutes("knowledge-base/ambience-studio", <KnowledgeBaseAmbience />)}
    {langRoutes("knowledge-base/creator-studio", <KnowledgeBaseCreatorStudio />)}
    {langRoutes("knowledge-base/fashion-studio", <KnowledgeBaseFashion />)}
    {langRoutes("knowledge-base/flatlay-studio", <KnowledgeBaseFlatlay />)}
    {langRoutes("knowledge-base/idea-studio", <KnowledgeBaseIdeaStudio />)}
    {langRoutes("knowledge-base/listing-studio", <KnowledgeBaseListingStudio />)}
    {langRoutes("knowledge-base/virtual-video-studio", <KnowledgeBaseVirtualVideoStudio />)}
    {langRoutes("knowledge-base/fashion-studio-pro", <KnowledgeBaseFashionPro />)}
    {langRoutes("knowledge-base/prompt-guide", <KnowledgeBasePromptGuide />)}
    {langRoutes("contact", <Contact />)}
    {langRoutes("request-demo", <RequestDemo />)}
    {langRoutes("privacy-policy", <PrivacyPolicy />)}
    {langRoutes("terms-conditions", <TermsConditions />)}
    <Route path="tool/atmospheric" element={<ToolPageLayout><AtmosphericGenerator /></ToolPageLayout>} />
    <Route path="tool/fashion" element={<ToolPageLayout><FashionGenerator /></ToolPageLayout>} />
    <Route path="tool/fashion-v2" element={<ToolPageLayout><BulkMockupGenerator /></ToolPageLayout>} />
    <Route path="tool/fashion-2.0" element={<ToolPageLayout><BulkMockupGenerator /></ToolPageLayout>} />
    <Route path="tool/creator-studio" element={<ToolPageLayout><CreatorStudioGenerator /></ToolPageLayout>} />
    <Route path="tool/idea-studio" element={<ToolPageLayout><IdeaStudioGenerator /></ToolPageLayout>} />
    <Route path="tool/ultimate-outfit-maker" element={<ToolPageLayout><BulkMockupGenerator /></ToolPageLayout>} />
    <Route path="tool/ultimate-outfit-maker-v2" element={<ToolPageLayout><UltimateOutfitMakerV2 /></ToolPageLayout>} />
    <Route path="tool/simple-pose-maker" element={<ToolPageLayout><SimplePoseMaker /></ToolPageLayout>} />
    <Route path="tool/ads-listing-studio" element={<ToolPageLayout><AdsListingGenerator /></ToolPageLayout>} />
    <Route path="tool/ads-listing" element={<ToolPageLayout><AdsListingGenerator /></ToolPageLayout>} />
    <Route path="tool/listing-studio" element={<ToolPageLayout><ListingStudioGenerator /></ToolPageLayout>} />
    <Route path="tool/product-video" element={<ToolPageLayout><ProductVideoCreator /></ToolPageLayout>} />
    <Route path="tool/flatlay-studio" element={<ToolPageLayout><FlatlayStudio /></ToolPageLayout>} />
    <Route path="tool/remix-studio" element={<ToolPageLayout><RemixStudioGenerator /></ToolPageLayout>} />
    <Route path="tool/property-studio" element={<ToolPageLayout><VirtualTourStudio /></ToolPageLayout>} />
    <Route path="tool/virtual-tour" element={<ToolPageLayout><VirtualTourStudio /></ToolPageLayout>} />
    <Route path="tool/bulk-mockup" element={<ToolPageLayout><BulkMockupGenerator /></ToolPageLayout>} />
    <Route path="upload-email-header" element={<UploadEmailHeader />} />
    {langRoutes("custom-models", <CustomModels />)}
  </>
);

const AppContent = () => {
  useAuthErrorHandler();
  
  return (
    <>
      <ScrollToTop />
      <ScrollToHash />
      <Suspense fallback={null}>
      <Routes>
        {allRoutes}
        {/* Admin routes */}
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<Admin />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/tools" element={<AdminTools />} />
        <Route path="admin/team" element={<AdminTeam />} />
        <Route path="admin/blog" element={<AdminBlog />} />
        <Route path="admin/cases" element={<AdminCases />} />
        <Route path="admin/industries" element={<AdminIndustries />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <WalkthroughTour />
      <AmbienceWalkthroughTour />
    </>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
            <Toaster />
            <Sonner />
            <NewVersionDialog />
            <BrowserRouter>
              <OfferStickyBar />
              <UpgradePlanBanner />
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
};

export default App;
