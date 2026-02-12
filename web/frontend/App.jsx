import { useEffect } from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavigationMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import { AppBridgeProvider, QueryProvider } from "./components";

function ShopifyNavigateHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigation = (event) => {
      const destination =
        event?.detail?.path || event?.detail?.url || event?.detail;

      if (typeof destination === "string" && destination.length > 0) {
        navigate(destination);
      }
    };

    document.addEventListener("shopify:navigate", handleNavigation);
    return () => {
      document.removeEventListener("shopify:navigate", handleNavigation);
    };
  }, [navigate]);

  return null;
}

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <ShopifyNavigateHandler />
      <AppBridgeProvider>
        <QueryProvider>
          <NavigationMenu
            navigationLinks={[
              {
                label: t("NavigationMenu.pageName"),
                destination: "/pagename",
              },
            ]}
          />
          <Routes pages={pages} />
        </QueryProvider>
      </AppBridgeProvider>
    </BrowserRouter>
  );
}
