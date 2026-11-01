const TRANSLATABLE_ATTRIBUTES = new Set([
  'alt',
  'title',
  'placeholder',
  'aria-label',
  'value',
  'data-original-text',
  'data-translation-label'
]);

export class DomScanner {
  constructor({
    sourceLang = 'auto',
    targetLang = 'en',
    cache = null,
    apiClient = null,
    ignoreSelector = '[data-translation-ignore="true"]'
  } = {}) {
    this.sourceLang = sourceLang;
    this.targetLang = targetLang;
    this.cache = cache;
    this.apiClient = apiClient;
    this.ignoreSelector = ignoreSelector;

    this.processedTextNodes = new WeakSet();
    this.processedElements = new WeakSet();
    this.processedMetadata = new WeakSet();
  }

  shouldIgnoreNode(node) {
    if (!node) return true;

    const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!el) return false;

    if (el.matches?.(this.ignoreSelector)) return true;
    if (el.closest?.(this.ignoreSelector)) return true;
    if (el.closest?.('[aria-hidden="true"]')) return true;
    if (el.closest?.('[hidden]')) return true;

    return false;
  }

  isVisibleElement(el) {
    if (!el || !(el instanceof Element)) return false;
    if (this.shouldIgnoreNode(el)) return false;

    let current = el;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return false;
      }
      current = current.parentElement;
    }

    return true;
  }

  shouldTranslateTextNode(node) {
    if (!(node instanceof Text)) return false;
    const text = node.textContent || '';
    if (!text.trim()) return false;
    if (this.shouldIgnoreNode(node)) return false;

    const parent = node.parentElement;
    return parent ? this.isVisibleElement(parent) : false;
  }

  shouldTranslateAttribute(element, attributeName) {
    if (!(element instanceof Element)) return false;
    if (this.shouldIgnoreNode(element)) return false;
    if (!TRANSLATABLE_ATTRIBUTES.has(attributeName)) return false;
    if (!this.isVisibleElement(element)) return false;
    return true;
  }

  sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  hashText(value) {
    let hash = 2166136261;
    const str = String(value ?? '');
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(hash ^ str.charCodeAt(i), 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  collectTextEntries(root = document.body) {
    const entries = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!this.shouldTranslateTextNode(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (this.processedTextNodes.has(node)) continue;

      const text = this.sanitizeText(node.textContent || '');
      if (!text) continue;

      entries.push({
        kind: 'text',
        node,
        text,
        hash: this.hashText(text)
      });

      this.processedTextNodes.add(node);
    }

    return entries;
  }

  collectAttributeEntries(root = document.body) {
    const entries = [];
    const candidates = [root, ...Array.from(root.querySelectorAll('*'))];

    for (const el of candidates) {
      if (!(el instanceof Element)) continue;
      if (this.processedElements.has(el)) continue;

      for (const attributeName of TRANSLATABLE_ATTRIBUTES) {
        if (!el.hasAttribute(attributeName)) continue;
        if (!this.shouldTranslateAttribute(el, attributeName)) continue;

        const value = this.sanitizeText(el.getAttribute(attributeName) || '');
        if (!value) continue;

        entries.push({
          kind: 'attribute',
          element: el,
          attributeName,
          text: value,
          hash: this.hashText(value)
        });
      }

      this.processedElements.add(el);
    }

    return entries;
  }

  collectMetadataEntries(root = document.head) {
    const entries = [];
    const selectors = [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'svg > title',
      'title'
    ];

    for (const selector of selectors) {
      const nodes = root.querySelectorAll(selector);
      for (const node of nodes) {
        if (this.processedMetadata.has(node)) continue;

        let text = '';
        if (node.tagName === 'META') {
          text = node.getAttribute('content') || '';
        } else {
          text = node.textContent || '';
        }

        text = this.sanitizeText(text);
        if (!text) continue;

        entries.push({
          kind: 'metadata',
          node,
          text,
          hash: this.hashText(text),
          attributeName: node.tagName === 'META' ? 'content' : null
        });

        this.processedMetadata.add(node);
      }
    }

    return entries;
  }

  collectEntries(root = document.body) {
    return [
      ...this.collectTextEntries(root),
      ...this.collectAttributeEntries(root),
      ...this.collectMetadataEntries(document.head)
    ];
  }

  async translateTextEntry(entry, translateFn) {
    const cacheKey = `${this.sourceLang}:${this.targetLang}:${entry.hash}`;
    const cached = this.cache ? await this.cache.get(cacheKey) : null;

    if (cached && typeof cached === 'string') return cached;

    const translated = await translateFn(entry.text);

    if (this.cache) {
      await this.cache.set(cacheKey, translated);
    }

    return translated;
  }

  applyTextTranslation(node, translatedText) {
    if (!(node instanceof Text)) return;
    if (!translatedText) return;
    node.textContent = translatedText;
  }

  applyAttributeTranslation(element, attributeName, translatedText) {
    if (!(element instanceof Element)) return;
    if (!translatedText) return;

    if (attributeName === 'value' && 'value' in element) {
      element.value = translatedText;
      return;
    }

    element.setAttribute(attributeName, translatedText);
  }

  applyMetadataTranslation(entry, translatedText) {
    if (!entry || !translatedText) return;
    const { node } = entry;

    if (node.tagName === 'META') {
      node.setAttribute('content', translatedText);
      return;
    }

    if (node instanceof SVGElement || node.tagName === 'TITLE') {
      node.textContent = translatedText;
    }
  }

  async translateRoot(root = document.body, translateFn) {
    const entries = this.collectEntries(root);

    for (const entry of entries) {
      if (entry.kind === 'text') {
        const translated = await this.translateTextEntry(entry, translateFn);
        this.applyTextTranslation(entry.node, translated);
      }

      if (entry.kind === 'attribute') {
        const translated = await this.translateTextEntry(entry, translateFn);
        this.applyAttributeTranslation(entry.element, entry.attributeName, translated);
      }

      if (entry.kind === 'metadata') {
        const translated = await this.translateTextEntry(entry, translateFn);
        this.applyMetadataTranslation(entry, translated);
      }
    }

    return entries;
  }

  async translateNode(node, translateFn) {
    if (!node) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = this.sanitizeText(node.textContent || '');
      if (!text) return null;

      const entry = { node, kind: 'text', text, hash: this.hashText(text) };
      const translated = await this.translateTextEntry(entry, translateFn);
      this.applyTextTranslation(node, translated);
      return translated;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node;
      const attrs = [...TRANSLATABLE_ATTRIBUTES].filter((name) => {
        return element.hasAttribute(name) && this.shouldTranslateAttribute(element, name);
      });

      for (const attrName of attrs) {
        const value = this.sanitizeText(element.getAttribute(attrName) || '');
        if (!value) continue;

        const entry = {
          kind: 'attribute',
          element,
          attributeName: attrName,
          text: value,
          hash: this.hashText(value)
        };

        const translated = await this.translateTextEntry(entry, translateFn);
        this.applyAttributeTranslation(element, attrName, translated);
      }
    }

    return null;
  }
}
