document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.querySelector('input[type="date"]');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  const readCart = () => {
    try {
      return JSON.parse(localStorage.getItem('umbra_cart') || '[]');
    } catch (error) {
      return [];
    }
  };

  const saveCart = (cart) => localStorage.setItem('umbra_cart', JSON.stringify(cart));

  const updateCartBadge = () => {
    const cart = readCart();
    const count = cart.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
      el.setAttribute('aria-label', count > 0 ? `${count} productos en el carrito` : 'Carrito vacío');
    });
  };

  const formatMoney = (value) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

  document.querySelectorAll('.add-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const id = String(button.dataset.id);
      const nombre = button.dataset.nombre || 'Producto';
      const precio = Number(button.dataset.precio || 0);
      const imagen = button.dataset.imagen || '';
      const cart = readCart();
      const item = cart.find((entry) => String(entry.id) === id);
      if (item) {
        item.cantidad += 1;
      } else {
        cart.push({ id, nombre, precio, cantidad: 1, imagen });
      }
      saveCart(cart);
      updateCartBadge();
      button.textContent = 'Añadido';
      setTimeout(() => {
        button.textContent = button.classList.contains('full') ? '+ Añadir' : 'Añadir';
      }, 800);
    });
  });

  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    const isActive = href === '/' ? currentPath === '/' : href === currentPath || (href && href.startsWith('/#') && currentPath === '/');
    if (isActive) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const cartItemsRoot = document.querySelector('[data-cart-items]');
  const totalPriceRoot = document.querySelector('[data-cart-total]');
  const renderCartPage = () => {
    if (!cartItemsRoot || !totalPriceRoot) return;

    const cart = readCart();
    if (!cart.length) {
      cartItemsRoot.innerHTML = '<p>Tu carrito está vacío por el momento.</p>';
      totalPriceRoot.textContent = formatMoney(0);
      return;
    }

    const totalItems = cart.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    const total = cart.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0), 0);
    totalPriceRoot.textContent = formatMoney(total);
    const title = document.querySelector('.section-head h2');
    if (title) {
      title.textContent = totalItems === 1 ? 'Mi carrito · 1 compra' : `Mi carrito · ${totalItems} compras`;
    }

    cartItemsRoot.innerHTML = cart.map((item) => `
      <div class="cart-item">
        <img class="cart-product-thumb" src="${item.imagen || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300'}" alt="${item.nombre}">
        <div class="cart-product-copy">
          <strong>${item.nombre}</strong>
          <small>${formatMoney(Number(item.precio || 0))} c/u</small>
        </div>
        <div class="cart-item-actions">
          <button class="btn-small" type="button" data-cart-action="decrease" data-id="${item.id}" aria-label="Disminuir cantidad">-</button>
          <span class="cart-qty">${item.cantidad}</span>
          <button class="btn-small" type="button" data-cart-action="increase" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
          <button class="btn-small danger" type="button" data-cart-action="remove" data-id="${item.id}" aria-label="Eliminar producto">Quitar</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('[data-cart-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const { cartAction, id } = button.dataset;
        const cart = readCart();
        const itemIndex = cart.findIndex((entry) => String(entry.id) === String(id));
        if (itemIndex === -1) return;

        const item = cart[itemIndex];
        if (cartAction === 'increase') item.cantidad += 1;
        if (cartAction === 'decrease') item.cantidad = Math.max(1, item.cantidad - 1);
        if (cartAction === 'remove') cart.splice(itemIndex, 1);

        saveCart(cart);
        updateCartBadge();
        renderCartPage();
      });
    });
  };

  renderCartPage();
  updateCartBadge();

  const paymentMethod = document.getElementById('metodo_pago');
  const cardFields = document.getElementById('card-fields');
  const toggleCardFields = () => {
    if (!paymentMethod || !cardFields) return;
    const isCard = paymentMethod.value === 'tarjeta';
    cardFields.style.display = isCard ? 'block' : 'none';
    const inputs = cardFields.querySelectorAll('input');
    inputs.forEach((input) => {
      input.required = isCard;
    });
  };

  if (paymentMethod) {
    paymentMethod.addEventListener('change', toggleCardFields);
    toggleCardFields();
  }

  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const messageEl = document.querySelector('[data-checkout-msg]');
      const items = readCart();
      if (!items.length) {
        if (messageEl) messageEl.textContent = 'Tu carrito está vacío.';
        return;
      }

      const formData = new FormData(checkoutForm);
      const payload = {
        cliente_nombre: formData.get('cliente_nombre'),
        cliente_email: formData.get('cliente_email'),
        cliente_telefono: formData.get('cliente_telefono'),
        direccion: formData.get('direccion'),
        metodo_pago: formData.get('metodo_pago') || 'tarjeta',
        titular_tarjeta: formData.get('titular_tarjeta'),
        numero_tarjeta: formData.get('numero_tarjeta'),
        expiracion: formData.get('expiracion'),
        cvv: formData.get('cvv'),
        observaciones: formData.get('observaciones'),
        items,
        total: items.reduce((sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0), 0),
      };

      try {
        const response = await fetch('/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.msg || 'No se pudo procesar el pago');
        }
        localStorage.removeItem('umbra_cart');
        updateCartBadge();
        renderCartPage();
        checkoutForm.reset();
        if (messageEl) {
          messageEl.textContent = result.msg || 'Pago procesado correctamente.';
          messageEl.style.color = '#2e7d32';
        }
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } catch (error) {
        if (messageEl) {
          messageEl.textContent = error.message;
          messageEl.style.color = '#b42318';
        }
      }
    });
  }
});
