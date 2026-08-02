import { useEffect } from 'react';
import i18n from '../../i18n';
import { useLandingConfig } from './api';

export default function SiteMetaSync() {
  const { data } = useLandingConfig();

  useEffect(() => {
    if (!data) return;
    document.title = data.lodge || 'Logenhelfer';

    const language = data.language || 'de';
    document.documentElement.lang = language;
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }

    if (data.logo_version) {
      let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = `/api/v1/public/logo?v=${data.logo_version}`;
    }
  }, [data]);

  return null;
}
