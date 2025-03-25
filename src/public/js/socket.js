const socket = io();

    document.addEventListener("DOMContentLoaded", async () => {
        const lista = document.getElementById("listaProductos");

        try {
            const res = await fetch("/api/products");
            const productos = await res.json();

            if (productos.length === 0) {
                lista.innerHTML = "<li>No hay productos disponibles.</li>";
            } else {
                productos.forEach(producto => agregarProductoDOM(producto));
            }
        } catch (error) {
            console.error("Error al cargar productos existentes:", error);
        }

        document.getElementById("formProducto").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const title = document.getElementById("title").value.trim();
            const description = document.getElementById("description").value.trim();
            const code = document.getElementById("code").value.trim();
            const price = parseFloat(document.getElementById("price").value);
            const stock = parseInt(document.getElementById("stock").value);
            const category = document.getElementById("category").value.trim();

            if (!title || !description || !code || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 || !category || category.length < 4) {
                alert("Todos los campos son obligatorios y deben ser válidos.");
                return;
            }

            const newProduct = { title, description, code, price, stock, category };

            try {
                const res = await fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newProduct)
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(`Error: ${data.error}`);
                    return;
                }

                console.log("Producto agregado correctamente:", data);
                socket.emit("nuevoProducto", data);

            } catch (error) {
                console.error("Error al agregar el producto:", error);
                alert("Hubo un error al agregar el producto.");
            }
        });

        socket.on("actualizarProductos", (producto) => {
            if (!producto || !producto.id) {
                console.error("Producto recibido sin ID:", producto);
                return;
            }
            agregarProductoDOM(producto);
        });

        socket.on("productoEliminado", (productId) => {
            const item = document.getElementById(`producto-${productId}`);
            if (item) {
                item.remove();
            }
        });
    });

    function agregarProductoDOM(producto) {
        const lista = document.getElementById("listaProductos");
        const item = document.createElement("li");
        item.setAttribute("id", `producto-${producto.id}`);
        item.innerHTML = `
            <strong>${producto.title}</strong> - $${producto.price} 
            <button onclick="eliminarProducto('${producto.id}')">Borrar</button>`;
        lista.appendChild(item);
    }

    function eliminarProducto(id) {
        fetch(`/api/products/${id}`, { method: "DELETE" })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    alert(`Error: ${data.error || "No se pudo eliminar el producto"}`);
                    return;
                }
                socket.emit("eliminarProducto", id);
            })
            .catch(error => console.error("Error al eliminar producto:", error));
    }