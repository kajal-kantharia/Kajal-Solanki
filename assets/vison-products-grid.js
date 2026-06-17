class VisonProductsGrid extends HTMLElement {
    constructor() {
      super();
      this.modal = this.querySelector('[data-shop-the-look-modal]');
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
      this.querySelectorAll('[data-shop-look-trigger]').forEach((trigger) => {
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
      const block = trigger.closest('[data-shop-look-block]');
      const productScript = block?.querySelector('[data-product-json]');
      if (!productScript) return;
  
      try {
        this.currentProduct = JSON.parse(productScript.textContent);
      } catch (error) {
        console.error('Unable to parse shop the look product data', error);
        return;
      }
  
      this.activeTrigger = trigger;
      const firstAvailableVariant =
        this.currentProduct.variants.find((variant) => variant.available) || this.currentProduct.variants[0];
  
      this.selectedOptions = firstAvailableVariant?.options ? [...firstAvailableVariant.options] : [];
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
        optionElement.className = 'shop-the-look-modal__option';
  
        const label = document.createElement('label');
        label.className = 'shop-the-look-modal__label';
        label.textContent = option.name;
        optionElement.appendChild(label);
  
        if (optionIndex === 0 && option.values.length <= 4) {
          const swatches = document.createElement('div');
          swatches.className = 'shop-the-look-modal__swatches';
          option.values.forEach((value) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shop-the-look-modal__swatch';
            button.textContent = value;
            button.dataset.optionIndex = optionIndex;
            button.dataset.optionValue = value;
            if (this.selectedOptions[optionIndex] === value) button.classList.add('is-selected');
            button.addEventListener('click', () => this.selectOption(optionIndex, value));
            swatches.appendChild(button);
          });
          optionElement.appendChild(swatches);
        } else {
          const selectWrap = document.createElement('div');
          selectWrap.className = 'shop-the-look-modal__select-wrap';
          const select = document.createElement('select');
          select.className = 'shop-the-look-modal__select';
          select.dataset.optionIndex = optionIndex;
          select.setAttribute('aria-label', option.name);
  
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = `Choose your ${option.name.toLowerCase()}`;
          placeholder.disabled = true;
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
  
    findSelectedVariant() {
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
      this.submitButton.querySelector('[data-submit-text]').textContent = isAvailable ? 'Add to cart' : 'Unavailable';
      this.message.textContent = '';
    }
  
    openModal() {
      this.modal.classList.add('is-open');
      this.modal.removeAttribute('hidden');
      document.body.classList.add('shop-the-look-modal-open');
      const closeButton = this.querySelector('[data-modal-close-button]');
      if (window.trapFocus) {
        window.trapFocus(this.modal.querySelector('.shop-the-look-modal__dialog'), closeButton);
      } else {
        closeButton?.focus();
      }
    }
  
    closeModal() {
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('hidden', '');
      document.body.classList.remove('shop-the-look-modal-open');
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
        });
    }
  }
  
  if (!customElements.get('vison-products-grid')) {
    customElements.define('vison-products-grid', VisonProductsGrid);
  }
  