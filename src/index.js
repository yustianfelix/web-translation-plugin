import { TranslatorCore } from './core/TranslatorCore.js';
import { ApiClient } from './api/ApiClient.js';
import { GoogleTranslateProvider } from './api/providers/GoogleTranslateProvider.js';
import { DeepLProvider } from './api/providers/DeepLProvider.js';
import { AzureTranslatorProvider } from './api/providers/AzureTranslatorProvider.js';
import { createLocalStorageCache } from './utils/cache.js';

const cache = createLocalStorageCache('web-translation-plugin');

const apiClient = new ApiClient({
  provider: 'custom',
  endpoint: '/api/translate',
  headers: { Authorization: 'Bearer demo-token' },
  providers: {
    google: new GoogleTranslateProvider({
      apiKey: 'YOUR_GOOGLE_API_KEY',
      endpoint: 'https://translation.googleapis.com/language/translate/v2'
    }),
    deepl: new DeepLProvider({
      apiKey: 'YOUR_DEEPL_API_KEY',
      endpoint: 'https://api-free.deepl.com/v2/translate'
    }),
    azure: new AzureTranslatorProvider({
      apiKey: 'YOUR_AZURE_TRANSLATOR_KEY',
      endpoint: 'https://YOUR_RESOURCE.cognitiveservices.azure.com/translator/text/v3.0/translate',
      region: 'eastus'
    }),
    custom: {
      async translate({ texts, targetLang = 'en' }) {
        const dictionary = {
          en: { "Welcome to our product": "Welcome to our product", "We build fast digital tools that help teams launch new experiences without sacrificing speed or usability.": "We build fast digital tools that help teams launch new experiences without sacrificing speed or usability.", "Get started": "Get started", "Featured article": "Featured article", "A modern workspace designed for shipping ideas quickly.": "A modern workspace designed for shipping ideas quickly.", "Enter your full name": "Enter your full name", "Search docs, tutorials, and guides": "Search docs, tutorials, and guides", "Search the help center": "Search the help center", "Delivery status live": "Delivery status live", "Submit the contact form": "Submit the contact form", "Name": "Name", "Search": "Search", "Submit": "Submit", "Add dynamic content": "Add dynamic content", "Dynamic content": "Dynamic content", "This demo page shows DOM, metadata, and image translation.": "This demo page shows DOM, metadata, and image translation.", "Sample webpage used to test browser translation features and metadata extraction.": "Sample webpage used to test browser translation features and metadata extraction." },
          es: { "Welcome to our product": "Bienvenido a nuestro producto", "We build fast digital tools that help teams launch new experiences without sacrificing speed or usability.": "Creamos herramientas digitales rápidas que ayudan a los equipos a lanzar nuevas experiencias sin sacrificar velocidad ni usabilidad.", "Get started": "Empezar", "Featured article": "Artículo destacado", "A modern workspace designed for shipping ideas quickly.": "Un entorno moderno diseñado para entregar ideas rápidamente.", "Enter your full name": "Ingrese su nombre completo", "Search docs, tutorials, and guides": "Buscar documentación, tutoriales y guías", "Search the help center": "Buscar en el centro de ayuda", "Delivery status live": "Estado de entrega en vivo", "Submit the contact form": "Enviar formulario de contacto", "Name": "Nombre", "Search": "Buscar", "Submit": "Enviar", "Add dynamic content": "Agregar contenido dinámico", "Dynamic content": "Contenido dinámico", "This demo page shows DOM, metadata, and image translation.": "Esta página de demostración muestra la traducción del DOM, metadatos e imágenes.", "Sample webpage used to test browser translation features and metadata extraction.": "Página de ejemplo utilizada para probar funciones de traducción del navegador y extracción de metadatos." },
          fr: { "Welcome to our product": "Bienvenue dans notre produit", "We build fast digital tools that help teams launch new experiences without sacrificing speed or usability.": "Nous créons des outils numériques rapides qui aident les équipes à lancer de nouvelles expériences sans sacrifier la vitesse ni la convivialité.", "Get started": "Commencer", "Featured article": "Article en vedette", "A modern workspace designed for shipping ideas quickly.": "Un espace de travail moderne conçu pour livrer des idées rapidement.", "Enter your full name": "Saisissez votre nom complet", "Search docs, tutorials, and guides": "Rechercher des documents, tutoriels et guides", "Search the help center": "Rechercher dans le centre d’aide", "Delivery status live": "Statut de livraison en direct", "Submit the contact form": "Soumettre le formulaire de contact", "Name": "Nom", "Search": "Recherche", "Submit": "Soumettre", "Add dynamic content": "Ajouter du contenu dynamique", "Dynamic content": "Contenu dynamique", "This demo page shows DOM, metadata, and image translation.": "Cette page de démonstration montre la traduction du DOM, des métadonnées et des images.", "Sample webpage used to test browser translation features and metadata extraction.": "Page d’exemple utilisée pour tester les fonctionnalités de traduction du navigateur et l’extraction de métadonnées." },
          de: { "Welcome to our product": "Willkommen bei unserem Produkt", "We build fast digital tools that help teams launch new experiences without sacrificing speed or usability.": "Wir entwickeln schnelle digitale Tools, die Teams dabei helfen, neue Erfahrungen zu lancieren, ohne Geschwindigkeit oder Benutzerfreundlichkeit zu opfern.", "Get started": "Loslegen", "Featured article": "Vorgestellter Artikel", "A modern workspace designed for shipping ideas quickly.": "Ein moderner Arbeitsbereich, der für schnelles Ideenmanagement entwickelt wurde.", "Enter your full name": "Geben Sie Ihren vollständigen Namen ein", "Search docs, tutorials, and guides": "Dokumentation, Tutorials und Anleitungen durchsuchen", "Search the help center": "Hilfecenter durchsuchen", "Delivery status live": "Lieferstatus live", "Submit the contact form": "Kontaktformular senden", "Name": "Name", "Search": "Suchen", "Submit": "Senden", "Add dynamic content": "Dynamischen Inhalt hinzufügen", "Dynamic content": "Dynamischer Inhalt", "This demo page shows DOM, metadata, and image translation.": "Diese Demo-Seite zeigt DOM-, Metadaten- und Bildübersetzungen.", "Sample webpage used to test browser translation features and metadata extraction.": "Beispielseite zum Testen von Browser-Übersetzungsfunktionen und Metadatenextraktion." },
          ja: { "Welcome to our product": "製品へようこそ", "We build fast digital tools that help teams launch new experiences without sacrificing speed or usability.": "私たちは、速度と使いやすさを犠牲にすることなく、新しい体験を迅速に提供できる高速なデジタルツールを構築しています。", "Get started": "始める", "Featured article": "特集記事", "A modern workspace designed for shipping ideas quickly.": "アイデアを迅速に実行できるよう設計されたモダンなワークスペース。", "Enter your full name": "氏名を入力してください", "Search docs, tutorials, and guides": "ドキュメント、チュートリアル、ガイドを検索", "Search the help center": "ヘルプセンターを検索", "Delivery status live": "配達状況ライブ", "Submit the contact form": "お問い合わせフォームを送信", "Name": "名前", "Search": "検索", "Submit": "送信", "Add dynamic content": "動的コンテンツを追加", "Dynamic content": "動的コンテンツ", "This demo page shows DOM, metadata, and image translation.": "このデモページでは、DOM、メタデータ、画像の翻訳を表示します。", "Sample webpage used to test browser translation features and metadata extraction.": "ブラウザ翻訳機能とメタデータ抽出をテストするためのサンプルページです。" }
        };

        const result = [];
        const values = Array.isArray(texts) ? texts : [texts];
        const localeMap = dictionary[targetLang] || dictionary.en || {};

        for (const text of values) {
          result.push(localeMap[text] || text);
        }

        return result;
      }
    }
  }
});

const translator = new TranslatorCore({
  sourceLang: 'auto',
  targetLang: 'en',
  apiClient,
  cache,
  root: document.body
});

const languageSelect = document.getElementById('language-select');
const toggleButton = document.getElementById('toggle-translation');
const dynamicContainer = document.getElementById('dynamic-container');
const addDynamicContentButton = document.getElementById('add-content');

async function runTranslation() {
  const selectedLang = languageSelect.value || 'en';
  await translator.toggleLanguage(selectedLang);
  toggleButton.textContent = `Translated to ${selectedLang.toUpperCase()}`;
}

languageSelect.addEventListener('change', runTranslation);
toggleButton.addEventListener('click', runTranslation);

addDynamicContentButton.addEventListener('click', () => {
  const block = document.createElement('div');
  block.className = 'dynamic-item';
  block.textContent = 'New marketplace update available';
  block.setAttribute('title', 'Fresh product updates');
  block.setAttribute('aria-label', 'Fresh product updates in the marketplace');
  dynamicContainer.appendChild(block);
});

window.__translationPlugin = translator;
window.__demoTranslate = runTranslation;

translator.translateDocument().then(() => {
  translator.startObserving();
  console.log('Translation plugin initialized');
});
