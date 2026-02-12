import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProductsCard() {
  const [isLoading, setIsLoading] = useState(true);
  const fetch = useAuthenticatedFetch();
  const { t } = useTranslation();
  const productsCount = 5;

  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });

  const showToast = (message, options = {}) => {
    const shopifyGlobal = window["shopify"];
    if (shopifyGlobal?.toast?.show && !isRefetchingCount) {
      shopifyGlobal.toast.show(message, options);
    }
  };

  const handlePopulate = async () => {
    setIsLoading(true);
    const response = await fetch("/api/products", {method: "POST"});

    if (response.ok) {
      await refetchProductCount();
      showToast(
        t("ProductsCard.productsCreatedToast", {
          count: productsCount,
        }),
      );
    } else {
      setIsLoading(false);
      showToast(t("ProductsCard.errorCreatingProductsToast"), { isError: true });
    }
  };

  return (
    <>
      <s-section heading={t("ProductsCard.title")}>
        <p>{t("ProductsCard.description")}</p>
        <div style={{ marginTop: "12px" }}>
          <s-heading>{t("ProductsCard.totalProductsHeading")}</s-heading>
          <p style={{ fontWeight: 600, marginTop: "6px" }}>
            {isLoadingCount ? "-" : data.count}
          </p>
        </div>
        <div style={{ marginTop: "16px" }}>
          <s-button loading={isLoading} variant="primary" onClick={handlePopulate}>
            {t("ProductsCard.populateProductsButton", {
              count: productsCount,
            })}
          </s-button>
        </div>
      </s-section>
    </>
  );
}
