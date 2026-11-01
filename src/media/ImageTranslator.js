export class ImageTranslator {
  constructor({
    targetLang = 'en',
    imageApi = null,
    overlayCssClass = 'translation-overlay'
  } = {}) {
    this.targetLang = targetLang;
    this.imageApi = imageApi;
    this.overlayCssClass = overlayCssClass;
  }

  findImages(root = document) {
    const images = [];
    const selector = 'img, picture, svg, [data-image-translate="true"], [style*="background-image"]';
    const nodes = root.querySelectorAll ? root.querySelectorAll(selector) : [];
    for (const node of nodes) {
      images.push(node);
    }
    return images;
  }

  getImageSource(element) {
    if (element instanceof HTMLImageElement) {
      return element.currentSrc || element.src || null;
    }

    if (element instanceof SVGElement) {
      return element.dataset.translatedSrc || null;
    }

    const style = window.getComputedStyle(element);
    const match = style.backgroundImage.match(/url\((['"]?)(.*?)\1\)/i);
    return match ? match[2] : null;
  }

  async translateImage(element, text) {
    if (!this.imageApi) {
      return null;
    }

    const source = this.getImageSource(element);
    if (!source) return null;

    const result = await this.imageApi.translateImage({
      source,
      text,
      targetLang: this.targetLang
    });

    if (result?.translatedUrl) {
      if (element instanceof HTMLImageElement) {
        element.src = result.translatedUrl;
      } else if (element instanceof SVGElement) {
        element.dataset.translatedSrc = result.translatedUrl;
      }
    }

    return result;
  }

  createBoundingBoxes(element, text) {
    const rect = element.getBoundingClientRect();
    const width = Math.max(rect.width || 200, 100);
    const height = Math.max(rect.height || 80, 60);

    return [{
      x: 0,
      y: 0,
      width,
      height,
      text: text || element.getAttribute('alt') || element.getAttribute('aria-label') || 'Translated text'
    }];
  }

  applyOverlay(element, text) {
    const rect = element.getBoundingClientRect();
    const wrapper = document.createElement('div');
    wrapper.className = this.overlayCssClass;
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = `${Math.max(rect.width, 100)}px`;
    wrapper.style.height = `${Math.max(rect.height, 60)}px`;

    const overlay = document.createElement('div');
    overlay.className = `${this.overlayCssClass}__text`;
    overlay.textContent = text;
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '8px';
    overlay.style.background = 'rgba(10, 15, 25, 0.16)';
    overlay.style.color = '#fff';
    overlay.style.fontWeight = '700';
    overlay.style.textShadow = '0 1px 2px rgba(0,0,0,0.50)';
    overlay.style.pointerEvents = 'none';
    overlay.style.whiteSpace = 'pre-wrap';
    overlay.style.textAlign = 'center';

    wrapper.appendChild(overlay);

    if (element.parentElement) {
      element.parentElement.insertBefore(wrapper, element.nextSibling);
    }

    return wrapper;
  }

  async detectAndTranslateImages(root = document) {
    const images = this.findImages(root);

    for (const image of images) {
      const text = image.getAttribute('alt') || image.getAttribute('aria-label') || image.getAttribute('title') || 'Translated image';
      const boxes = this.createBoundingBoxes(image, text);
      if (boxes.length) {
        this.applyOverlay(image, boxes[0].text);
      }

      if (this.imageApi && typeof this.imageApi.translateImage === 'function') {
        await this.translateImage(image, text);
      }
    }
  }
}
