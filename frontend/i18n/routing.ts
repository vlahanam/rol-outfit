import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vn", "jp"],
  defaultLocale: "vn",
  localePrefix: "as-needed",
});
