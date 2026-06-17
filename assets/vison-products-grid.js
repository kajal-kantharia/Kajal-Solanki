class VisonProductsGrid extends HTMLElement {
    constructor() {
      super();
      this.modal = this.querySelector('[data-vison-products-grid-modal]');
      this.productImage = this.querySelector('[data-modal-image]');
      this.productTitle = this.querySelector('[data-modal-title]');
      this.productPrice = this.querySelector('[data-modal-price]');
      this.productDescription = this.querySelector('[data-modal-description]');
      this.optionsContainer = this.querySelector('[data-modal-options]');
      this.form = this.querySelector('[data-modal-form]');
      this.variantInput = this.querySelector('[data-variant-id]');
      this.submitButton = this.querySelector('[data-modal-submit]');
      this.message = this.querySelector('[data-modal-message]');
      this.closeButtons = this.querySelectorAll('[data-modal-close]');
      this.currentProduct = null;
      this.selectedOptions = [];
      this.activeTrigger = null;
    }
  
    connectedCallback() {
      this.querySelectorAll('[data-vison-products-trigger]').forEach((trigger) => {
        trigger.addEventListener('click', () => this.openProduct(trigger));
      });
  
      this.closeButtons.forEach((button) => button.addEventListener('click', () => this.closeModal()));
      this.modal?.addEventListener('click', (event) => {
        if (event.target.hasAttribute('data-modal-close')) this.closeModal();
      });
      this.form?.addEventListener('submit', (event) => this.addToCart(event));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.modal?.classList.contains('is-open')) this.closeModal();
      });
    }
  
    openProduct(trigger) {
      const block = trigger.closest('[data-vison-products-block]');
      const productScript = block?.querySelector('[data-product-json]');
      if (!productScript) return;
  
      try {
        this.currentProduct = JSON.parse(productScript.textContent);
      } catch (error) {
        console.error('Unable to parse shop the look product data', error);
        return;
      }
  
      this.activeTrigger = trigger;
      this.selectedOptions = this.currentProduct.hasOnlyDefaultVariant
        ? [...(this.currentProduct.variants[0]?.options || [])]
        : new Array(this.currentProduct.options.length).fill('');
      this.renderProduct();
      this.openModal();
    }
  
    renderProduct() {
      const product = this.currentProduct;
      if (!product) return;
  
      this.productImage.src = product.image || '';
      this.productImage.alt = product.title || '';
      this.productImage.hidden = !product.image;
      this.productTitle.textContent = product.title || '';
      this.productPrice.textContent = product.price || '';
      this.productDescription.textContent = product.description || '';
      this.optionsContainer.innerHTML = '';
  
      product.options.forEach((option, optionIndex) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'vison-products-grid-modal__option';
  
        const label = document.createElement('label');
        label.className = 'vison-products-grid-modal__label';
        label.textContent = option.name;
        optionElement.appendChild(label);
  
        if (this.isColorOption(option.name)) {
          const swatches = document.createElement('fieldset');
          swatches.className = 'vison-products-grid-modal__swatches';
          swatches.setAttribute('aria-label', option.name);
  
          option.values.forEach((value) => {
            const radioId = `${this.id || 'vison-products-grid'}-${optionIndex}-${this.slugify(value)}`;
            const radioLabel = document.createElement('label');
            radioLabel.className = 'vison-products-grid-modal__swatch';
            radioLabel.setAttribute('for', radioId);
  
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = radioId;
            radio.name = `option-${optionIndex}`;
            radio.value = value;
            radio.checked = this.selectedOptions[optionIndex] === value;
            radio.addEventListener('change', () => this.selectOption(optionIndex, value));
  
            const radioText = document.createElement('span');
            radioText.textContent = value;
            radioText.style.setProperty('--swatch-color', this.getColorValue(value));
  
            radioLabel.appendChild(radio);
            radioLabel.appendChild(radioText);
            swatches.appendChild(radioLabel);
          });
          optionElement.appendChild(swatches);
        } else {
          const selectWrap = document.createElement('div');
          selectWrap.className = 'vison-products-grid-modal__select-wrap';
          const select = document.createElement('select');
          select.className = 'vison-products-grid-modal__select';
          select.dataset.optionIndex = optionIndex;
          select.setAttribute('aria-label', option.name);
  
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = `Choose your ${option.name.toLowerCase()}`;
          placeholder.disabled = true;
          placeholder.selected = !this.selectedOptions[optionIndex];
          select.appendChild(placeholder);
  
          option.values.forEach((value) => {
            const optionNode = document.createElement('option');
            optionNode.value = value;
            optionNode.textContent = value;
            select.appendChild(optionNode);
          });
  
          select.value = this.selectedOptions[optionIndex] || '';
          select.addEventListener('change', (event) => this.selectOption(optionIndex, event.target.value));
          selectWrap.appendChild(select);
          optionElement.appendChild(selectWrap);
        }
  
        this.optionsContainer.appendChild(optionElement);
      });
  
      this.updateVariant();
    }
  
    selectOption(optionIndex, value) {
      this.selectedOptions[optionIndex] = value;
      this.renderProduct();
    }
  
    isColorOption(optionName) {
      return ['color', 'colour'].includes(optionName.trim().toLowerCase());
    }
  
    slugify(value) {
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  
    getColorValue(value) {
      const color = String(value).trim().toLowerCase();
      const colorMap = {
        beige: '#d8c4a8',
        black: '#000000',
        blue: '#174e9a',
        brown: '#7a4f2a',
        cream: '#f4ead7',
        gold: '#c9a227',
        green: '#2f6f4e',
        grey: '#8f8f8f',
        gray: '#8f8f8f',
        navy: '#0f2748',
        orange: '#d9742f',
        pink: '#d989a8',
        purple: '#6c4a8f',
        red: '#b3262d',
        silver: '#b9b9b9',
        white: '#ffffff',
        yellow: '#e0bd36',
      };
  
      return colorMap[color] || color;
    }
  
    hasSelectedRequiredOptions() {
      if (this.currentProduct?.hasOnlyDefaultVariant) return true;
      return this.currentProduct?.options.every((_, index) => Boolean(this.selectedOptions[index]));
    }
  
    findSelectedVariant() {
      if (!this.hasSelectedRequiredOptions()) return null;
  
      return this.currentProduct?.variants.find((variant) => {
        return variant.options.every((option, index) => option === this.selectedOptions[index]);
      });
    }
  
    updateVariant() {
      const variant = this.findSelectedVariant();
      const isAvailable = Boolean(variant?.available);
  
      this.variantInput.value = variant?.id || '';
      this.productPrice.textContent = variant?.price || this.currentProduct.price || '';
      this.submitButton.disabled = !isAvailable;
      this.submitButton.setAttribute('aria-disabled', String(!isAvailable));
      this.submitButton.querySelector('[data-submit-text]').textContent =
        !this.hasSelectedRequiredOptions() || isAvailable ? 'Add to cart' : 'Unavailable';
      this.message.textContent = '';
    }
  
    openModal() {
      this.modal.classList.add('is-open');
      this.modal.removeAttribute('hidden');
      document.body.classList.add('vison-products-grid-modal-open');
      const closeButton = this.querySelector('[data-modal-close-button]');
      if (window.trapFocus) {
        window.trapFocus(this.modal.querySelector('.vison-products-grid-modal__dialog'), closeButton);
      } else {
        closeButton?.focus();
      }
    }
  
    closeModal() {
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('hidden', '');
      document.body.classList.remove('vison-products-grid-modal-open');
      window.removeTrapFocus?.(this.activeTrigger);
      this.activeTrigger?.focus();
    }
  
    addToCart(event) {
      event.preventDefault();
      if (!this.variantInput.value || this.submitButton.disabled) return;
  
      this.submitButton.disabled = true;
      this.message.textContent = '';
  
      const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      const formData = new FormData();
      formData.append('id', this.variantInput.value);
      formData.append('quantity', '1');
  
      if (cart?.getSectionsToRender) {
        formData.append(
          'sections',
          cart.getSectionsToRender().map((section) => section.id)
        );
        formData.append('sections_url', window.location.pathname);
        cart.setActiveElement?.(document.activeElement);
      }
  
      const config = window.fetchConfig ? window.fetchConfig('javascript') : { method: 'POST', headers: {} };
      if (config.headers) {
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];
      }
      config.body = formData;
  
      fetch(window.routes?.cart_add_url || '/cart/add.js', config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            this.message.textContent = response.description || response.message || 'Unable to add this item.';
            return;
          }
  
          this.closeModal();
          if (cart?.renderContents) {
            cart.renderContents(response);
          } else {
            this.message.textContent = 'Added to cart.';
          }
        })
        .catch(() => {
          this.message.textContent = 'Unable to add this item. Please try again.';
        })
        .finally(() => {
          this.submitButton.disabled = !this.findSelectedVariant()?.available;
          alert('Added to cart!');
        });
    }
  }
  
  if (!customElements.get('vison-products-grid')) {
    customElements.define('vison-products-grid', VisonProductsGrid);
  }
  