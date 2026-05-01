import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBperRVYyxnUITX92tuS8MSU5A-JKqCsM",
  authDomain: "kingmaker-crash.firebaseapp.com",
  projectId: "kingmaker-crash",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProducts = [];
let allCategories = [];
let cart = JSON.parse(localStorage.getItem('justcraze_cart')) || [];

async function loadCategories() {
  const querySnapshot = await getDocs(collection(db, "categories"));
  const filterDiv = document.getElementById('categoryFilters');
  querySnapshot.forEach((doc) => {
    const cat = doc.data().name;
    allCategories.push(cat);
    filterDiv.innerHTML += `<button class="filter-btn" onclick="filterProducts('${cat}')">${cat}</button>`;
  });
}

async function loadProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  allProducts = [];
  querySnapshot.forEach((doc) => {
    const product = { id: doc.id, ...doc.data() };
    allProducts.push(product);
  });
  displayProducts(allProducts);
  loadCategories();
}

function displayProducts(products) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  if (products.length === 0) {
    grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No products found.</p>';
    return;
  }
  products.forEach(product => {
    let stockBadge = '';
    if (product.stock === 0) {
      stockBadge = '<span class="stock-badge out-stock">Out of Stock</span>';
    } else if (product.stock < 5) {
      stockBadge = `<span class="stock-badge low-stock">Only ${product.stock} left</span>`;
    } else {
      stockBadge = '<span class="stock-badge in-stock">In Stock</span>';
    }
    grid.innerHTML += `
      <div class="product-card glass glass-hover">
        <img src="${product.imageUrl}" alt="${product.title}" class="product-image">
        <div class="product-info">
          <div class="product-category">${product.category || 'General'}</div>
          <h3 class="product-title">${product.title}</h3>
          ${stockBadge}
          <div class="product-price">Rs. ${product.price}</div>
          <button class="add-to-cart" onclick="addToCart('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
            ${product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
  });
}

window.filterProducts = (cat) => {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const filtered = cat === 'All' ? allProducts : allProducts.filter(p => p.category === cat);
  displayProducts(filtered);
};

window.addToCart = (productId) => {
  const product = allProducts.find(p => p.id === productId);
  if (!product || product.stock === 0) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.qty < product.stock) existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCart();
  toggleCart();
};

window.updateQty = (productId, change) => {
  const item = cart.find(i => i.id === productId);
  const product = allProducts.find(p => p.id === productId);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== productId);
    } else if (item.qty > product.stock) {
      item.qty = product.stock;
    }
  }
  updateCart();
};

window.removeFromCart = (productId) => {
  cart = cart.filter(i => i.id !== productId);
  updateCart();
};

function updateCart() {
  localStorage.setItem('justcraze_cart', JSON.stringify(cart));
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').innerText = cartCount;
  const cartItemsDiv = document.getElementById('cartItems');
  cartItemsDiv.innerHTML = '';
  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Cart is empty</p>';
  } else {
    cart.forEach(item => {
      cartItemsDiv.innerHTML += `
        <div class="cart-item">
          <img src="${item.imageUrl}" alt="${item.title}">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">Rs. ${item.price}</div>
            <div class="qty-controls">
              <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
              <span>${item.qty}</span>
              <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
          </div>
          <button class="remove-item" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
    });
  }
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  document.getElementById('cartTotal').innerText = `Rs. ${subtotal}`;
  document.getElementById('checkoutTotal').innerText = `Rs. ${subtotal}`;
}

window.toggleCart = () => {
  document.getElementById('cartSidebar').classList.toggle('open');
};

window.openCheckout = () => {
  if (cart.length === 0) return alert('Cart is empty!');
  document.getElementById('checkoutModal').classList.add('open');
  toggleCart();
};

window.closeCheckout = () => {
  document.getElementById('checkoutModal').classList.remove('open');
};

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const orderData = {
    customerName: document.getElementById('customerName').value,
    customerPhone: document.getElementById('customerPhone').value,
    customerAddress: document.getElementById('customerAddress').value,
    customerCity: document.getElementById('customerCity').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    products: cart.map(item => ({
      productId: item.id,
      productTitle: item.title,
      productPrice: item.price,
      productImage: item.imageUrl,
      qty: item.qty
    })),
    totalAmount: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
    status: 'Pending',
    orderedAt: serverTimestamp()
  };
  try {
    const docRef = await addDoc(collection(db, "orders"), orderData);
    alert(`Order placed! Your Order ID: ${docRef.id}\nSave this ID to track your order.`);
    cart = [];
    updateCart();
    closeCheckout();
    document.getElementById('checkoutForm').reset();
  } catch (error) {
    alert('Error placing order: ' + error.message);
  }
});

window.trackOrder = async () => {
  const orderId = document.getElementById('trackId').value.trim();
  if (!orderId) return;
  const statusDiv = document.getElementById('orderStatus');
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = 'Searching...';
  try {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const order = docSnap.data();
      const date = order.orderedAt ? new Date(order.orderedAt.seconds * 1000).toLocaleString() : 'N/A';
      const products = order.products.map(p => `${p.productTitle} x${p.qty}`).join('<br>');
      statusDiv.innerHTML = `
        <h4>Order Found ✅</h4>
        <p><b>Status:</b> ${order.status}</p>
        <p><b>Customer:</b> ${order.customerName}</p>
        <p><b>Total:</b> Rs. ${order.totalAmount}</p>
        <p><b>Products:</b><br>${products}</p>
        <p><b>Ordered On:</b> ${date}</p>
      `;
    } else {
      statusDiv.innerHTML = '<p style="color:#ff5252;">Order not found. Check your Order ID.</p>';
    }
  } catch (error) {
    statusDiv.innerHTML = '<p style="color:#ff5252;">Error: ' + error.message + '</p>';
  }
};

loadProducts();
updateCart();
