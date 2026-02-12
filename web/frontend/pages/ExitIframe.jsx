import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ExitIframe() {
  const { search } = useLocation();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const shopifyGlobal = window["shopify"];
    shopifyGlobal?.loading?.(true);

    const params = new URLSearchParams(search);
    const redirectUri = params.get("redirectUri");

    if (!redirectUri) {
      setShowWarning(true);
      shopifyGlobal?.loading?.(false);
      return undefined;
    }

    try {
      const decodedUri = decodeURIComponent(redirectUri);
      const url = new URL(decodedUri);

      if (
        [location.hostname, "admin.shopify.com"].includes(url.hostname) ||
        url.hostname.endsWith(".myshopify.com")
      ) {
        open(decodedUri, "_top");
      } else {
        setShowWarning(true);
        shopifyGlobal?.loading?.(false);
      }
    } catch (_error) {
      setShowWarning(true);
      shopifyGlobal?.loading?.(false);
    }

    return undefined;
  }, [search]);

  useEffect(() => {
    if (showWarning) {
      window["shopify"]?.loading?.(false);
    }

    return () => {
      window["shopify"]?.loading?.(false);
    };
  }, [showWarning]);

  return showWarning ? (
    <s-page>
      <s-section>
        <div style={{ marginTop: "100px" }}>
          <s-banner heading="Redirecting outside of Shopify" tone="warning">
            Apps can only use /exitiframe to reach Shopify or the app itself.
          </s-banner>
        </div>
      </s-section>
    </s-page>
  ) : (
    null
  );
}
