document.addEventListener('DOMContentLoaded', () => {
  // Global App State
  let cart = JSON.parse(localStorage.getItem('dogfriz_cart')) || [];
  let currentSiteMode = document.body.dataset.siteMode || 'phase1';

  // Dom Elements
  const backdrop = document.querySelector('.cart-drawer-backdrop');
  const openCartBtn = document.querySelector('.cart-icon-btn');
  const closeCartBtn = document.querySelector('.cart-close-btn');
  const cartItemsContainer = document.querySelector('.cart-drawer-items');
  const cartCountBadges = document.querySelectorAll('.cart-count');
  const cartTotalValue = document.querySelector('.cart-total-value');
  const checkoutBtn = document.querySelector('.btn-checkout');
  const checkoutModal = document.querySelector('.checkout-modal');
  const closeCheckoutBtn = document.querySelector('.checkout-modal-close-btn');
  
  // Sizing Calculator Elements
  const calcWeight = document.getElementById('calc-weight');
  const calcGirth = document.getElementById('calc-girth');
  const calcResult = document.getElementById('calc-result');

  // Contact Form
  const contactForm = document.getElementById('dogfriz-contact-form');

  // Admin Toggle
  const adminToggleBtns = document.querySelectorAll('.admin-toggle-btn');
  const adminModalBtn = document.querySelector('.admin-dashboard-btn');
  const adminModal = document.querySelector('.admin-modal');
  const closeAdminBtn = document.querySelector('.admin-modal-close-btn');

  // Initialize UI
  updateCartUI();

  // --- CART FUNCTIONS ---
  function openCart() {
    if (backdrop) backdrop.classList.add('open');
  }

  function closeCart() {
    if (backdrop) backdrop.classList.remove('open');
  }

  if (openCartBtn) openCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeCart();
    });
  }

  // Add Item to Cart
  window.addToCart = function(slug, title, price, emoji) {
    if (currentSiteMode === 'phase1') {
      alert("Dogfriz gear is currently undergoing safety testing. Commerce is disabled in Phase 1.");
      return;
    }

    const qtyInput = document.getElementById('product-qty');
    const quantity = qtyInput ? parseInt(qtyInput.innerText) : 1;
    
    // Check sizing
    const sizeBtn = document.querySelector('.size-btn.active');
    const size = sizeBtn ? sizeBtn.dataset.size : 'Standard';

    const existingItemIndex = cart.findIndex(item => item.slug === slug && item.size === size);

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        slug,
        title,
        price: parseFloat(price),
        emoji,
        size,
        quantity
      });
    }

    saveCart();
    updateCartUI();
    openCart();

    // Reset qty selector if on details page
    if (qtyInput) qtyInput.innerText = '1';
  };

  function saveCart() {
    localStorage.setItem('dogfriz_cart', JSON.stringify(cart));
  }

  function updateCartUI() {
    // Update count badges
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadges.forEach(badge => {
      badge.innerText = totalItems;
      badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-message">
          <div class="cart-empty-icon">🛒</div>
          <p>Your shopping cart is currently empty.</p>
          <p style="font-size: 13px; margin-top: 8px; color: #94A3B8;">Add some canine gear science to keep your pup cool!</p>
        </div>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (cartTotalValue) cartTotalValue.innerText = '$0.00';
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    let total = 0;
    cartItemsContainer.innerHTML = cart.map((item, index) => {
      const itemSubtotal = item.price * item.quantity;
      total += itemSubtotal;
      return `
        <div class="cart-item">
          <div class="cart-item-image">${item.emoji}</div>
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-meta">Size: ${item.size} | $${item.price.toFixed(2)}</div>
            <div class="cart-item-footer">
              <div class="cart-item-qty">
                <button class="cart-item-qty-btn" onclick="updateItemQty(${index}, -1)">-</button>
                <span class="cart-item-qty-val">${item.quantity}</span>
                <button class="cart-item-qty-btn" onclick="updateItemQty(${index}, 1)">+</button>
              </div>
              <button class="cart-item-remove" onclick="removeCartItem(${index})">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (cartTotalValue) {
      cartTotalValue.innerText = `$${total.toFixed(2)}`;
    }
  }

  window.updateItemQty = function(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
    updateCartUI();
  };

  window.removeCartItem = function(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  };

  // Checkout Simulation
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      closeCart();
      if (checkoutModal) checkoutModal.classList.add('open');
      cart = [];
      saveCart();
      updateCartUI();
    });
  }

  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => {
      if (checkoutModal) checkoutModal.classList.remove('open');
    });
  }

  // --- QUANTITY CONTROLLER ---
  const qtyMinus = document.querySelector('.qty-minus');
  const qtyPlus = document.querySelector('.qty-plus');
  const qtyVal = document.querySelector('.qty-val');

  if (qtyMinus && qtyPlus && qtyVal) {
    qtyMinus.addEventListener('click', () => {
      let currentVal = parseInt(qtyVal.innerText);
      if (currentVal > 1) {
        qtyVal.innerText = currentVal - 1;
      }
    });

    qtyPlus.addEventListener('click', () => {
      let currentVal = parseInt(qtyVal.innerText);
      qtyVal.innerText = currentVal + 1;
    });
  }

  // --- SIZE SELECTOR ---
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // --- SIZING CALCULATOR ---
  function calculateSize() {
    if (!calcWeight || !calcGirth || !calcResult) return;
    
    const girth = parseFloat(calcGirth.value);
    const breed = calcWeight.value;

    if (!girth) {
      calcResult.innerText = "Enter your dog's chest girth above to calculate.";
      return;
    }

    let size = 'M';
    if (girth < 20) {
      size = 'S';
    } else if (girth >= 20 && girth < 26) {
      size = 'M';
    } else if (girth >= 26 && girth < 32) {
      size = 'L';
    } else if (girth >= 32) {
      size = 'XL';
    }

    calcResult.innerHTML = `<strong>Recommended Size: ${size}</strong><br><span style="font-size: 12px; color: #64748B;">Based on a chest girth of ${girth}" for a ${breed}.</span>`;

    // Automatically highlight the matching size button if it exists
    const matchingBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
    if (matchingBtn) {
      sizeBtns.forEach(b => b.classList.remove('active'));
      matchingBtn.classList.add('active');
    }
  }

  if (calcWeight) calcWeight.addEventListener('change', calculateSize);
  if (calcGirth) calcGirth.addEventListener('input', calculateSize);

  // --- DYNAMIC TABS ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // --- CONTACT FORM ACTIONS ---
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
          // Success Feedback
          const container = contactForm.parentElement;
          container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <div style="font-size: 50px; margin-bottom: 20px;">✉️</div>
              <h3 style="margin-bottom: 12px; font-family: var(--font-serif); font-size: 24px;">Message Received!</h3>
              <p style="color: var(--slate-gray); margin-bottom: 24px;">${result.message}</p>
              <button class="btn btn-primary" onclick="window.location.reload()">Send Another Message</button>
            </div>
          `;
          // Refresh messages if Admin panel is open
          fetchAdminState();
        } else {
          alert(result.message || 'Something went wrong.');
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        alert('Network error. Please try again.');
      }
    });
  }

  // --- ADMIN PANEL AND TOGGLING ---
  async function toggleSiteMode() {
    try {
      const response = await fetch('/api/toggle-mode', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error toggling site mode:', err);
    }
  }

  adminToggleBtns.forEach(btn => {
    btn.addEventListener('click', toggleSiteMode);
  });

  // Admin Dashboard Modal Controls
  if (adminModalBtn) {
    adminModalBtn.addEventListener('click', () => {
      if (adminModal) {
        adminModal.classList.add('open');
        fetchAdminState();
      }
    });
  }

  if (closeAdminBtn) {
    closeAdminBtn.addEventListener('click', () => {
      if (adminModal) adminModal.classList.remove('open');
    });
  }

  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) adminModal.classList.remove('open');
    });
  }

  async function fetchAdminState() {
    const messageContainer = document.getElementById('admin-messages-list');
    if (!messageContainer) return;

    try {
      const response = await fetch('/api/state');
      const state = await response.json();

      if (state.contactMessages.length === 0) {
        messageContainer.innerHTML = `<p style="color: var(--slate-gray); font-style: italic;">No customer messages received yet. Submit the contact form to see messages load here instantly!</p>`;
        return;
      }

      messageContainer.innerHTML = state.contactMessages.map(msg => `
        <div class="message-item">
          <div class="message-item-header">
            <span>From: ${msg.name} (${msg.email})</span>
            <span>${msg.date}</span>
          </div>
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">Subject: ${msg.subject}</div>
          <p style="font-size: 14px; color: var(--charcoal-light);">${msg.message}</p>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error fetching admin state:', err);
    }
  }
});
