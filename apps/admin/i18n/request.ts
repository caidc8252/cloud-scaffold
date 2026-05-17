import { createI18nRequestConfig, deepMerge } from "@cloud/i18n/server";
import type { Locale } from "@cloud/i18n";

async function loadMessages(locale: Locale) {
  const [appMsgs, uiMsgs, requestMsgs] = await Promise.all([
    import(`./messages/${locale}.json`).then((m) => m.default),
    import(`@cloud/ui/messages/${locale}.json`).then((m) => m.default),
    import(`@cloud/request/messages/${locale}.json`).then((m) => m.default),
  ]);
  // 同 key 时优先级：app > ui > request（框架兜底）
  return deepMerge(deepMerge(requestMsgs, uiMsgs), appMsgs);
}

export default createI18nRequestConfig({ loadMessages });
