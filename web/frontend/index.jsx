import App from "./App";
import { createRoot } from "react-dom/client";
import { initI18n } from "./utils/i18nUtils";

const apiKeyMetaTag = document.querySelector('meta[name="shopify-api-key"]');
if (apiKeyMetaTag && process.env.SHOPIFY_API_KEY) {
  const configuredApiKey = apiKeyMetaTag.getAttribute("content") || "";
  if (!configuredApiKey || configuredApiKey.includes("%SHOPIFY_API_KEY%")) {
    apiKeyMetaTag.setAttribute("content", process.env.SHOPIFY_API_KEY);
  }
}

// Ensure that locales are loaded before rendering the app
initI18n().then(() => {
  const root = createRoot(document.getElementById("app"));
  root.render(<App />);
});
