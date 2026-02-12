import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

export default function PageName() {
  const { t } = useTranslation();
  return (
    <s-page>
      <TitleBar
        title={t("PageName.title")}
        primaryAction={{
          content: t("PageName.primaryAction"),
          onAction: () => console.log("Primary action"),
        }}
        secondaryActions={[
          {
            content: t("PageName.secondaryAction"),
            onAction: () => console.log("Secondary action"),
          },
        ]}
      />
      <s-section>
        <s-heading>{t("PageName.heading")}</s-heading>
        <p>{t("PageName.body")}</p>
      </s-section>
      <s-section>
        <s-heading>{t("PageName.heading")}</s-heading>
        <p>{t("PageName.body")}</p>
      </s-section>
      <s-section variant="secondary">
        <s-heading>{t("PageName.heading")}</s-heading>
        <p>{t("PageName.body")}</p>
      </s-section>
    </s-page>
  );
}
