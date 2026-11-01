export class ApiClient {
  constructor({
    provider = 'custom',
    apiKey = '',
    endpoint = '/api/translate',
    region = '',
    headers = {},
    fetchImpl = fetch,
    providers = {}
  } = {}) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.region = region;
    this.headers = headers;
    this.fetchImpl = fetchImpl;
    this.providers = {
      google: providers.google || null,
      deepl: providers.deepl || null,
      azure: providers.azure || null,
      custom: providers.custom || null
    };
  }

  getProviderInstance() {
    const key = this.provider.toLowerCase();

    if (key === 'google' && this.providers.google) {
      return this.providers.google;
    }
    if (key === 'deepl' && this.providers.deepl) {
      return this.providers.deepl;
    }
    if (key === 'azure' && this.providers.azure) {
      return this.providers.azure;
    }
    if (key === 'custom' && this.providers.custom) {
      return this.providers.custom;
    }

    return null;
  }

  async translate({ texts, sourceLang = 'auto', targetLang = 'en' }) {
    const providerInstance = this.getProviderInstance();

    if (providerInstance) {
      return providerInstance.translate({ texts, sourceLang, targetLang });
    }

    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      body: JSON.stringify({
        provider: this.provider,
        sourceLang,
        targetLang,
        texts: Array.isArray(texts) ? texts : [texts],
        apiKey: this.apiKey
      })
    });

    if (!response.ok) {
      throw new Error(`Custom translation endpoint failed: ${response.status}`);
    }

    const json = await response.json();
    if (Array.isArray(json.translations)) {
      return json.translations;
    }
    if (Array.isArray(json.data?.translations)) {
      return json.data.translations;
    }

    return (Array.isArray(texts) ? texts : [texts]).map((text) => text);
  }
}
