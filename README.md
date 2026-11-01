# web-translation-plugin

Client-side web translation plugin with DOM scanning, lifecycle observers, metadata extraction, translation provider adapters, and image OCR overlay support.

## Features

- Visible DOM text translation
- Hidden content translation for `alt`, `title`, `placeholder`, `aria-label`, `svg title`, and `meta` tags
- MutationObserver-based SPA / dynamic DOM updates
- provider abstraction for Google Translate, DeepL, and Azure AI Translator
- local storage caching for translated strings
- image translation hooks with OCR overlay support and URL replacement
- browser demo page for testing the plugin in real time

## Quick start

```bash
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal.

## Project structure

```text
src/
  api/
    ApiClient.js
    TranslationProvider.js
    providers/
      GoogleTranslateProvider.js
      DeepLProvider.js
      AzureTranslatorProvider.js
  core/
    TranslatorCore.js
  dom/
    DomScanner.js
  media/
    ImageTranslator.js
  observers/
    Observer.js
  styles/
    demo.css
  utils/
    cache.js
  index.js
index.html
```

## Provider configuration

The default adapter selection happens in `src/index.js`. Replace the sample API keys or endpoint configuration in that file before using a real backend.

- Google: `provider: 'google'`
- DeepL: `provider: 'deepl'`
- Azure: `provider: 'azure'`
- Custom: `provider: 'custom'`

## Notes

This project is intentionally dependency-light and browser-focused. The provider adapters are designed for either direct browser requests or server-side endpoints depending on your deployment environment.
