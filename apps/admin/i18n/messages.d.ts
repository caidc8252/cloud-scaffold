import type { locales } from "@cloud/i18n";
import type { I18nFormats } from "@cloud/i18n";
import type appMessages from "./messages/en.json";
import type uiMessages from "@cloud/ui/messages/en.json";

type MergedMessages = typeof uiMessages & typeof appMessages;

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: MergedMessages;
    Formats: I18nFormats;
  }
}
