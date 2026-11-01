export class GoogleTranslateProvider extends TranslationProvider {
  constructor({
    apiKey,
    endpoint = 'https://translation.googleapis.com/language/translate/v2',
    fetchImpl = fetch,
    headers = {}
  } = {}) {
    super({ apiKey, endpoint, fetchImpl, headers });
  }

  async translate({ texts, sourceLang = 'auto', targetLang = 'en' }) {
    if (!this.apiKey) {
      throw new Error('Google Translate API key is required');
    }

    const url = new URL(this.endpoint);
    url.searchParams.set('key', this.apiKey);

    const body = {
      q: Array.isArray(texts) ? texts : [texts],
      target: targetLang,
      source: sourceLang === 'auto' ? undefined : sourceLang,
      format: 'text'
    };

    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Google Translate request failed: ${response.status}`);
    }

    const json = await response.json();
    return (json?.data?.translations || []).map((item) => item.translatedText || '');
  }
}
