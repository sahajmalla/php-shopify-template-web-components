import { useTranslation } from "react-i18next";
import { notFoundImage } from "../assets";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <s-page>
      <s-section>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <img src={notFoundImage} alt={t("NotFound.heading")} width={160} />
          <div style={{ marginTop: "12px" }}>
            <s-heading>{t("NotFound.heading")}</s-heading>
          </div>
          <p style={{ marginTop: "8px" }}>{t("NotFound.description")}</p>
        </div>
      </s-section>
    </s-page>
  );
}
