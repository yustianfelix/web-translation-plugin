import { TranslationProvider } from '../TranslationProvider.js';

export class DeepLProvider extends TranslationProvider {
  constructor({
    apiKey,
    endpoint = 'https://api-free.deepl.com/v2/translate',
    fetchImpl = fetch,
    headers = {}
  } = {}) {
    super({ apiKey, endpoint, fetchImpl, headers });
  }

  async translate({ texts, sourceLang = 'auto', targetLang = 'en' }) {
    if (!this.apiKey) {
      throw new Error('DeepL API key is required');
    }

    const payload = new URLSearchParams();
    const textList = Array.isArray(texts) ? texts : [texts];
    for (const text of textList) {
      payload.append('text', text);
    }
    if (sourceLang !== 'auto') payload.set('source_lang', sourceLang.toUpperCase());
    payload.set('target_lang', targetLang.toUpperCase());

    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...this.headers
      },
      body: payload.toString()
    });

    if (!response.ok) {
      throw new Error(`DeepL request failed: ${response.status}`);
    }

    const json = await response.json();
    return (json?.translations || []).map((item) => item.text || '');
  }
}
