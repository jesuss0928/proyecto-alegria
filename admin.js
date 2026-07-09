import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCXRaqSetEKHEn3-AIhK3XalDEPJ8vhUfE",
    authDomain: "alegria-web-977ea.firebaseapp.com",
    projectId: "alegria-web-977ea",
    storageBucket: "alegria-web-977ea.firebasestorage.app",
    messagingSenderId: "561418892075",
    appId: "1:561418892075:web:133a1ff3948b86a4e88b6e"
};

const CORREO_ADMIN_AUTORIZADO = "jess.vite0609@gmail.com"; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variables Globales
let todosLosUsuarios = [];

// ==========================================
// 1. SEGURIDAD DE ACCESO
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user && user.email === CORREO_ADMIN_AUTORIZADO) {
        document.getElementById('pantalla-bloqueo').style.display = 'none';
        document.getElementById('panel-contenido').style.display = 'flex';
        cargarListaUsuarios();
    } else {
        document.getElementById('pantalla-bloqueo').innerHTML = "<div style='font-size: 50px; margin-bottom: 20px;'>🚫</div><h2>Acceso Denegado</h2><p>Solo el administrador puede ver esta página.</p>";
    }
});

// ==========================================
// 2. CARGAR LISTA DE PACIENTES (MENÚ IZQUIERDO)
// ==========================================
async function cargarListaUsuarios() {
    const contenedorLista = document.getElementById('lista-usuarios');
    try {
        const qUsuarios = query(collection(db, "usuarios"));
        const snapshot = await getDocs(qUsuarios);
        
        todosLosUsuarios = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            todosLosUsuarios.push({
                id: doc.id,
                correo: data.correo || data.email || 'Anónimo',
                nombre: data.nombre || data.correo || doc.id,
                foto: data.foto || null,
                datosBase: data // Aquí viene la mascota
            });
        });

        renderizarListaUsuarios(todosLosUsuarios);
        configurarBuscador();

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        contenedorLista.innerHTML = `<div style="padding:20px; color:red;">Error al cargar la lista de pacientes.</div>`;
    }
}

function renderizarListaUsuarios(usuarios) {
    const contenedorLista = document.getElementById('lista-usuarios');
    contenedorLista.innerHTML = "";

    if(usuarios.length === 0) {
        contenedorLista.innerHTML = `<div style="padding:20px; color:#64748b; text-align:center;">No se encontraron pacientes.</div>`;
        return;
    }

    usuarios.forEach(user => {
        const divCard = document.createElement('div');
        divCard.className = "usuario-card";
        divCard.dataset.id = user.id;

        // Si tiene foto la usamos, si no, ponemos la inicial de su correo
        let avatarHTML = "";
        if (user.foto) {
            avatarHTML = `<img src="${user.foto}" class="user-avatar" alt="foto">`;
        } else {
            const inicial = user.correo !== 'Anónimo' ? user.correo.charAt(0).toUpperCase() : '?';
            avatarHTML = `<div class="user-avatar" style="background:#3b82f6;">${inicial}</div>`;
        }

        divCard.innerHTML = `
            ${avatarHTML}
            <div class="user-info">
                <h4>${user.nombre.split('@')[0]}</h4>
                <p>${user.correo}</p>
            </div>
        `;

        divCard.onclick = () => seleccionarPaciente(user, divCard);
        contenedorLista.appendChild(divCard);
    });
}

function configurarBuscador() {
    document.getElementById('buscador-usuarios').addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = todosLosUsuarios.filter(u => 
            u.correo.toLowerCase().includes(termino) || u.nombre.toLowerCase().includes(termino)
        );
        renderizarListaUsuarios(filtrados);
    });
}

// ==========================================
// 3. CARGAR DETALLES DEL PACIENTE (PANEL DERECHO)
// ==========================================
async function seleccionarPaciente(user, cardElement) {
    // 1. Efecto visual de selección en la lista
    document.querySelectorAll('.usuario-card').forEach(c => c.classList.remove('activo'));
    if(cardElement) cardElement.classList.add('activo');

    // 2. Mostrar panel derecho y ocultar el vacío
    document.getElementById('estado-vacio').style.display = 'none';
    const panelDetalle = document.getElementById('detalle-paciente');
    panelDetalle.style.display = 'block';

    // 3. Cargar cabecera
    document.getElementById('det-nombre').innerText = user.nombre.split('@')[0];
    document.getElementById('det-correo').innerText = user.correo;
    
    const imgFoto = document.getElementById('det-foto');
    if(user.foto) {
        imgFoto.src = user.foto;
        imgFoto.style.display = "block";
    } else {
        imgFoto.style.display = "none"; // Si no hay foto de Google, se oculta (se ve limpio)
    }

    // 4. Cargar Mascota
    const mascotaTipo = user.datosBase.tipoActivo || user.datosBase.mascota?.tipoActivo || 'Ninguna';
    const mascotaNivel = user.datosBase.nivel || user.datosBase.mascota?.nivel || 0;
    document.getElementById('det-mascota').innerText = mascotaTipo.charAt(0).toUpperCase() + mascotaTipo.slice(1);
    document.getElementById('det-nivel').innerText = mascotaNivel + "%";

    // 5. Cargar Línea de tiempo cronológica (Emociones y Diarios)
    await cargarLineaDeTiempo(user.id, user.correo);
}

// ==========================================
// 4. GENERAR LÍNEA DE TIEMPO (Cronología exacta)
// ==========================================
async function cargarLineaDeTiempo(userId, correoUser) {
    const contenedorEventos = document.getElementById('timeline-eventos');
    contenedorEventos.innerHTML = "<p style='color:#64748b;'>Cargando historial...</p>";
    
    let eventos = [];
    let conteoEmociones = {};

    try {
        // A. Buscar Diarios del usuario (busca por ID o por correo por seguridad)
        const qDiarios = query(collection(db, "diarios"), where("userId", "==", userId));
        const snapDiarios = await getDocs(qDiarios);
        
        snapDiarios.forEach(doc => {
            const data = doc.data();
            const fechaMs = new Date(data.fecha).getTime(); // Convertir a milisegundos para ordenar
            eventos.push({
                tipo: 'diario',
                fechaMs: fechaMs,
                fechaTexto: new Date(data.fecha).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }),
                contenido: data.contenido
            });
        });

        // B. Buscar Emociones del usuario
        const qEmociones = collection(db, "usuarios", userId, "emociones");
        const snapEmociones = await getDocs(qEmociones);

        snapEmociones.forEach(doc => {
            const data = doc.data();
            if(!data.emocion || typeof data.emocion !== 'string') return;
            
            // Contar para la estadística
            const emo = data.emocion.toLowerCase();
            conteoEmociones[emo] = (conteoEmociones[emo] || 0) + 1;

            // Intentar sacar la fecha exacta
            let fechaMs = 0;
            let fechaTexto = data.fechaFiltro || "Fecha desconocida";

            if (data.timestamp) {
                const dateObj = data.timestamp.toDate();
                fechaMs = dateObj.getTime();
                fechaTexto = dateObj.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
            } else {
                fechaMs = Date.now(); // Si no hay timestamp, lo ponemos al final
            }

            eventos.push({
                tipo: 'emocion',
                fechaMs: fechaMs,
                fechaTexto: fechaTexto,
                emocion: data.emocion
            });
        });

        // C. Calcular Emoción Dominante
        if (Object.keys(conteoEmociones).length > 0) {
            let dominante = Object.keys(conteoEmociones).reduce((a, b) => conteoEmociones[a] > conteoEmociones[b] ? a : b);
            document.getElementById('det-emocion').innerHTML = `<span class="badge ${obtenerColorEmocion(dominante)}">${dominante}</span>`;
        } else {
            document.getElementById('det-emocion').innerText = "Sin registros";
        }

        // D. ORDENAR CRONOLÓGICAMENTE (Del más reciente al más antiguo)
        eventos.sort((a, b) => b.fechaMs - a.fechaMs);

        // E. Dibujar los eventos en el HTML
        if (eventos.length === 0) {
            contenedorEventos.innerHTML = "<p style='color:#64748b;'>Este paciente aún no tiene entradas en el diario ni emociones registradas.</p>";
            return;
        }

        contenedorEventos.innerHTML = "";
        eventos.forEach(ev => {
            const item = document.createElement('div');
            item.className = "timeline-item";

            if (ev.tipo === 'diario') {
                item.innerHTML = `
                    <div class="timeline-fecha">📓 Entrada de Diario - ${ev.fechaTexto}</div>
                    <div class="timeline-contenido">"${ev.contenido}"</div>
                `;
            } else {
                const claseBadge = obtenerColorEmocion(ev.emocion);
                item.innerHTML = `
                    <div class="timeline-fecha">🎭 Registro de Emoción - ${ev.fechaTexto}</div>
                    <div class="timeline-contenido" style="border:none; background:transparent; padding:0;">
                        Se sintió: <span class="${claseBadge}">${ev.emocion}</span>
                    </div>
                `;
            }
            contenedorEventos.appendChild(item);
        });

    } catch (e) {
        console.error("Error al cargar línea de tiempo:", e);
        contenedorEventos.innerHTML = "<p style='color:red;'>Hubo un error cargando el historial.</p>";
    }
}

function obtenerColorEmocion(emocion) {
    const e = emocion.toLowerCase();
    if (e.includes('feliz')) return 'badge feliz';
    if (e.includes('ansied') || e.includes('ansios')) return 'badge ansiedad';
    if (e.includes('trist')) return 'badge tristeza';
    if (e.includes('enoj')) return 'badge enojo';
    if (e.includes('desmotiv') || e.includes('cansad')) return 'badge desmotivado';
    return 'badge neutro';
}
