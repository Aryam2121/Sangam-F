import { createContext, useContext, useMemo, useState } from "react";

const translations = {
  en: {
    dashboard: "Dashboard",
    notifications: "Notifications",
    markAllRead: "Mark all read",
    cityKpis: "City KPIs",
    workflow: "Inter-Department Workflow",
    budget: "Budget & Resources",
    audit: "Audit Trail",
    announcements: "City Announcements",
    cityMap: "City Map Hub",
    integrations: "Integrations",
    language: "Language",
    export: "Export",
    filter: "Filter",
    zone: "Zone",
    ward: "Ward",
    district: "District",
    department: "Department",
    submit: "Submit",
    approve: "Approve",
    reject: "Reject",
    loading: "Loading…",
    noData: "No data available",
    welcome: "Welcome back",
    signOut: "Sign out",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    notifications: "सूचनाएँ",
    markAllRead: "सभी पढ़ा हुआ",
    cityKpis: "शहर KPI",
    workflow: "अंतर-विभागीय कार्यप्रवाह",
    budget: "बजट और संसाधन",
    audit: "लेखा परीक्षा",
    announcements: "शहर घोषणाएँ",
    cityMap: "शहर मानचitra",
    integrations: "एकीकरण",
    language: "भाषा",
    export: "निर्यात",
    filter: "फ़िल्टर",
    zone: "क्षेत्र",
    ward: "वार्ड",
    district: "ज़िला",
    department: "विभाग",
    submit: "जमा करें",
    approve: "स्वीकृत",
    reject: "अस्वीकार",
    loading: "लोड हो रहा है…",
    noData: "कोई डेटा नहीं",
    welcome: "वापसी पर स्वागत",
    signOut: "साइन आउट",
  },
};

const I18nContext = createContext({ lang: "en", t: (k) => k, setLang: () => {} });

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem("sangam-lang") || "en");

  const setLang = (next) => {
    setLangState(next);
    localStorage.setItem("sangam-lang", next);
  };

  const t = useMemo(() => {
    const dict = translations[lang] || translations.en;
    return (key) => dict[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
