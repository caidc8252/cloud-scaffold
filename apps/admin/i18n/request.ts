import { createI18nRequestConfig, deepMerge } from "@cloud/i18n/server";
import type { Locale } from "@cloud/i18n";

async function loadMessages(locale: Locale) {
  const [appMsgs, uiMsgs] = await Promise.all([
    import(`./messages/${locale}.json`).then((m) => m.default),
    import(`@cloud/ui/messages/${locale}.json`).then((m) => m.default),
  ]);
  return deepMerge(uiMsgs, appMsgs);
}

export default createI18nRequestConfig({ loadMessages });
