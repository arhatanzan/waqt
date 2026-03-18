// ============================================
// DOM UTILITIES & HELPERS (js/dom-utils.js)
// ============================================

/**
 * DOM utility functions to reduce code duplication
 * and provide consistent element access patterns
 */

const DOMUtils = {
  /**
   * Get element by ID from CONFIG.DOM mapping
   * @param {string} key - Key from CONFIG.DOM object
   * @returns {HTMLElement|null}
   */
  getElement(key) {
    if (typeof CONFIG === 'undefined') {
      console.error('CONFIG not loaded. Ensure config.js is loaded first.');
      return null;
    }
    const elementId = CONFIG.DOM[key];
    if (!elementId) {
      console.warn(`Element key '${key}' not found in CONFIG.DOM`);
      return null;
    }
    return document.getElementById(elementId);
  },

  /**
   * Toggle a class on an element
   * @param {string} key - CONFIG.DOM key
   * @param {string} className - CSS class name or CONFIG.CLASSES key
   */
  toggleClass(key, className) {
    const element = this.getElement(key);
    if (!element) return;
    
    const cssClass = CONFIG.CLASSES[className] || className;
    element.classList.toggle(cssClass);
  },

  /**
   * Add a class to an element
   * @param {string} key - CONFIG.DOM key
   * @param {string} className - CSS class name
   */
  addClass(key, className) {
    const element = this.getElement(key);
    if (!element) return;
    element.classList.add(className);
  },

  /**
   * Remove a class from an element
   * @param {string} key - CONFIG.DOM key
   * @param {string} className - CSS class name
   */
  removeClass(key, className) {
    const element = this.getElement(key);
    if (!element) return;
    element.classList.remove(className);
  },

  /**
   * Set element's innerHTML
   * @param {string} key - CONFIG.DOM key
   * @param {string} html - HTML content
   */
  setHTML(key, html) {
    const element = this.getElement(key);
    if (!element) return;
    element.innerHTML = html;
  },

  /**
   * Get element's innerHTML
   * @param {string} key - CONFIG.DOM key
   * @returns {string}
   */
  getHTML(key) {
    const element = this.getElement(key);
    return element ? element.innerHTML : '';
  },

  /**
   * Set element's innerText
   * @param {string} key - CONFIG.DOM key
   * @param {string} text - Text content
   */
  setText(key, text) {
    const element = this.getElement(key);
    if (!element) return;
    element.innerText = text;
  },

  /**
   * Get element's innerText
   * @param {string} key - CONFIG.DOM key
   * @returns {string}
   */
  getText(key) {
    const element = this.getElement(key);
    return element ? element.innerText : '';
  },

  /**
   * Set element's attributes
   * @param {string} key - CONFIG.DOM key
   * @param {Object} attributes - Object with attribute names and values
   */
  setAttributes(key, attributes) {
    const element = this.getElement(key);
    if (!element) return;
    Object.entries(attributes).forEach(([attr, value]) => {
      element.setAttribute(attr, value);
    });
  },

  /**
   * Get element's attribute value
   * @param {string} key - CONFIG.DOM key
   * @param {string} attr - Attribute name
   * @returns {string|null}
   */
  getAttribute(key, attr) {
    const element = this.getElement(key);
    return element ? element.getAttribute(attr) : null;
  },

  /**
   * Set inline style properties
   * @param {string} key - CONFIG.DOM key
   * @param {Object} styles - Object with style properties
   */
  setStyles(key, styles) {
    const element = this.getElement(key);
    if (!element) return;
    Object.assign(element.style, styles);
  },

  /**
   * Set element visibility
   * @param {string} key - CONFIG.DOM key
   * @param {boolean} isVisible - Show or hide
   */
  setVisible(key, isVisible) {
    const element = this.getElement(key);
    if (!element) return;
    element.style.display = isVisible ? '' : 'none';
  },

  /**
   * Add event listener with error handling
   * @param {string} key - CONFIG.DOM key
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(key, event, handler) {
    const element = this.getElement(key);
    if (!element) return;
    element.addEventListener(event, handler);
  },

  /**
   * Query elements within container
   * @param {string} selector - CSS selector
   * @param {string} containerKey - Optional container CONFIG.DOM key
   * @returns {NodeList}
   */
  query(selector, containerKey) {
    let container = document.body;
    if (containerKey) {
      container = this.getElement(containerKey);
      if (!container) return [];
    }
    return container.querySelectorAll(selector);
  }
};

// Make DOMUtils globally accessible
window.DOMUtils = DOMUtils;
