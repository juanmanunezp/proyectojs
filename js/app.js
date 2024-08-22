let masid = 1;

class Producto {
    constructor(nombre, precio, stock, imgSrc = '') {
        this.id = masid++;
        this.nombre = nombre;
        this.precio = parseFloat(precio);
        this.stock = stock;
        this.imgSrc = imgSrc;
    }
}

const inventario = [];
const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function mostrarInventario() {
    const productosContainer = document.getElementById('productos-container');
    const template = document.getElementById('producto-template');

    productosContainer.innerHTML = '';

    inventario.forEach(producto => {
        const clon = template.content.cloneNode(true);
        clon.querySelector('.card-title').innerHTML = `<b>${producto.nombre}</b>`;
        clon.querySelector('.card-text').textContent = `Stock: ${producto.stock}`;
        clon.querySelector('.precio').textContent = `${producto.precio.toFixed(2)} U$S`;
        clon.querySelector('.card-img-top').src = producto.imgSrc;
        clon.querySelector('.card-img-top').alt = producto.nombre;
        clon.querySelector('.agregar-btn').addEventListener('click', () => agregarAlCarrito(producto.id));
        productosContainer.appendChild(clon);
    });
}

function agregarAlCarrito(idDelProducto) {
    const producto = inventario.find(item => item.id === idDelProducto);

    if (producto) {
        if (producto.stock > 0) {
            let itemEnCarrito = carrito.find(item => item.id === idDelProducto);
            if (itemEnCarrito) {
                if (itemEnCarrito.cantidad < producto.stock) {
                    itemEnCarrito.cantidad += 1;
                    producto.stock -= 1;
                    mostrarToast(`${producto.nombre} se ha añadido al carrito.`);
                } else {
                    mostrarToast(`No puedes añadir más de ${producto.stock} unidades de ${producto.nombre}.`);
                }
            } else {
                itemEnCarrito = { id: idDelProducto, nombre: producto.nombre, precio: producto.precio, cantidad: 1 };
                carrito.push(itemEnCarrito);
                producto.stock -= 1;
                mostrarToast(`${producto.nombre} se ha añadido al carrito.`);
            }
            actualizarCarrito();
        } else {
            mostrarToast(`No hay stock disponible para ${producto.nombre}.`);
        }
    }
}

// funciones para mostrar alertas

function mostrarToast(mensaje) {
    Toastify({
        text: mensaje,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)"
        }
    }).showToast();
}

function mostrarSweetAlert(titulo, texto, tipo) {
    Swal.fire({
        title: titulo,
        text: texto,
        icon: tipo,
        confirmButtonText: 'Aceptar',
        timer: tipo === 'success' ? 3000 : undefined
    });
}


function actualizarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));

    const carritoContainer = document.getElementById('carrito-container');
    carritoContainer.innerHTML = '';

    carrito.forEach(item => {
        const producto = inventario.find(p => p.id === item.id);
        const div = document.createElement('div');
        div.classList.add('carrito-item');
        div.innerHTML = `
            <img src="${producto.imgSrc}" alt="${producto.nombre}" class="carrito-img">
            <span><b>${item.nombre}</b></span>
            <span>Cantidad: ${item.cantidad}</span>
            <span>Precio unitario: ${producto.precio.toFixed(2)} U$S</span>
            <span>Total: ${(producto.precio * item.cantidad).toFixed(2)} U$S</span>
            <button class="btn btn-warning btn-sm" onclick="decrementarCantidad(${item.id})">-1</button>
            <button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${item.id})">Eliminar</button>
        `;
        carritoContainer.appendChild(div);
    });

    const total = calcularPrecioTotal();
    document.getElementById('total-a-pagar').textContent = `Total a pagar: ${total.toFixed(2)} U$S`;
}

function decrementarCantidad(idDelProducto) {
    const item = carrito.find(item => item.id === idDelProducto);
    if (item) {
        if (item.cantidad > 1) {
            item.cantidad -= 1;
            const producto = inventario.find(p => p.id === idDelProducto);
            producto.stock += 1;
            actualizarCarrito();
        } else {
            eliminarDelCarrito(idDelProducto);
        }
    }
}

function eliminarDelCarrito(idDelProducto) {
    const index = carrito.findIndex(item => item.id === idDelProducto);
    if (index !== -1) {
        carrito.splice(index, 1);
        const producto = inventario.find(p => p.id === idDelProducto);
        if (producto) {
            producto.stock += 1;
        }
        actualizarCarrito();
    }
}

function calcularPrecioTotal() {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

function cargarProductos() {
    fetch('productos.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => inventario.push(new Producto(item.nombre, item.precio, item.stock, item.imgSrc)));
            mostrarInventario();
            actualizarCarrito();
        })
        .catch(error => console.error('Error al cargar los productos:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});

// evento para el boton de compra 

document.getElementById('comprar-btn').addEventListener('click', () => {
    const formularioCompra = document.getElementById('formulario-compra');

    if (!formularioCompra) {
        console.error('El formulario de compra no se encontró.');
        return;
    }

    if (carrito.length === 0) {
        mostrarSweetAlert('Error', 'Tu carrito está vacío. Añade productos antes de comprar.', 'error');
    } else {
        formularioCompra.style.display = 'block';
        setTimeout(() => {
            formularioCompra.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});


document.getElementById('cancelar-compra').addEventListener('click', () => {
    document.getElementById('formulario-compra').style.display = 'none';
});

// evento para enviar el formulario de compra 

document.getElementById('checkout-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const nombre = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const direccion = document.getElementById('address').value;

    document.getElementById('formulario-compra').style.display = 'none';

    mostrarSweetAlert('Éxito', `Gracias por tu compra, ${nombre}! Tu pedido será enviado a ${direccion}.`, 'success');

    carrito.length = 0;
    actualizarCarrito();
    document.getElementById('formulario-compra').style.display = 'none';
});

