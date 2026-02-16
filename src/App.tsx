import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import HomePage from "./pages/HomePage";
import DocumentsPage from "./pages/DocumentsPage";
import TemplatesPage from "./pages/TemplatesPage";
import SignFormsPage from "./pages/SignFormsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import SigningInterface from "./pages/SigningInterface";
import PublicSignForm from "./pages/PublicSignForm";
import SignFormDetail from "./pages/SignFormDetail";
import CreateSignForm from "./pages/CreateSignForm";
import CreateTemplate from "./pages/CreateTemplate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />

              {/* Dashboard Pages - each is a separate tab/route */}
              <Route path="/dashboard" element={<HomePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/signforms" element={<SignFormsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Detail / Action Pages */}
              <Route path="/forms/:id" element={<PublicSignForm />} />
              <Route path="/signforms/create" element={<CreateSignForm />} />
              <Route path="/signforms/:id" element={<SignFormDetail />} />
              <Route path="/create-template" element={<CreateTemplate />} />
              <Route path="/edit-template/:id" element={<CreateTemplate />} />
              <Route path="/sign/:id" element={<SigningInterface />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
