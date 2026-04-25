/**
 * AllVoice Store — Shared JavaScript for the demo store.
 * Manages cart state in localStorage and provides toast notifications.
 */

const CART_KEY = 'allvoice_store_cart';

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
  showToast(`Added "${name}" to cart`);
}

/** Remove item from cart */
function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

/** Update cart count badge in header */
function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = total.toString();
  // Update aria-label on cart link
  const cartLink = document.querySelector('[aria-label*="cart"]');
  if (cartLink && cartLink.tagName === 'A') {
    cartLink.setAttribute('aria-label', `View cart (${total} items)`);
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

  // Bind remove buttons (cart page)
  document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.product);
      location.reload();
    });
  });

  // Render cart page if on cart.html
  const cartContainer = document.getElementById('cart-items-container');
  if (cartContainer) renderCart(cartContainer);

  // Render checkout summary if on checkout.html
  const checkoutSummary = document.getElementById('checkout-summary');
  if (checkoutSummary) renderCheckoutSummary(checkoutSummary);
});

/** Render cart items on cart page */
function renderCart(container) {
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart" role="status">
        <p>Your cart is empty.</p>
        <a href="index.html" class="btn-primary" style="margin-top:16px;">Browse Products</a>
      </div>`;
    return;
  }

  let html = '<div class="cart-items">';
  cart.forEach(item => {
    html += `
      <div class="cart-item" aria-label="${item.name}, $${item.price.toFixed(2)}, quantity ${item.qty}">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-price">$${item.price.toFixed(2)} × ${item.qty}</span>
        </div>
        <button class="btn-danger remove-from-cart-btn" data-product="${item.id}" aria-label="Remove ${item.name} from cart">Remove</button>
      </div>`;
  });
  html += '</div>';

  const total = getCartTotal();
  html += `
    <div class="cart-summary">
      <span class="cart-total">Total: $${total.toFixed(2)}</span>
      <a href="checkout.html" class="btn-primary" aria-label="Proceed to checkout, total $${total.toFixed(2)}">Checkout</a>
    </div>`;

  container.innerHTML = html;

  // Re-bind remove buttons after render
  container.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.product);
      location.reload();
    });
  });
}

/** Render checkout summary */
function renderCheckoutSummary(container) {
  const cart = getCart();
  const total = getCartTotal();
  if (cart.length === 0) {
    container.innerHTML = '<p style="color:#E0E0E0;">No items in cart.</p>';
    return;
  }
  let html = '';
  cart.forEach(item => {
    html += `<p style="color:#E0E0E0;">${item.name} × ${item.qty} — <strong style="color:#FFD700;">$${(item.price * item.qty).toFixed(2)}</strong></p>`;
  });
  html += `<p style="margin-top:12px;font-size:20px;font-weight:700;color:#FFD700;">Total: $${total.toFixed(2)}</p>`;
  container.innerHTML = html;
}
