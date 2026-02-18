import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType !== "POP") {
      // Reset window scroll
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // Also reset any scrollable inner containers (e.g. the app main area)
      document.querySelectorAll("main, [data-scroll-container]").forEach((el) => {
        el.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
    }
  }, [pathname, navType]);

  return null;
}

