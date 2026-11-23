/* =====================================================
   TRUEQUE
   Sistema de publicaciones, usuarios y solicitudes
   Conectado a Firebase (SDK 13.2.0) con Verificación de Correo
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-analytics.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

/* =====================================================
   0. TU CONFIGURACIÓN DE FIREBASE
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAf8alfCqV4qJWsTNy5Cb_xP1IbDuXYAUQ",
    authDomain: "proyecto-trueque-85a3c.firebaseapp.com",
    projectId: "proyecto-trueque-85a3c",
    storageBucket: "proyecto-trueque-85a3c.firebasestorage.app",
    messagingSenderId: "460570073138",
    appId: "1:460570073138:web:1593e98b1295eb6c03042b",
    measurementId: "G-Y8K2MKLTY6"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
auth.languageCode = "es"; // Asegura que los correos salgan en español


/* =====================================================
   1. ELEMENTOS DEL HTML
===================================================== */

const formularioPublicacion = document.querySelector("#formulario-publicacion");
const campoNombre = document.querySelector("#nombre");
const campoCategoria = document.querySelector("#categoria");
const campoTipo = document.querySelector("#tipo");
const campoDescripcion = document.querySelector("#descripcion");
const campoImagen = document.querySelector("#imagen-producto");

const botonPublicar = document.querySelector("#boton-publicar");
const botonCancelarEdicion = document.querySelector("#cancelar-edicion");
const tituloFormulario = document.querySelector("#titulo-formulario-publicacion");
const mensajePublicacion = document.querySelector("#mensaje-publicacion");

const vistaPrevia = document.querySelector("#vista-previa-imagen");
const imagenSeleccionada = document.querySelector("#imagen-seleccionada");

const contenedorProductos = document.querySelector("#contenedor-productos");
const mensajeProductos = document.querySelector("#mensaje-productos");

const buscarProducto = document.querySelector("#buscar-producto");
const filtroCategoria = document.querySelector("#filtro-categoria");
const filtroTipo = document.querySelector("#filtro-tipo");
const filtroEstado = document.querySelector("#filtro-estado");

const formularioRegistro = document.querySelector("#formulario-registro");
const formularioLogin = document.querySelector("#formulario-login");
const mensajeRegistro = document.querySelector("#mensaje-registro");
const mensajeLogin = document.querySelector("#mensaje-login");
const botonRecuperar = document.querySelector("#boton-recuperar");

const panelAcceso = document.querySelector("#panel-acceso");
const panelPerfil = document.querySelector("#panel-perfil");
const perfilNombre = document.querySelector("#perfil-nombre");
const perfilEmail = document.querySelector("#perfil-email");
const botonCerrarSesion = document.querySelector("#cerrar-sesion");
const misProductos = document.querySelector("#mis-productos");

const contenedorSolicitudes = document.querySelector("#contenedor-solicitudes");

// Elementos del Modal de Cuenta y botones del Header
const modalCuenta = document.querySelector("#modal-cuenta");
const botonCerrarModal = document.querySelector("#cerrar-modal-cuenta");
const botonesInvitado = document.querySelector("#botones-invitado");
const btnAbrirLogin = document.querySelector("#btn-abrir-login");
const btnAbrirRegistro = document.querySelector("#btn-abrir-registro");
const btnAbrirPerfil = document.querySelector("#btn-abrir-perfil");
const tabLogin = document.querySelector("#tab-login");
const tabRegistro = document.querySelector("#tab-registro");

// Elementos del Modal de Enviar Solicitud
const modalSolicitud = document.querySelector("#modal-solicitud");
const btnCerrarModalSolicitud = document.querySelector("#cerrar-modal-solicitud");
const btnCancelarSolicitudModal = document.querySelector("#btn-cancelar-solicitud-modal");
const formularioSolicitud = document.querySelector("#formulario-solicitud");
const subtituloProductoSolicitud = document.querySelector("#subtitulo-producto-solicitud");
const campoSolicitudMensaje = document.querySelector("#solicitud-mensaje");
const campoSolicitudWhatsapp = document.querySelector("#solicitud-whatsapp");
const checkRecordarWhatsapp = document.querySelector("#recordar-whatsapp");
const mensajeSolicitudModal = document.querySelector("#mensaje-solicitud-modal");

// Elementos del Modal de Aceptar Solicitud (WhatsApp del propietario)
const modalAceptarSolicitud = document.querySelector("#modal-aceptar-solicitud");
const btnCerrarModalAceptar = document.querySelector("#cerrar-modal-aceptar");
const btnCancelarAceptarModal = document.querySelector("#btn-cancelar-aceptar-modal");
const formularioAceptarSolicitud = document.querySelector("#formulario-aceptar-solicitud");
const subtituloAceptarSolicitud = document.querySelector("#subtitulo-aceptar-solicitud");
const campoAceptarWhatsapp = document.querySelector("#aceptar-whatsapp");
const checkRecordarWhatsappAceptar = document.querySelector("#recordar-whatsapp-aceptar");
const mensajeAceptarModal = document.querySelector("#mensaje-aceptar-modal");

// Elementos del Modal de Detalle de Producto
const modalDetalleProducto = document.querySelector("#modal-detalle-producto");
const btnCerrarModalDetalle = document.querySelector("#cerrar-modal-detalle");
const detalleImagen = document.querySelector("#detalle-imagen");
const detalleCategoria = document.querySelector("#detalle-categoria");
const detalleTipo = document.querySelector("#detalle-tipo");
const detalleEstado = document.querySelector("#detalle-estado");
const detalleTitulo = document.querySelector("#detalle-titulo");
const detalleDescripcion = document.querySelector("#detalle-descripcion");
const detallePropietario = document.querySelector("#detalle-propietario");
const detalleFecha = document.querySelector("#detalle-fecha");
const detalleAcciones = document.querySelector("#detalle-acciones");


/* =====================================================
   2. VARIABLES PRINCIPALES
===================================================== */

const CLAVE_WHATSAPP_GUARDADO = "trueque_whatsapp_solicitud";

let productos = [];
let solicitudes = [];
let sesionActual = null;
let productoEnEdicion = null;
let imagenTemporal = null;
let productoParaSolicitar = null;
let solicitudParaAceptar = null;


/* =====================================================
   3. ESCUCHA EN TIEMPO REAL (FIRESTORE Y AUTH)
===================================================== */

onSnapshot(collection(db, "productos"), (snapshot) => {
    productos = snapshot.docs.map(documento => ({
        id: documento.id,
        ...documento.data()
    }));
    productos.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    mostrarProductos();
    mostrarMisProductos();
}, (error) => {
    console.error("Error al leer productos:", error);
});

onSnapshot(collection(db, "solicitudes"), (snapshot) => {
    solicitudes = snapshot.docs.map(documento => ({
        id: documento.id,
        ...documento.data()
    }));
    solicitudes.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    mostrarSolicitudes();
}, (error) => {
    console.error("Error al leer solicitudes:", error);
});

onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
        const nombreGuardado = user.displayName || user.email.split("@")[0];

        sesionActual = {
            id: user.uid,
            nombre: nombreGuardado,
            email: user.email
        };

        try {
            await setDoc(doc(db, "usuarios", user.uid), {
                id: user.uid,
                nombre: nombreGuardado,
                email: user.email,
                emailVerificado: true,
                ultimaConexion: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error al sincronizar usuario en Firestore:", error);
        }
    } else {
        sesionActual = null;
    }
    actualizarInterfazUsuario();
});


/* =====================================================
   4. FUNCIONES AUXILIARES E IMÁGENES
===================================================== */

const imagenesCategorias = {
    ropa: "img/ropa.jpg",
    libros: "img/libros.jpg",
    alimentos: "img/alimentos.jpg",
    tecnologia: "img/tecnologia.jpg",
    muebles: "img/muebles_hogar.jpg",
    deportes: "img/deportes.jpg",
    ocio: "img/ocio.jpg",
    cuidado_personal: "img/cuidado_personal.jpg"
};

function obtenerImagen(producto) {
    return producto.imagen || imagenesCategorias[producto.categoria] || "img/portada.jpg";
}

function obtenerTextoCategoria(categoria) {
    const categorias = {
        ropa: "Ropa",
        libros: "Libros",
        alimentos: "Alimentos",
        tecnologia: "Tecnología",
        muebles: "Muebles y Hogar",
        deportes: "Deportes",
        ocio: "Ocio",
        cuidado_personal: "Cuidado Personal"
    };
    return categorias[categoria] || "Sin categoría";
}

function obtenerTextoTipo(tipo) {
    const tipos = { donacion: "Donación", intercambio: "Intercambio" };
    return tipos[tipo] || "Sin especificar";
}

function obtenerTextoEstado(estado) {
    const estados = { disponible: "Disponible", reservado: "Reservado", entregado: "Entregado" };
    return estados[estado] || "Disponible";
}

function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function obtenerFecha(fecha) {
    if (!fecha) return "Fecha no disponible";
    return new Date(fecha).toLocaleDateString("es-PE");
}

function normalizarWhatsappPeru(valor) {
    const soloDigitos = (valor || "").replace(/\D/g, "");
    if (!soloDigitos) return "";
    if (soloDigitos.startsWith("51") && soloDigitos.length >= 11) {
        return soloDigitos;
    }
    if (soloDigitos.length === 9) {
        return "51" + soloDigitos;
    }
    return soloDigitos;
}

function actualizarScrollBody() {
    const algunModalAbierto =
        (modalCuenta && !modalCuenta.hidden) ||
        (modalSolicitud && !modalSolicitud.hidden) ||
        (modalAceptarSolicitud && !modalAceptarSolicitud.hidden) ||
        (modalDetalleProducto && !modalDetalleProducto.hidden);

    document.body.style.overflow = algunModalAbierto ? "hidden" : "";
}

function mostrarMensaje(elemento, texto, tipo = "correcto", duracion = 3000) {
    if (!elemento) return;

    if (elemento.temporizador) {
        clearTimeout(elemento.temporizador);
    }

    elemento.textContent = "";
    elemento.classList.remove("mensaje-animado");
    void elemento.offsetWidth;

    elemento.textContent = texto;
    elemento.style.color = tipo === "error" ? "#c65d49" : "#159b83";
    elemento.classList.add("mensaje-animado");

    if (duracion > 0) {
        elemento.temporizador = setTimeout(() => {
            elemento.textContent = "";
            elemento.classList.remove("mensaje-animado");
        }, duracion);
    }
}

// Activar el ojito para mostrar/ocultar contraseña
const svgOjoAbierto = `
    <svg class="icono-ojo" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>`;

const svgOjoCerrado = `
    <svg class="icono-ojo" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>`;

document.querySelectorAll(".btn-ver-password").forEach(boton => {
    boton.addEventListener("click", function () {
        const input = document.getElementById(this.dataset.target);
        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            this.innerHTML = svgOjoCerrado;
            this.setAttribute("aria-label", "Ocultar contraseña");
        } else {
            input.type = "password";
            this.innerHTML = svgOjoAbierto;
            this.setAttribute("aria-label", "Mostrar contraseña");
        }
    });
});

document.querySelectorAll("#formulario-login input").forEach(input => {
    input.addEventListener("input", () => {
        if (mensajeLogin) mensajeLogin.textContent = "";
    });
});


/* =====================================================
   5. VISTA PREVIA DE LA FOTOGRAFÍA
===================================================== */

campoImagen.addEventListener("change", function () {
    const archivo = campoImagen.files[0];
    imagenTemporal = null;

    if (!archivo) {
        vistaPrevia.hidden = true;
        imagenSeleccionada.src = "";
        return;
    }

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!formatosPermitidos.includes(archivo.type)) {
        mostrarMensaje(mensajePublicacion, "Selecciona una imagen JPG, PNG o WEBP.", "error");
        campoImagen.value = "";
        vistaPrevia.hidden = true;
        return;
    }

    if (archivo.size > 700 * 1024) {
        mostrarMensaje(mensajePublicacion, "La imagen supera el tamaño máximo de 700 KB.", "error");
        campoImagen.value = "";
        vistaPrevia.hidden = true;
        return;
    }

    const lector = new FileReader();
    lector.onload = function (evento) {
        imagenTemporal = evento.target.result;
        imagenSeleccionada.src = imagenTemporal;
        vistaPrevia.hidden = false;
    };
    lector.onerror = function () {
        mostrarMensaje(mensajePublicacion, "No se pudo leer la fotografía.", "error");
    };
    lector.readAsDataURL(archivo);
});


/* =====================================================
   6. CREAR TARJETA, DETALLE Y MOSTRAR PRODUCTOS
===================================================== */

function abrirModalDetalleProducto(producto) {
    if (!modalDetalleProducto) return;

    detalleImagen.src = obtenerImagen(producto);
    detalleImagen.alt = producto.nombre || "Producto publicado";
    detalleImagen.onerror = function () {
        detalleImagen.src = imagenesCategorias[producto.categoria] || "img/portada.jpg";
    };

    detalleCategoria.textContent = obtenerTextoCategoria(producto.categoria);

    detalleTipo.textContent = obtenerTextoTipo(producto.tipo);
    detalleTipo.className = "tipo-publicacion" + (producto.tipo === "intercambio" ? " intercambio" : "");

    const estadoActual = producto.estado || "disponible";
    detalleEstado.textContent = obtenerTextoEstado(estadoActual);
    detalleEstado.className = "estado-producto " + estadoActual;

    detalleTitulo.textContent = producto.nombre || "Producto sin nombre";
    detalleDescripcion.textContent = producto.descripcion || "Sin descripción.";
    detallePropietario.textContent = "Publicado por: " + (producto.usuarioNombre || "Usuario");
    detalleFecha.textContent = "Fecha: " + obtenerFecha(producto.fecha);

    detalleAcciones.innerHTML = "";
    const esPropietario = sesionActual && producto.usuarioId === sesionActual.id;

    if (!esPropietario && sesionActual && estadoActual === "disponible" && producto.usuarioId) {
        const botonInteres = crearElemento("button", "boton-principal", "Me interesa");
        botonInteres.type = "button";
        botonInteres.addEventListener("click", () => {
            cerrarModalDetalleProducto();
            abrirModalSolicitud(producto);
        });
        detalleAcciones.appendChild(botonInteres);
    } else if (!sesionActual && producto.usuarioId) {
        const botonAcceder = crearElemento("button", "boton-secundario", "Inicia sesión para contactar");
        botonAcceder.type = "button";
        botonAcceder.addEventListener("click", () => {
            cerrarModalDetalleProducto();
            abrirModalCuenta("login");
        });
        detalleAcciones.appendChild(botonAcceder);
    }

    modalDetalleProducto.hidden = false;
    actualizarScrollBody();
}

function cerrarModalDetalleProducto() {
    if (!modalDetalleProducto) return;
    modalDetalleProducto.hidden = true;
    actualizarScrollBody();
}

btnCerrarModalDetalle?.addEventListener("click", cerrarModalDetalleProducto);
modalDetalleProducto?.addEventListener("click", (evento) => {
    if (evento.target === modalDetalleProducto) cerrarModalDetalleProducto();
});

function crearTarjeta(producto, mostrarAccionesPropietario = true) {
    const tarjeta = crearElemento("article", "tarjeta-producto");
    tarjeta.title = "Haz clic para ver el detalle completo";
    tarjeta.addEventListener("click", (evento) => {
        if (evento.target.closest("button")) return;
        abrirModalDetalleProducto(producto);
    });

    const contenedorImagen = crearElemento("div", "imagen-producto");

    const imagen = crearElemento("img");
    imagen.src = obtenerImagen(producto);
    imagen.alt = producto.nombre || "Producto publicado";
    imagen.loading = "lazy";
    imagen.onerror = function () {
        imagen.src = imagenesCategorias[producto.categoria] || "img/portada.jpg";
    };

    contenedorImagen.appendChild(imagen);

    const informacion = crearElemento("div", "informacion-producto");
    const categoria = crearElemento("span", "categoria-producto", obtenerTextoCategoria(producto.categoria));
    const titulo = crearElemento("h3", "", producto.nombre || "Producto sin nombre");
    const descripcion = crearElemento("p", "", producto.descripcion || "Sin descripción.");
    const tipo = crearElemento("span", "tipo-publicacion", obtenerTextoTipo(producto.tipo));

    if (producto.tipo === "intercambio") {
        tipo.classList.add("intercambio");
    }

    const estado = crearElemento("span", "estado-producto " + (producto.estado || "disponible"), obtenerTextoEstado(producto.estado));
    const propietario = crearElemento("p", "", "Publicado por: " + (producto.usuarioNombre || "Usuario"));
    const fecha = crearElemento("small", "", "Fecha: " + obtenerFecha(producto.fecha));

    informacion.append(categoria, titulo, descripcion, tipo, estado, propietario, fecha);

    const acciones = crearElemento("div", "acciones-producto");
    const esPropietario = sesionActual && producto.usuarioId === sesionActual.id;

    if (esPropietario && mostrarAccionesPropietario) {
        const botonEditar = crearElemento("button", "boton-editar", "Editar");
        botonEditar.type = "button";
        botonEditar.addEventListener("click", () => editarProducto(producto.id));

        const botonEliminar = crearElemento("button", "boton-eliminar", "Eliminar");
        botonEliminar.type = "button";
        botonEliminar.addEventListener("click", () => eliminarProducto(producto.id));

        const botonEstado = crearElemento("button", "boton-estado", "Cambiar estado");
        botonEstado.type = "button";
        botonEstado.addEventListener("click", () => cambiarEstadoProducto(producto.id));

        acciones.append(botonEditar, botonEliminar, botonEstado);

    } else if (sesionActual && producto.usuarioId !== sesionActual.id && producto.estado === "disponible" && producto.usuarioId) {
        const botonInteres = crearElemento("button", "boton-secundario", "Me interesa");
        botonInteres.type = "button";
        botonInteres.addEventListener("click", () => abrirModalSolicitud(producto));
        acciones.appendChild(botonInteres);

    } else if (!sesionActual && producto.usuarioId) {
        const botonAcceder = crearElemento("button", "boton-secundario", "Inicia sesión para contactar");
        botonAcceder.type = "button";
        botonAcceder.addEventListener("click", () => abrirModalCuenta("login"));
        acciones.appendChild(botonAcceder);
    }

    informacion.appendChild(acciones);
    tarjeta.append(contenedorImagen, informacion);
    return tarjeta;
}

function mostrarProductos() {
    contenedorProductos.innerHTML = "";

    const textoBusqueda = buscarProducto.value.trim().toLowerCase();
    const categoriaSeleccionada = filtroCategoria.value;
    const tipoSeleccionado = filtroTipo.value;
    const estadoSeleccionado = filtroEstado.value;

    const productosFiltrados = productos.filter(function (producto) {
        const coincideNombre = (producto.nombre || "").toLowerCase().includes(textoBusqueda);
        const coincideCategoria = !categoriaSeleccionada || producto.categoria === categoriaSeleccionada;
        const coincideTipo = !tipoSeleccionado || producto.tipo === tipoSeleccionado;
        const estadoProducto = producto.estado || "disponible";
        const coincideEstado = !estadoSeleccionado || estadoProducto === estadoSeleccionado;
        return coincideNombre && coincideCategoria && coincideTipo && coincideEstado;
    });

    if (productosFiltrados.length === 0) {
        mensajeProductos.textContent = "No se encontraron productos con esos criterios.";
        return;
    }

    mensajeProductos.textContent = "Se encontraron " + productosFiltrados.length + " producto(s).";
    productosFiltrados.forEach(producto => {
        contenedorProductos.appendChild(crearTarjeta(producto));
    });
}

buscarProducto.addEventListener("input", mostrarProductos);
filtroCategoria.addEventListener("change", mostrarProductos);
filtroTipo.addEventListener("change", mostrarProductos);
filtroEstado.addEventListener("change", mostrarProductos);


/* =====================================================
   7. PUBLICAR, EDITAR Y ELIMINAR PRODUCTOS
===================================================== */

formularioPublicacion.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    if (!sesionActual) {
        mostrarMensaje(mensajePublicacion, "Primero debes iniciar sesión para publicar.", "error");
        abrirModalCuenta("login");
        return;
    }

    const nombre = campoNombre.value.trim();
    const categoria = campoCategoria.value;
    const tipo = campoTipo.value;
    const descripcion = campoDescripcion.value.trim();

    if (nombre.length < 3 || nombre.length > 70) {
        mostrarMensaje(mensajePublicacion, "El nombre debe tener entre 3 y 70 caracteres.", "error");
        return;
    }

    if (!categoria || !tipo) {
        mostrarMensaje(mensajePublicacion, "Selecciona una categoría y un tipo de publicación.", "error");
        return;
    }

    if (descripcion.length < 10 || descripcion.length > 400) {
        mostrarMensaje(mensajePublicacion, "La descripción debe tener entre 10 y 400 caracteres.", "error");
        return;
    }

    if (categoria === "alimentos") {
        const confirmarAlimentos = confirm(
            "Confirma que el alimento está cerrado, no es perecible y se encuentra dentro de su fecha de vencimiento."
        );
        if (!confirmarAlimentos) return;
    }

    try {
        if (productoEnEdicion) {
            const productoAnterior = productos.find(p => p.id === productoEnEdicion);
            if (!productoAnterior) {
                mostrarMensaje(mensajePublicacion, "No se encontró la publicación que deseas editar.", "error");
                return;
            }
            if (productoAnterior.usuarioId !== sesionActual.id) {
                mostrarMensaje(mensajePublicacion, "No puedes editar una publicación de otro usuario.", "error");
                return;
            }

            await updateDoc(doc(db, "productos", productoEnEdicion), {
                nombre: nombre,
                categoria: categoria,
                tipo: tipo,
                descripcion: descripcion,
                estado: productoAnterior.estado || "disponible",
                imagen: imagenTemporal || productoAnterior.imagen || imagenesCategorias[productoAnterior.categoria]
            });

            mostrarMensaje(mensajePublicacion, "¡Tu publicación se actualizó correctamente!");

        } else {
            if (!imagenTemporal) {
                mostrarMensaje(mensajePublicacion, "Selecciona una fotografía de tu producto antes de publicar.", "error");
                return;
            }

            await addDoc(collection(db, "productos"), {
                usuarioId: sesionActual.id,
                usuarioNombre: sesionActual.nombre,
                nombre: nombre,
                categoria: categoria,
                tipo: tipo,
                descripcion: descripcion,
                estado: "disponible",
                imagen: imagenTemporal,
                fecha: new Date().toISOString()
            });

            mostrarMensaje(mensajePublicacion, "¡Tu producto se publicó correctamente!");
        }

        limpiarFormularioPublicacion();
        document.querySelector("#productos").scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        console.error("Error al guardar producto:", error);
        mostrarMensaje(mensajePublicacion, "No se pudo guardar. Verifica que Firestore esté activo.", "error");
    }
});

function limpiarFormularioPublicacion() {
    formularioPublicacion.reset();
    productoEnEdicion = null;
    imagenTemporal = null;
    vistaPrevia.hidden = true;
    imagenSeleccionada.src = "";
    botonPublicar.textContent = "Publicar producto →";
    tituloFormulario.textContent = "Publica tu producto";
    botonCancelarEdicion.hidden = true;
}

function editarProducto(id) {
    if (!sesionActual) return;
    const producto = productos.find(elemento => elemento.id === id);
    if (!producto) return;

    if (producto.usuarioId !== sesionActual.id) {
        alert("No puedes editar una publicación de otro usuario.");
        return;
    }

    productoEnEdicion = id;
    campoNombre.value = producto.nombre;
    campoCategoria.value = producto.categoria;
    campoTipo.value = producto.tipo;
    campoDescripcion.value = producto.descripcion;
    imagenTemporal = null;

    if (producto.imagen) {
        imagenSeleccionada.src = producto.imagen;
        vistaPrevia.hidden = false;
    } else {
        vistaPrevia.hidden = true;
    }

    tituloFormulario.textContent = "Editar publicación";
    botonPublicar.textContent = "Guardar cambios →";
    botonCancelarEdicion.hidden = false;

    mostrarMensaje(
        mensajePublicacion,
        "Estás editando tu publicación. Si deseas cambiar la fotografía, selecciona otra."
    );
    cerrarModalCuenta();
    document.querySelector("#publicar").scrollIntoView({ behavior: "smooth" });
}

botonCancelarEdicion.addEventListener("click", function () {
    limpiarFormularioPublicacion();
    mostrarMensaje(mensajePublicacion, "Edición cancelada.");
});

async function eliminarProducto(id) {
    if (!sesionActual) return;
    const producto = productos.find(elemento => elemento.id === id);

    if (!producto || producto.usuarioId !== sesionActual.id) {
        alert("No tienes permiso para eliminar esta publicación.");
        return;
    }

    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

    try {
        await deleteDoc(doc(db, "productos", id));
        const relacionadas = solicitudes.filter(s => s.productoId === id);
        for (const sol of relacionadas) {
            await deleteDoc(doc(db, "solicitudes", sol.id));
        }
        alert("La publicación fue eliminada.");
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo completar la eliminación.");
    }
}

async function cambiarEstadoProducto(id) {
    if (!sesionActual) return;
    const producto = productos.find(elemento => elemento.id === id);

    if (!producto || producto.usuarioId !== sesionActual.id) {
        alert("No puedes cambiar el estado de este producto.");
        return;
    }

    const estados = ["disponible", "reservado", "entregado"];
    const estadoActual = producto.estado || "disponible";
    const siguienteIndice = (estados.indexOf(estadoActual) + 1) % estados.length;
    const estadoNuevo = estados[siguienteIndice];

    if (!confirm("¿Deseas cambiar el estado a: " + obtenerTextoEstado(estadoNuevo) + "?")) return;

    try {
        await updateDoc(doc(db, "productos", id), { estado: estadoNuevo });
    } catch (error) {
        console.error("Error al cambiar estado:", error);
        alert("No se pudo guardar el nuevo estado.");
    }
}


/* =====================================================
   8. REGISTRO, VERIFICACIÓN DE CORREO, LOGIN Y MODAL
===================================================== */

function abrirModalCuenta(modo = "login") {
    if (!modalCuenta) return;
    modalCuenta.hidden = false;
    actualizarScrollBody();

    if (!sesionActual) {
        if (modo === "registro") {
            formularioLogin.hidden = true;
            formularioRegistro.hidden = false;
            tabLogin?.classList.remove("activo");
            tabRegistro?.classList.add("activo");
        } else {
            formularioLogin.hidden = false;
            formularioRegistro.hidden = true;
            tabLogin?.classList.add("activo");
            tabRegistro?.classList.remove("activo");
        }
    }
}

function cerrarModalCuenta() {
    if (!modalCuenta) return;
    modalCuenta.hidden = true;
    actualizarScrollBody();
}

btnAbrirLogin?.addEventListener("click", () => abrirModalCuenta("login"));
btnAbrirRegistro?.addEventListener("click", () => abrirModalCuenta("registro"));
btnAbrirPerfil?.addEventListener("click", () => abrirModalCuenta("perfil"));
botonCerrarModal?.addEventListener("click", cerrarModalCuenta);

tabLogin?.addEventListener("click", () => abrirModalCuenta("login"));
tabRegistro?.addEventListener("click", () => abrirModalCuenta("registro"));

modalCuenta?.addEventListener("click", (evento) => {
    if (evento.target === modalCuenta) cerrarModalCuenta();
});

document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    if (modalDetalleProducto && !modalDetalleProducto.hidden) cerrarModalDetalleProducto();
    if (modalSolicitud && !modalSolicitud.hidden) cerrarModalSolicitud();
    if (modalAceptarSolicitud && !modalAceptarSolicitud.hidden) cerrarModalAceptar();
    if (modalCuenta && !modalCuenta.hidden) cerrarModalCuenta();
});

formularioRegistro.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const nombre = document.querySelector("#registro-nombre").value.trim();
    const email = document.querySelector("#registro-email").value.trim().toLowerCase();
    const password = document.querySelector("#registro-password").value;
    const botonRegistro = formularioRegistro.querySelector('button[type="submit"]');

    if (nombre.length < 3) {
        mostrarMensaje(mensajeRegistro, "Escribe un nombre de al menos 3 caracteres.", "error");
        return;
    }

    if (password.length < 6) {
        mostrarMensaje(mensajeRegistro, "La contraseña debe tener al menos 6 caracteres.", "error");
        return;
    }

    // Feedback inmediato para evitar sensación de demora
    if (botonRegistro) {
        botonRegistro.disabled = true;
        botonRegistro.textContent = "Creando cuenta...";
    }
    mostrarMensaje(mensajeRegistro, "Creando cuenta y enviando correo de verificación...", "correcto", 0);

    try {
        const credenciales = await createUserWithEmailAndPassword(auth, email, password);
        const user = credenciales.user;

        await updateProfile(user, { displayName: nombre });

        await setDoc(doc(db, "usuarios", user.uid), {
            id: user.uid,
            nombre: nombre,
            email: email,
            emailVerificado: false,
            fechaRegistro: new Date().toISOString()
        });

        await sendEmailVerification(user);
        await signOut(auth);

        formularioRegistro.reset();
        mostrarMensaje(
            mensajeRegistro,
            `¡Cuenta creada! Mandamos la verificación al correo ${email} (revisa también Spam). Confírmalo antes de iniciar sesión.`,
            "correcto",
            8000
        );

    } catch (error) {
        console.error("Error en registro:", error);
        let msg = "No se pudo registrar: " + error.message;
        if (error.code === "auth/email-already-in-use") msg = "Este correo ya está registrado.";
        if (error.code === "auth/invalid-email") msg = "Correo electrónico no válido.";
        mostrarMensaje(mensajeRegistro, msg, "error");
    } finally {
        if (botonRegistro) {
            botonRegistro.disabled = false;
            botonRegistro.textContent = "Registrarme";
        }
    }
});

formularioLogin.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const email = document.querySelector("#login-email").value.trim().toLowerCase();
    const password = document.querySelector("#login-password").value;

    if (!password) {
        mostrarMensaje(mensajeLogin, "Escribe tu contraseña para iniciar sesión.", "error");
        return;
    }

    try {
        const credenciales = await signInWithEmailAndPassword(auth, email, password);
        const user = credenciales.user;

        if (!user.emailVerified) {
            const reenviar = confirm(
                "Aún no has verificado tu correo electrónico.\n\n¿Deseas que te enviemos un nuevo enlace de verificación a " + email + "?"
            );
            if (reenviar) {
                await sendEmailVerification(user);
            }
            await signOut(auth);
            mostrarMensaje(
                mensajeLogin,
                `Mandamos la verificación al correo ${email}. Revisa tu bandeja de entrada o Spam para activar tu cuenta.`,
                "error",
                6000
            );
            return;
        }

        await setDoc(doc(db, "usuarios", user.uid), {
            id: user.uid,
            nombre: user.displayName || email.split("@")[0],
            email: email,
            emailVerificado: true,
            ultimaConexion: new Date().toISOString()
        }, { merge: true });

        sesionActual = {
            id: user.uid,
            nombre: user.displayName || email.split("@")[0],
            email: user.email
        };

        formularioLogin.reset();
        mostrarMensaje(mensajeLogin, "¡Bienvenido/a a TRUEQUE!");
        actualizarInterfazUsuario();

    } catch (error) {
        console.error("Error en login:", error);
        mostrarMensaje(mensajeLogin, "Correo o contraseña incorrectos.", "error");
    }
});

if (botonRecuperar) {
    botonRecuperar.addEventListener("click", async function () {
        const email = document.querySelector("#login-email").value.trim().toLowerCase();
        if (!email) {
            mostrarMensaje(mensajeLogin, "Escribe tu correo arriba para enviarte el enlace de recuperación.", "error");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            mostrarMensaje(mensajeLogin, `Te enviamos un correo a ${email} para cambiar tu contraseña (revisa Spam).`, "correcto", 5000);
        } catch (error) {
            console.error("Error al recuperar contraseña:", error);
            mostrarMensaje(mensajeLogin, "No se pudo enviar el correo de recuperación.", "error");
        }
    });
}

botonCerrarSesion.addEventListener("click", async function () {
    if (!confirm("¿Deseas cerrar tu sesión?")) return;
    await signOut(auth);
    productoEnEdicion = null;
    limpiarFormularioPublicacion();
    cerrarModalCuenta();
});

function actualizarInterfazUsuario() {
    if (sesionActual) {
        panelAcceso.hidden = true;
        panelPerfil.hidden = false;
        perfilNombre.textContent = "Nombre: " + sesionActual.nombre;
        perfilEmail.textContent = "Correo: " + sesionActual.email;

        if (botonesInvitado) botonesInvitado.hidden = true;
        if (btnAbrirPerfil) {
            btnAbrirPerfil.hidden = false;
            btnAbrirPerfil.textContent = "👤 " + sesionActual.nombre.split(" ")[0];
        }
    } else {
        panelAcceso.hidden = false;
        panelPerfil.hidden = true;
        perfilNombre.textContent = "";
        perfilEmail.textContent = "";

        if (botonesInvitado) botonesInvitado.hidden = false;
        if (btnAbrirPerfil) btnAbrirPerfil.hidden = true;
    }

    mostrarProductos();
    mostrarMisProductos();
    mostrarSolicitudes();
}

function mostrarMisProductos() {
    misProductos.innerHTML = "";
    if (!sesionActual) return;

    const misPublicaciones = productos.filter(producto => producto.usuarioId === sesionActual.id);

    if (misPublicaciones.length === 0) {
        misProductos.appendChild(crearElemento("p", "mensaje-vacio", "Todavía no tienes publicaciones."));
        return;
    }

    misPublicaciones.forEach(producto => {
        misProductos.appendChild(crearTarjeta(producto));
    });
}


/* =====================================================
   9. SOLICITUDES EN FIRESTORE + MODALES Y WHATSAPP
===================================================== */

function abrirModalSolicitud(producto) {
    if (!sesionActual) {
        abrirModalCuenta("login");
        return;
    }
    if (producto.usuarioId === sesionActual.id) {
        mostrarMensaje(mensajeProductos, "No puedes solicitar tu propio producto.", "error");
        return;
    }
    if (producto.estado !== "disponible") {
        mostrarMensaje(mensajeProductos, "Este producto ya no está disponible.", "error");
        return;
    }

    const solicitudPendiente = solicitudes.some(solicitud =>
        solicitud.productoId === producto.id &&
        solicitud.solicitanteId === sesionActual.id &&
        solicitud.estado === "pendiente"
    );

    if (solicitudPendiente) {
        mostrarMensaje(mensajeProductos, "Ya tienes una solicitud pendiente para este producto.", "error");
        return;
    }

    productoParaSolicitar = producto;
    formularioSolicitud.reset();
    if (mensajeSolicitudModal) mensajeSolicitudModal.textContent = "";

    const numeroRecordado = localStorage.getItem(CLAVE_WHATSAPP_GUARDADO);
    if (numeroRecordado) {
        campoSolicitudWhatsapp.value = numeroRecordado;
        checkRecordarWhatsapp.checked = true;
    } else {
        campoSolicitudWhatsapp.value = "";
        checkRecordarWhatsapp.checked = false;
    }

    subtituloProductoSolicitud.textContent =
        `Producto: "${producto.nombre}" · Publicado por ${producto.usuarioNombre || "Usuario"}`;

    modalSolicitud.hidden = false;
    actualizarScrollBody();
    campoSolicitudMensaje.focus();
}

function cerrarModalSolicitud() {
    if (!modalSolicitud) return;
    modalSolicitud.hidden = true;
    productoParaSolicitar = null;
    actualizarScrollBody();
}

btnCerrarModalSolicitud?.addEventListener("click", cerrarModalSolicitud);
btnCancelarSolicitudModal?.addEventListener("click", cerrarModalSolicitud);
modalSolicitud?.addEventListener("click", (evento) => {
    if (evento.target === modalSolicitud) cerrarModalSolicitud();
});

formularioSolicitud?.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    if (!sesionActual || !productoParaSolicitar) return;

    const mensajeTexto = campoSolicitudMensaje.value.trim();
    const soloDigitos = campoSolicitudWhatsapp.value.replace(/\D/g, "");
    const whatsappNormalizado = normalizarWhatsappPeru(soloDigitos);

    if (mensajeTexto.length < 5) {
        mostrarMensaje(mensajeSolicitudModal, "Escribe un mensaje de al menos 5 caracteres.", "error");
        return;
    }

    if (soloDigitos.length < 9) {
        mostrarMensaje(mensajeSolicitudModal, "Ingresa un número de WhatsApp válido (ej. 987654321).", "error");
        return;
    }

    if (checkRecordarWhatsapp.checked) {
        localStorage.setItem(CLAVE_WHATSAPP_GUARDADO, campoSolicitudWhatsapp.value.trim());
    } else {
        localStorage.removeItem(CLAVE_WHATSAPP_GUARDADO);
    }

    try {
        await addDoc(collection(db, "solicitudes"), {
            productoId: productoParaSolicitar.id,
            productoNombre: productoParaSolicitar.nombre,
            propietarioId: productoParaSolicitar.usuarioId,
            propietarioNombre: productoParaSolicitar.usuarioNombre || "Usuario",
            solicitanteId: sesionActual.id,
            solicitanteNombre: sesionActual.nombre,
            solicitanteWhatsapp: whatsappNormalizado,
            mensaje: mensajeTexto,
            estado: "pendiente",
            fecha: new Date().toISOString()
        });

        cerrarModalSolicitud();
        mostrarMensaje(mensajeProductos, "¡Tu solicitud fue enviada correctamente!");
    } catch (error) {
        console.error("Error al enviar solicitud:", error);
        mostrarMensaje(mensajeSolicitudModal, "No se pudo enviar la solicitud.", "error");
    }
});

// Modal para que el propietario ingrese su WhatsApp al aceptar una solicitud
function abrirModalAceptar(solicitud) {
    if (!sesionActual || !modalAceptarSolicitud) return;

    const producto = productos.find(elemento => elemento.id === solicitud.productoId);
    if (!producto) {
        mostrarMensaje(mensajeProductos, "El producto ya no existe.", "error");
        return;
    }
    if (producto.estado !== "disponible") {
        mostrarMensaje(mensajeProductos, "Este producto ya no está disponible.", "error");
        return;
    }

    solicitudParaAceptar = solicitud;
    formularioAceptarSolicitud.reset();
    if (mensajeAceptarModal) mensajeAceptarModal.textContent = "";

    const numeroRecordado = localStorage.getItem(CLAVE_WHATSAPP_GUARDADO);
    if (numeroRecordado) {
        campoAceptarWhatsapp.value = numeroRecordado;
        checkRecordarWhatsappAceptar.checked = true;
    } else {
        campoAceptarWhatsapp.value = "";
        checkRecordarWhatsappAceptar.checked = false;
    }

    subtituloAceptarSolicitud.textContent =
        `Vas a aceptar la solicitud de ${solicitud.solicitanteNombre} por "${solicitud.productoNombre}".`;

    modalAceptarSolicitud.hidden = false;
    actualizarScrollBody();
    campoAceptarWhatsapp.focus();
}

function cerrarModalAceptar() {
    if (!modalAceptarSolicitud) return;
    modalAceptarSolicitud.hidden = true;
    solicitudParaAceptar = null;
    actualizarScrollBody();
}

btnCerrarModalAceptar?.addEventListener("click", cerrarModalAceptar);
btnCancelarAceptarModal?.addEventListener("click", cerrarModalAceptar);
modalAceptarSolicitud?.addEventListener("click", (evento) => {
    if (evento.target === modalAceptarSolicitud) cerrarModalAceptar();
});

formularioAceptarSolicitud?.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    if (!sesionActual || !solicitudParaAceptar) return;

    const soloDigitos = campoAceptarWhatsapp.value.replace(/\D/g, "");
    const whatsappNormalizado = normalizarWhatsappPeru(soloDigitos);

    if (soloDigitos.length < 9) {
        mostrarMensaje(mensajeAceptarModal, "Ingresa un número de WhatsApp válido (ej. 987654321).", "error");
        return;
    }

    if (checkRecordarWhatsappAceptar.checked) {
        localStorage.setItem(CLAVE_WHATSAPP_GUARDADO, campoAceptarWhatsapp.value.trim());
    } else {
        localStorage.removeItem(CLAVE_WHATSAPP_GUARDADO);
    }

    const idSolicitud = solicitudParaAceptar.id;
    cerrarModalAceptar();
    await responderSolicitud(idSolicitud, "aceptada", whatsappNormalizado);
});

function mostrarSolicitudes() {
    contenedorSolicitudes.innerHTML = "";

    if (!sesionActual) {
        contenedorSolicitudes.appendChild(
            crearElemento("p", "mensaje-vacio", "Inicia sesión para consultar tus solicitudes.")
        );
        return;
    }

    const misSolicitudes = solicitudes.filter(solicitud =>
        solicitud.propietarioId === sesionActual.id ||
        solicitud.solicitanteId === sesionActual.id
    );

    if (misSolicitudes.length === 0) {
        contenedorSolicitudes.appendChild(
            crearElemento("p", "mensaje-vacio", "Todavía no tienes solicitudes.")
        );
        return;
    }

    misSolicitudes.forEach(function (solicitud) {
        const tarjeta = crearElemento("article", "tarjeta-solicitud");
        const esPropietario = solicitud.propietarioId === sesionActual.id;

        tarjeta.append(
            crearElemento("h3", "", solicitud.productoNombre),
            crearElemento("p", "", esPropietario ? "Solicitud recibida" : "Solicitud enviada"),
            crearElemento("p", "", esPropietario
                ? "Solicitante: " + solicitud.solicitanteNombre
                : "Publicado por: " + (solicitud.propietarioNombre || "Usuario")),
            crearElemento("p", "", "Mensaje: " + solicitud.mensaje),
            crearElemento("small", "", "Fecha: " + obtenerFecha(solicitud.fecha)),
            crearElemento("span", "estado-solicitud " + solicitud.estado, "Estado: " + solicitud.estado)
        );

        const acciones = crearElemento("div", "acciones-solicitud");

        // Pendiente: propietario puede aceptar o rechazar
        if (esPropietario && solicitud.estado === "pendiente") {
            const botonAceptar = crearElemento("button", "boton-aceptar", "Aceptar");
            botonAceptar.type = "button";
            botonAceptar.addEventListener("click", () => abrirModalAceptar(solicitud));

            const botonRechazar = crearElemento("button", "boton-rechazar", "Rechazar");
            botonRechazar.type = "button";
            botonRechazar.addEventListener("click", () => responderSolicitud(solicitud.id, "rechazada"));

            acciones.append(botonAceptar, botonRechazar);
        }

        // Aceptada: WhatsApp + opción del propietario de revertir a rechazada
        if (solicitud.estado === "aceptada") {
            const numeroDestino = esPropietario
                ? solicitud.solicitanteWhatsapp
                : solicitud.propietarioWhatsapp;

            const nombreDestino = esPropietario
                ? solicitud.solicitanteNombre
                : (solicitud.propietarioNombre || "el propietario");

            if (numeroDestino) {
                const textoWhatsapp = `¡Hola ${nombreDestino}! Te escribo desde TRUEQUE para coordinar por "${solicitud.productoNombre}".`;
                const enlaceWhatsapp = crearElemento("a", "boton-whatsapp", `Hablar por WhatsApp con ${nombreDestino}`);
                enlaceWhatsapp.href = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(textoWhatsapp)}`;
                enlaceWhatsapp.target = "_blank";
                enlaceWhatsapp.rel = "noopener noreferrer";
                acciones.appendChild(enlaceWhatsapp);
            }

            if (esPropietario) {
                const botonRevertir = crearElemento("button", "boton-revertir", "Cancelar acuerdo");
                botonRevertir.type = "button";
                botonRevertir.addEventListener("click", () => revertirSolicitudAceptada(solicitud.id));
                acciones.appendChild(botonRevertir);
            }
        }

        // Rechazada: botón para borrar del historial
        if (solicitud.estado === "rechazada") {
            const botonBorrar = crearElemento("button", "boton-borrar-solicitud", "Borrar");
            botonBorrar.type = "button";
            botonBorrar.addEventListener("click", () => eliminarSolicitudRechazada(solicitud.id));
            acciones.appendChild(botonBorrar);
        }

        if (acciones.children.length > 0) {
            tarjeta.appendChild(acciones);
        }

        contenedorSolicitudes.appendChild(tarjeta);
    });
}

async function responderSolicitud(id, respuesta, propietarioWhatsapp = "") {
    if (!sesionActual) return;
    const solicitud = solicitudes.find(elemento => elemento.id === id);
    if (!solicitud || solicitud.propietarioId !== sesionActual.id || solicitud.estado !== "pendiente") return;

    const producto = productos.find(elemento => elemento.id === solicitud.productoId);
    if (!producto) {
        mostrarMensaje(mensajeProductos, "El producto ya no existe.", "error");
        return;
    }

    if (respuesta === "aceptada" && producto.estado !== "disponible") {
        mostrarMensaje(mensajeProductos, "Este producto ya no está disponible.", "error");
        return;
    }

    try {
        const datosActualizados = { estado: respuesta };
        if (respuesta === "aceptada" && propietarioWhatsapp) {
            datosActualizados.propietarioWhatsapp = propietarioWhatsapp;
        }

        await updateDoc(doc(db, "solicitudes", id), datosActualizados);

        if (respuesta === "aceptada") {
            await updateDoc(doc(db, "productos", producto.id), { estado: "reservado" });

            const otrasPendientes = solicitudes.filter(otra =>
                otra.productoId === producto.id &&
                otra.id !== solicitud.id &&
                otra.estado === "pendiente"
            );

            for (const otra of otrasPendientes) {
                await updateDoc(doc(db, "solicitudes", otra.id), { estado: "rechazada" });
            }
        }
    } catch (error) {
        console.error("Error al responder solicitud:", error);
    }
}

async function revertirSolicitudAceptada(id) {
    if (!sesionActual) return;
    const solicitud = solicitudes.find(elemento => elemento.id === id);
    if (!solicitud || solicitud.propietarioId !== sesionActual.id || solicitud.estado !== "aceptada") return;

    const confirmar = confirm(
        `¿Deseas cancelar el acuerdo por "${solicitud.productoNombre}"?\n\nLa solicitud pasará a rechazada y el producto volverá a aparecer como Disponible.`
    );
    if (!confirmar) return;

    try {
        await updateDoc(doc(db, "solicitudes", id), { estado: "rechazada" });

        const producto = productos.find(elemento => elemento.id === solicitud.productoId);
        if (producto) {
            await updateDoc(doc(db, "productos", producto.id), { estado: "disponible" });
        }
    } catch (error) {
        console.error("Error al revertir solicitud:", error);
        alert("No se pudo cancelar el acuerdo.");
    }
}

async function eliminarSolicitudRechazada(id) {
    if (!sesionActual) return;
    const solicitud = solicitudes.find(elemento => elemento.id === id);
    if (!solicitud || solicitud.estado !== "rechazada") return;

    if (!confirm("¿Deseas borrar esta solicitud rechazada?")) return;

    try {
        await deleteDoc(doc(db, "solicitudes", id));
    } catch (error) {
        console.error("Error al borrar solicitud:", error);
        alert("No se pudo borrar la solicitud.");
    }
}


/* =====================================================
   10. PIE DE PÁGINA Y ANIMACIONES
===================================================== */

document.querySelector("#anio").textContent = new Date().getFullYear();

const elementosAnimados = document.querySelectorAll(
    ".tarjeta-categoria, .beneficios article, .franja-solidaria"
);

if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver((entradas, obs) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visible");
                obs.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.15 });

    elementosAnimados.forEach(el => observador.observe(el));
} else {
    elementosAnimados.forEach(el => el.classList.add("visible"));
}