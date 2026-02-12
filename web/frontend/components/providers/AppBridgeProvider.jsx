import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Provider } from "@shopify/app-bridge-react";

/**
 * A component to configure App Bridge.
 * @desc A thin wrapper around AppBridgeProvider that provides the following capabilities:
 *
 * 1. Ensures that navigating inside the app updates the host URL.
 * 2. Configures the App Bridge Provider, which unlocks functionality provided by the host.
 *
 * See: https://shopify.dev/apps/tools/app-bridge/getting-started/using-react
 */
export function AppBridgeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const history = useMemo(
    () => ({
      replace: (path) => {
        navigate(path, { replace: true });
      },
    }),
    [navigate]
  );

  const routerConfig = useMemo(
    () => ({ history, location }),
    [history, location]
  );

  // The host may be present initially, but later removed by navigation.
  // By caching this in state, we ensure that the host is never lost.
  // During the lifecycle of an app, these values should never be updated anyway.
  // Using state in this way is preferable to useMemo.
  // See: https://stackoverflow.com/questions/60482318/version-of-usememo-for-caching-a-value-that-will-never-change
  const [appBridgeConfig] = useState(() => {
    const host =
      new URLSearchParams(location.search).get("host") ||
      window.__SHOPIFY_DEV_HOST;

    window.__SHOPIFY_DEV_HOST = host;

    return {
      host,
      apiKey: process.env.SHOPIFY_API_KEY,
      forceRedirect: true,
    };
  });

  if (!process.env.SHOPIFY_API_KEY || !appBridgeConfig.host) {
    const bannerProps = !process.env.SHOPIFY_API_KEY
      ? {
          heading: "Missing Shopify API Key",
          message: (
            <>
              Your app is running without the SHOPIFY_API_KEY environment
              variable. Please ensure that it is set when running or building
              your React app.
            </>
          ),
        }
      : {
          heading: "Missing host query argument",
          message: (
            <>
              Your app can only load if the URL has a <b>host</b> argument.
              Please ensure that it is set, or access your app using the
              Partners Dashboard <b>Test your app</b> feature
            </>
          ),
    };

    return (
      <s-page>
        <s-section>
          <div style={{ marginTop: "100px" }}>
            <s-banner heading={bannerProps.heading} tone="critical">
              {bannerProps.message}
            </s-banner>
          </div>
        </s-section>
      </s-page>
    );
  }

  return (
    <Provider config={appBridgeConfig} router={routerConfig}>
      {children}
    </Provider>
  );
}
