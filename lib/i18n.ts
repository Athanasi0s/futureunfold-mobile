import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import el from "@/locales/el.json";

const resources = {
  en: { translation: en },
  el: { translation: el },
};

const deviceLocale =
  Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0] ?? "en";
const supportedLocale = deviceLocale in resources ? deviceLocale : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: supportedLocale,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
