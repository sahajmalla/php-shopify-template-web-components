import { useTranslation, Trans } from "react-i18next";

import { trophyImage } from "../assets";

import { ProductsCard } from "../components";

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <s-page heading={t("HomePage.title")}>
      <s-section>
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 320px" }}>
            <s-heading>{t("HomePage.heading")}</s-heading>
            <div style={{ marginTop: "12px" }}>
              <p>
                <Trans
                  i18nKey="HomePage.yourAppIsReadyToExplore"
                  components={{
                    PolarisLink: (
                      <a
                        href="https://polaris.shopify.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    AdminApiLink: (
                      <a
                        href="https://shopify.dev/api/admin-graphql"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    AppBridgeLink: (
                      <a
                        href="https://shopify.dev/apps/tools/app-bridge"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                  }}
                />
              </p>
              <p>{t("HomePage.startPopulatingYourApp")}</p>
              <p>
                <Trans
                  i18nKey="HomePage.learnMore"
                  components={{
                    ShopifyTutorialLink: (
                      <a
                        href="https://shopify.dev/apps/getting-started/add-functionality"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                  }}
                />
              </p>
            </div>
          </div>
          <div style={{ padding: "0 20px" }}>
            <img src={trophyImage} alt={t("HomePage.trophyAltText")} width={120} />
          </div>
        </div>
      </s-section>
      <ProductsCard />
    </s-page>
  );
}
