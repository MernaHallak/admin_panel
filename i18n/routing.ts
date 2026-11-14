import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  localeDetection: false, //حتى الباروزر ما ياخد لفتو الحالية ويطغي على ال defaultLocale
});

export type SupportedLocale = (typeof routing.locales)[number];
