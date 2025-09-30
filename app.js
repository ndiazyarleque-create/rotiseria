// app.js - client logic (Firebase auth + cart + communication with server for Stripe)
const PRODUCTS = window.PRODUCTS || null; // some pages inject PRODUCTS
// Firebase configuration placeholder - REPLACE with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT",
  // storageBucket, messagingSenderId, appId...
};
if(window.firebase && !firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
  // optional: firebase.firestore();
}

// Cart helpers
function getCart(){ return JSON.parse(localStorage.getItem('cart')||'[]'); }
function setCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }
function addToCart(id){
  var all = PRODUCTS || JSON.parse(localStorage.getItem('products')||'[]');
  var p = all.find(function(x){return x.id===id});
  if(!p){ alert('Producto no encontrado'); return; }
  var cart = getCart(); cart.push(p); setCart(cart);
  alert(p.name + ' agregado al carrito.');
  renderCartPreview();
}
function renderCartPreview(){
  var cart = getCart();
  var total = cart.reduce(function(s,i){return s+i.price},0);
  // show small preview in nav (optional)
  var nav = document.getElementById('nav-auth-link');
  if(nav && firebase.auth().currentUser){
    nav.textContent = firebase.auth().currentUser.email + ' (Salir)';
    nav.onclick = function(){ firebase.auth().signOut().then(()=>{ localStorage.removeItem('user'); location.href='index.html'; }); }
  }
}
function viewProduct(id){
  var all = PRODUCTS || JSON.parse(localStorage.getItem('products')||'[]');
  var p = all.find(function(x){return x.id===id});
  if(!p) return alert('producto no encontrado');
  localStorage.setItem('viewProduct', JSON.stringify(p));
  window.location.href='product.html';
}
function renderProductDetail(){
  var p = JSON.parse(localStorage.getItem('viewProduct')||'null');
  var container = document.getElementById('product-detail');
  if(!container) return;
  if(!p) container.innerHTML = '<p>Producto no encontrado.</p>';
  else {
    container.innerHTML = '<div class="product-full"><img src="'+p.img+'" alt="'+p.name+'"><div><h2>'+p.name+'</h2><p class="price">CLP $'+p.price+'</p><p>Categoria: '+p.category+'</p><p>Delicioso plato preparado con recetas caseras.</p><div class="card-actions"><button onclick="addToCart('+p.id+')">Agregar</button><button onclick="window.location.href=\'products.html\'">Volver</button></div></div></div>';
  }
}
// render cart on checkout page
function renderCartList(){
  var list = document.getElementById('cart-list');
  if(!list) return;
  var cart = getCart();
  if(cart.length===0){ list.innerHTML = '<p>Tu carrito está vacío.</p>'; document.getElementById('subtotal') && (document.getElementById('subtotal').textContent='Subtotal: CLP $0'); return; }
  list.innerHTML = '';
  var total=0;
  cart.forEach(function(item,idx){
    var div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = '<div><strong>'+item.name+'</strong> - CLP $'+item.price+'</div><div><button onclick="removeFromCart('+idx+')">Eliminar</button></div>';
    list.appendChild(div);
    total+=item.price;
  });
  document.getElementById('subtotal') && (document.getElementById('subtotal').textContent='Subtotal: CLP $'+total);
}
function removeFromCart(i){ var c=getCart(); c.splice(i,1); setCart(c); renderCartList(); }
document.addEventListener('DOMContentLoaded', function(){
  // if PRODUCTS injected on page, store for other pages to use
  if(typeof PRODUCTS !== 'undefined' && PRODUCTS) localStorage.setItem('products', JSON.stringify(PRODUCTS));
  renderCartPreview();
  renderProductDetail();
  renderCartList();
});

// helper to call server to create stripe checkout session
function createCheckoutSession(email){
  var cart = getCart();
  if(cart.length===0) return alert('Carrito vacío');
  return fetch('https://rotiseria.up.railway.app/create-checkout-session', {
    method: 'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({cart:cart, email: email})
  }).then(function(r){ return r.json(); });
}
