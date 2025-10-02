import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import en from "@shopify/polaris/locales/en.json";

import ShopifyLayout from "./components/layout/ShopifyLayout";
import Dashboard from "./pages/Dashboard";
import Shops from "./pages/Shops";
import Conversations from "./pages/Conversations";
import AISetup from "./pages/AISetup";
import StoreIntegration from "./pages/StoreIntegration";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import WidgetDemo from "./pages/WidgetDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider i18n={en}>
      <BrowserRouter>
        <ShopifyLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/ai-setup" element={<AISetup />} />
            <Route path="/store-integration" element={<StoreIntegration />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/widget-demo" element={<WidgetDemo />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ShopifyLayout>
      </BrowserRouter>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
