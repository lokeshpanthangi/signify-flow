import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import CreateDocument from "./pages/CreateDocument";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forms/:id" element={<PublicSignForm />} />
              <Route path="/sign/:id" element={<SigningInterface />} />

              {/* Protected dashboard routes */}
              <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/signforms" element={<ProtectedRoute><SignFormsPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Protected detail / action routes */}
              <Route path="/signforms/create" element={<ProtectedRoute><CreateSignForm /></ProtectedRoute>} />
              <Route path="/signforms/:id" element={<ProtectedRoute><SignFormDetail /></ProtectedRoute>} />
              <Route path="/create-template" element={<ProtectedRoute><CreateTemplate /></ProtectedRoute>} />
              <Route path="/edit-template/:id" element={<ProtectedRoute><CreateTemplate /></ProtectedRoute>} />
              <Route path="/view-template/:id" element={<ProtectedRoute><CreateTemplate /></ProtectedRoute>} />
              <Route path="/create-document" element={<ProtectedRoute><CreateDocument /></ProtectedRoute>} />
              <Route path="/edit-document/:id" element={<ProtectedRoute><CreateDocument /></ProtectedRoute>} />
              <Route path="/view-document/:id" element={<ProtectedRoute><CreateDocument /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
