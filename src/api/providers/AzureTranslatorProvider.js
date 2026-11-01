import { TranslationProvider } from '../TranslationProvider.js';

export class AzureTranslatorProvider extends TranslationProvider {
  constructor({
    apiKey,
    endpoint,
    region,
    fetchImpl = fetch,
    headers = {}
  } = {}) {
    super({ apiKey, endpoint, fetchImpl, headers });
    this.region = region;
  }

  async translate({ texts, sourceLang = 'auto', targetLang = 'en' }) {
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Azure Translator endpoint and API key are required');
    }

    const url = new URL(this.endpoint);
    url.searchParams.set('api-version', '3.0');
    url.searchParams.set('to', targetLang);
    if (sourceLang !== 'auto') {
      url.searchParams.set('from', sourceLang);
    }

    const payload = (Array.isArray(texts) ? texts : [texts]).map((text) => ({ Text: text }));

    const response = await this.fetchImpl(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Ocp-Apim-Subscription-Key': this.apiKey,
        ...(this.region ? { 'Ocp-Apim-Subscription-Region': this.region } : {}),
        ...this.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Azure Translator request failed: ${response.status}`);
    }

    const json = await response.json();
    return (json || []).flatMap((item) => (item.translations || []).map((translation) => translation.text || ''));
  }
}
