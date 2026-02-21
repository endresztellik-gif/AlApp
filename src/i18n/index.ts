import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import huCommon from './hu/common.json';

// Nyelvi erőforrások
const resources = {
    hu: {
        common: huCommon,
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: 'hu',
    fallbackLng: 'hu',
    defaultNS: 'common',
    interpolation: {
        escapeValue: false, // React már escapeli a HTML-t
    },
});

export default i18n;
