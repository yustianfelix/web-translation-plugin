import { DomScanner } from '../dom/DomScanner.js';

export class TranslationObserver {
  constructor({
    root = document.body,
    scanner = null,
    translateFn = async (text) => text
  } = {}) {
    this.root = root;
    this.scanner = scanner || new DomScanner();
    this.translateFn = translateFn;
    this.observer = new MutationObserver((mutations) => this.onMutations(mutations));
    this.isObserving = false;
  }

  handleNode(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      if (this.scanner.shouldTranslateTextNode(node)) {
        this.scanner.translateNode(node, this.translateFn);
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
        acceptNode: (textNode) => {
          if (this.scanner.shouldTranslateTextNode(textNode)) return NodeFilter.FILTER_ACCEPT;
          return NodeFilter.FILTER_REJECT;
        }
      });

      while (walker.nextNode()) {
        const textNode = walker.currentNode;
        if (textNode && !this.scanner.processedTextNodes.has(textNode)) {
          this.scanner.translateNode(textNode, this.translateFn);
        }
      }

      for (const attrName of ['alt', 'title', 'placeholder', 'aria-label', 'value']) {
        if (!node.hasAttribute(attrName)) continue;
        if (!this.scanner.shouldTranslateAttribute(node, attrName)) continue;

        const value = this.scanner.sanitizeText(node.getAttribute(attrName) || '');
        if (!value) continue;

        this.scanner.translateTextEntry(
          {
            kind: 'attribute',
            element: node,
            attributeName: attrName,
            text: value,
            hash: this.scanner.hashText(value)
          },
          this.translateFn
        ).then((translated) => {
          this.scanner.applyAttributeTranslation(node, attrName, translated);
        }).catch((error) => {
          console.warn('Translation failed for attribute', attrName, error);
        });
      }

      const metadataNodes = node.querySelectorAll ? node.querySelectorAll('meta, svg > title, title') : [];
      for (const metaNode of metadataNodes) {
        if (!(metaNode instanceof Element)) continue;
        const text = metaNode.tagName === 'META' ? metaNode.getAttribute('content') || '' : metaNode.textContent || '';
        const clean = this.scanner.sanitizeText(text);
        if (!clean) continue;

        this.scanner.translateTextEntry(
          {
            kind: 'metadata',
            node: metaNode,
            text: clean,
            hash: this.scanner.hashText(clean)
          },
          this.translateFn
        ).then((translated) => {
          this.scanner.applyMetadataTranslation({ node: metaNode }, translated);
        }).catch((error) => {
          console.warn('Translation failed for metadata node', metaNode, error);
        });
      }
    }
  }

  onMutations(mutations) {
    const changedNodes = new Set();

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node) changedNodes.add(node);
        }
      }

      if (mutation.type === 'attributes') {
        const target = mutation.target;
        if (target && this.scanner.shouldTranslateAttribute(target, mutation.attributeName)) {
          changedNodes.add(target);
        }
      }

      if (mutation.type === 'characterData') {
        const textNode = mutation.target;
        if (this.scanner.shouldTranslateTextNode(textNode)) {
          changedNodes.add(textNode);
        }
      }
    }

    for (const node of changedNodes) {
      this.handleNode(node);
    }
  }

  observe() {
    if (this.isObserving) return;

    this.observer.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: ['alt', 'title', 'placeholder', 'aria-label', 'value']
    });

    this.isObserving = true;
  }

  disconnect() {
    this.observer.disconnect();
    this.isObserving = false;
  }
}
