export class TranslationProvider {
  constructor({
    apiKey = '',
    endpoint = '',
    fetchImpl = fetch,
    headers = {},
    sourceLang = 'auto'
  } = {}) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers
    };
    this.sourceLang = sourceLang;
  }

  getProviderName() {
    return this.constructor.name;
  }

  async translate({ texts, sourceLang = this.sourceLang, targetLang = 'en' }) {
    throw new Error('TranslationProvider.translate() must be implemented by the provider');
  }
}
