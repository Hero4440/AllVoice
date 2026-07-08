/**
 * AllVoice Store — Amazon-style demo store JavaScript.
 * Manages cart state in localStorage with Amazon-like UI rendering.
 */

const CART_KEY = 'allvoice_store_cart';

const PRODUCT_EMOJIS = {
  headset: '🎧',
  keyboard: '⌨️',
  magnifier: '🔍',
  cane: '🦯',
};

/** Get cart from localStorage */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

/** Save cart to localStorage */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

/** Add item to cart */
function addToCart(productId, name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, name, price: parseFloat(price), qty: 1 });
  }
  saveCart(cart);
  showToast(`✓ Added to Cart: "${name}"`);
}

/** Remove item from cart */
function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

/** Update quantity */
function updateQty(productId, newQty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = parseInt(newQty, 10);
    if (item.qty <= 0) {
      removeFromCart(productId);
      return;
    }
  }
  saveCart(cart);
}

/** Update cart count badge in header */
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = total.toString();
  // Update aria-label on cart link
  const cartLink = document.querySelector('.nav-cart');
  if (cartLink) {
    cartLink.setAttribute('aria-label', `Shopping cart, ${total} items`);
  }
}

/** Show a toast notification */
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

/** Get cart total */
function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();

  // Bind add-to-cart buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.product, btn.dataset.name, btn.dataset.price);
    });
  });

  // Render cart page
  const cartContainer = document.getElementById('cart-items-container');
  if (cartContainer) renderCart(cartContainer);

  // Render cart sidebar
  const cartSidebar = document.getElementById('cart-sidebar');
  if (cartSidebar) renderCartSidebar(cartSidebar);

  // Render checkout summary
  const checkoutSummary = document.getElementById('checkout-summary');
  if (checkoutSummary) renderCheckoutSummary(checkoutSummary);
});

/** Render Amazon-style cart items */
function renderCart(container) {
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart" role="status">
        <h2 style="font-size:28px; font-weight:400; margin-bottom:12px;">Your Amazon Cart is empty</h2>
        <p style="font-size:14px;">Check your Saved for later items below or <a href="index.html">continue shopping</a>.</p>
      </div>`;
    return;
  }

  let html = '';
  cart.forEach(item => {
    const emoji = PRODUCT_EMOJIS[item.id] || '📦';
    const qtyOptions = [1,2,3,4,5,6,7,8,9,10].map(n =>
      `<option value="${n}" ${n === item.qty ? 'selected' : ''}>Qty: ${n}</option>`
    ).join('');

    html += `
      <div class="cart-item" aria-label="${item.name}, $${item.price.toFixed(2)}, quantity ${item.qty}">
        <div class="cart-item-image">
          <div class="product-emoji">${emoji}</div>
        </div>
        <div class="cart-item-details">
          <h3>${item.name}</h3>
          <div class="item-stock">In Stock</div>
          <div class="item-shipping">Eligible for FREE Shipping</div>
          <div class="cart-item-actions">
            <select aria-label="Change quantity for ${item.name}" onchange="updateQty('${item.id}', this.value); location.reload();">
              ${qtyOptions}
            </select>
            <span class="divider">|</span>
            <button type="button" class="remove-from-cart-btn" data-product="${item.id}" aria-label="Delete ${item.name} from cart">Delete</button>
            <span class="divider">|</span>
            <a href="#">Save for later</a>
            <span class="divider">|</span>
            <a href="#">Compare with similar items</a>
          </div>
        </div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
      </div>`;
  });

  const total = getCartTotal();
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  html += `
    <div class="cart-subtotal">
      Subtotal (${totalQty} item${totalQty !== 1 ? 's' : ''}): <b>$${total.toFixed(2)}</b>
    </div>`;

  container.innerHTML = html;

  // Bind remove buttons
  container.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.product);
      location.reload();
    });
  });
}

/** Render cart sidebar */
function renderCartSidebar(sidebar) {
  const cart = getCart();
  const total = getCartTotal();
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);

  if (cart.length === 0) {
    sidebar.style.display = 'none';
    return;
  }

  sidebar.innerHTML = `
    <div class="subtotal-text">
      Subtotal (${totalQty} item${totalQty !== 1 ? 's' : ''}): <b>$${total.toFixed(2)}</b>
    </div>
    <label class="gift-option">
      <input type="checkbox"> This order contains a gift
    </label>
    <a href="checkout.html" class="btn-amazon-primary" style="display:block; margin-top:12px;" aria-label="Proceed to checkout, total $${total.toFixed(2)}">Proceed to checkout</a>
  `;
}

/** Render checkout summary */
function renderCheckoutSummary(container) {
  const cart = getCart();
  const total = getCartTotal();
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);

  if (cart.length === 0) {
    container.innerHTML = '<p style="color:#565959;">No items in cart.</p>';
    return;
  }

  let html = '';
  html += `<div class="summary-line"><span>Items (${totalQty}):</span><span>$${total.toFixed(2)}</span></div>`;
  html += `<div class="summary-line"><span>Shipping & handling:</span><span>$0.00</span></div>`;
  html += `<div class="summary-line"><span>Estimated tax:</span><span>$${(total * 0.08).toFixed(2)}</span></div>`;
  html += `<div class="summary-line total"><span>Order total:</span><span>$${(total * 1.08).toFixed(2)}</span></div>`;

  container.innerHTML = html;
}
