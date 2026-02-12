import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge, Loading } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ExitIframe() {
  const app = useAppBridge();
  const { search } = useLocation();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!!app && !!search) {
      const params = new URLSearchParams(search);
      const redirectUri = params.get("redirectUri");
      const url = new URL(decodeURIComponent(redirectUri));

      if (
        [location.hostname, "admin.shopify.com"].includes(url.hostname) ||
        url.hostname.endsWith(".myshopify.com")
      ) {
        const redirect = Redirect.create(app);
        redirect.dispatch(
          Redirect.Action.REMOTE,
          decodeURIComponent(redirectUri)
        );
      } else {
        setShowWarning(true);
      }
    }
  }, [app, search, setShowWarning]);

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
    <Loading />
  );
}
