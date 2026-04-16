(function () {
  function isVisible(element) {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number.parseFloat(style.opacity || '1') === 0
    ) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function rgbToHex(value) {
    const match = String(value || '').match(/\d+/g);
    if (!match || match.length < 3) {
      return '';
    }
    const [r, g, b] = match.slice(0, 3).map((item) => Number.parseInt(item, 10));
    return `#${[r, g, b]
      .map((item) => item.toString(16).padStart(2, '0'))
      .join('')}`.toLowerCase();
  }

  function collectUnique(selector, mapper, limit) {
    const values = [];
    const seen = new Set();

    for (const element of document.querySelectorAll(selector)) {
      if (!isVisible(element)) {
        continue;
      }

      const mapped = mapper(element);
      if (!mapped) {
        continue;
      }

      const key = JSON.stringify(mapped);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      values.push(mapped);

      if (values.length >= limit) {
        break;
      }
    }

    return values;
  }

  function collectPageSnapshot() {
    const headings = collectUnique(
      'h1, h2, h3, h4, h5, h6',
      (element) => {
        const text = normalizeText(element.textContent);
        if (!text) {
          return null;
        }
        return {
          level: Number.parseInt(element.tagName.slice(1), 10),
          text,
        };
      },
      12,
    );

    const textBlocks = collectUnique(
      'main p, article p, section p, li',
      (element) => {
        const text = normalizeText(element.textContent);
        if (text.length < 30) {
          return null;
        }
        return text.slice(0, 240);
      },
      20,
    );

    const buttons = collectUnique(
      'button, [role="button"], a',
      (element) => {
        const text = normalizeText(element.textContent);
        if (!text || text.length > 50) {
          return null;
        }
        const isPrimary = /(primary|cta|submit|start|trial|buy|signup|register|开始|立即|试用|购买)/i.test(
          `${element.className} ${text}`,
        );
        return {
          text,
          variant: isPrimary ? 'primary' : 'secondary',
        };
      },
      12,
    );

    const links = collectUnique(
      'a[href]',
      (element) => {
        const text = normalizeText(element.textContent);
        if (!text || text.length > 40) {
          return null;
        }
        return { text };
      },
      16,
    );

    const forms = collectUnique(
      'form',
      (element) => ({
        type: element.getAttribute('id') || element.getAttribute('name') || 'form',
      }),
      6,
    );

    const images = collectUnique(
      'img',
      (element) => ({
        alt: normalizeText(element.getAttribute('alt') || ''),
      }),
      8,
    );

    const colorSamples = collectUnique(
      'body, main, header, section, article, button, a, div',
      (element) => {
        const style = window.getComputedStyle(element);
        const color = rgbToHex(style.color);
        const background = rgbToHex(style.backgroundColor);
        return [color, background].find(Boolean) || null;
      },
      12,
    );

    const fontSamples = collectUnique(
      'body, h1, h2, h3, p, button',
      (element) => {
        const family = window.getComputedStyle(element).fontFamily.split(',')[0].replace(/["']/g, '');
        return normalizeText(family);
      },
      8,
    );

    const radii = collectUnique(
      'button, input, textarea, select, img, .card, .panel, .pricing-card, [class*="card"]',
      (element) => window.getComputedStyle(element).borderRadius,
      8,
    );

    const shadows = collectUnique(
      'button, .card, .panel, .pricing-card, [class*="card"], [class*="shadow"]',
      (element) => {
        const value = window.getComputedStyle(element).boxShadow;
        return value && value !== 'none' ? value : null;
      },
      8,
    );

    const landmarks = {
      nav: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main').length,
      footer: document.querySelectorAll('footer').length,
      section: document.querySelectorAll('section').length,
    };

    const cardSelectors = ['.card', '.panel', '.pricing-card', '[class*="card"]', 'article'];
    const cardNodes = new Set();
    for (const selector of cardSelectors) {
      for (const node of document.querySelectorAll(selector)) {
        if (isVisible(node)) {
          cardNodes.add(node);
        }
      }
    }

    return {
      url: window.location.href,
      title: document.title,
      lang: document.documentElement.lang || '',
      metaDescription:
        document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      headings,
      textBlocks,
      colors: colorSamples,
      fonts: fontSamples,
      radii,
      shadows,
      buttons,
      links,
      forms,
      images,
      landmarks,
      cards: cardNodes.size,
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'COLLECT_PAGE_SNAPSHOT') {
      sendResponse(collectPageSnapshot());
    }
  });
})();
