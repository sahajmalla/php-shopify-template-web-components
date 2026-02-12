import { useTranslation } from "react-i18next";

export default function PageName() {
  const { t } = useTranslation();
  return (
    <s-page heading={t("PageName.title")}>
      <s-button slot="primary-action" variant="primary" onClick={() => console.log("Primary action")}>
        {t("PageName.primaryAction")}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => console.log("Secondary action")}>
        {t("PageName.secondaryAction")}
      </s-button>
      <s-section>
        <s-heading>{t("PageName.heading")}</s-heading>
        <p>{t("PageName.body")}</p>
      </s-section>
      <s-section>
        <s-heading>{t("PageName.heading")}</s-heading>
        <p>{t("PageName.body")}</p>
      </s-section>
      <s-section>
        <s-heading>{t("PageName.heading")}</s-heading>
        <p>{t("PageName.body")}</p>
      </s-section>
    </s-page>
  );
}
