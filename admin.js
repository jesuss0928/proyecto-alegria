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

let todosLosUsuarios = [];

onAuthStateChanged(auth, (user) => {
    if (user && user.email === CORREO_ADMIN_AUTORIZADO) {
        document.getElementById('pantalla-bloqueo').style.display = 'none';
        document.getElementById('panel-contenido').style.display = 'flex';
        configurarPestanas();
        cargarListaUsuarios();
    } else {
        document.getElementById('pantalla-bloqueo').innerHTML = "<div style='font-size: 50px; margin-bottom: 20px;'>🚫</div><h2>Acceso Denegado</h2>";
    }
});

async function obtenerMapaCorreos() {
    let mapa = {};
    try {
        const snap = await getDocs(collection(db, "diarios"));
        snap.forEach(doc => {
            const data = doc.data();
            if (data.userId && data.correo) mapa[data.userId] = data.correo;
        });
    } catch (e) {}
    return mapa;
}

async function cargarListaUsuarios() {
    const contenedorLista = document.getElementById('lista-usuarios');
    try {
        const mapaCorreosPerdidos = await obtenerMapaCorreos();
        const qUsuarios = query(collection(db, "usuarios"));
        const snapshot = await getDocs(qUsuarios);
        
        todosLosUsuarios = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const correoReal = data.correo || data.email || mapaCorreosPerdidos[doc.id] || 'Sin correo registrado';
            const nombreReal = data.nombre || correoReal.split('@')[0];

            todosLosUsuarios.push({
                id: doc.id,
                correo: correoReal,
                nombre: nombreReal,
                foto: data.foto || null, // <- Aquí lo lee
                datosBase: data
            });
        });

        renderizarListaUsuarios(todosLosUsuarios);
        configurarBuscador();

    } catch (error) { contenedorLista.innerHTML = `<div style="padding:20px; color:red;">Error al cargar.</div>`; }
}

function renderizarListaUsuarios(usuarios) {
    const contenedorLista = document.getElementById('lista-usuarios');
    contenedorLista.innerHTML = "";

    if(usuarios.length === 0) {
        contenedorLista.innerHTML = `<div style="padding:20px; text-align:center;">No hay pacientes.</div>`;
        return;
    }

    usuarios.forEach(user => {
        const divCard = document.createElement('div');
        divCard.className = "usuario-card";
        
        let avatarHTML = "";
        if (user.foto) {
            avatarHTML = `<img src="${user.foto}" class="user-avatar" referrerpolicy="no-referrer">`;
        } else {
            const inicial = user.nombre !== 'Sin correo registrado' ? user.nombre.charAt(0).toUpperCase() : '?';
            avatarHTML = `<div class="user-avatar">${inicial}</div>`;
        }

        divCard.innerHTML = `
            ${avatarHTML}
            <div class="user-info">
                <h4>${user.nombre}</h4>
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

function configurarPestanas() {
    const botones = ['btn-tab-resumen', 'btn-tab-diario', 'btn-tab-emociones'];
    const contenidos = ['tab-resumen', 'tab-diario', 'tab-emociones'];

    botones.forEach((btnId, index) => {
        document.getElementById(btnId).addEventListener('click', () => {
            botones.forEach(b => document.getElementById(b).classList.remove('activo'));
            contenidos.forEach(c => document.getElementById(c).classList.remove('activo'));
            document.getElementById(btnId).classList.add('activo');
            document.getElementById(contenidos[index]).classList.add('activo');
        });
    });
}

async function seleccionarPaciente(user, cardElement) {
    history.pushState({ panelAbierto: true }, ""); 
    
    document.querySelectorAll('.usuario-card').forEach(c => c.classList.remove('activo'));
    if(cardElement) cardElement.classList.add('activo');

    document.getElementById('estado-vacio').style.display = 'none';
    document.getElementById('detalle-paciente').style.display = 'block';

    document.getElementById('det-nombre').innerText = user.nombre;
    document.getElementById('det-correo').innerText = user.correo;
    
    const imgFoto = document.getElementById('det-foto');
    const divAvatar = document.getElementById('det-avatar-texto');
    
    if(user.foto) {
        imgFoto.src = user.foto;
        imgFoto.style.display = "block";
        divAvatar.style.display = "none";
    } else {
        imgFoto.style.display = "none";
        divAvatar.innerText = user.nombre !== 'Sin correo registrado' ? user.nombre.charAt(0).toUpperCase() : '?';
        divAvatar.style.display = "flex";
    }

    const mascotaTipo = user.datosBase.tipoActivo || user.datosBase.mascota?.tipoActivo || 'Ninguna';
    const mascotaNivel = user.datosBase.nivel || user.datosBase.mascota?.nivel || 0;
    document.getElementById('det-mascota').innerText = mascotaTipo.charAt(0).toUpperCase() + mascotaTipo.slice(1);
    document.getElementById('det-nivel').innerText = mascotaNivel + "%";

    await cargarDatosPaciente(user.id);
}

async function cargarDatosPaciente(userId) {
    const divDiarios = document.getElementById('timeline-diarios');
    const divEmociones = document.getElementById('timeline-emociones');
    
    divDiarios.innerHTML = "Cargando..."; divEmociones.innerHTML = "Cargando...";
    let ultimaConexionMs = 0;
    
    try {
        const qDiarios = query(collection(db, "diarios"), where("userId", "==", userId));
        const snapDiarios = await getDocs(qDiarios);
        let listaDiarios = [];
        
        snapDiarios.forEach(doc => {
            const d = doc.data();
            const ms = new Date(d.fecha).getTime();
            if(ms > ultimaConexionMs) ultimaConexionMs = ms;
            listaDiarios.push({ ms: ms, html: `<div class="timeline-item"><div class="timeline-fecha">${new Date(d.fecha).toLocaleString()}</div><div class="timeline-contenido">"${d.contenido}"</div></div>` });
        });

        listaDiarios.sort((a,b) => b.ms - a.ms);
        divDiarios.innerHTML = listaDiarios.length ? listaDiarios.map(x => x.html).join('') : "<p style='color:#64748b;'>No hay diarios registrados.</p>";

        const qEmociones = collection(db, "usuarios", userId, "emociones");
        const snapEmociones = await getDocs(qEmociones);
        let listaEmociones = [];
        let conteo = {};

        snapEmociones.forEach(doc => {
            const d = doc.data();
            if(!d.emocion || typeof d.emocion !== 'string') return;
            
            const emo = d.emocion.toLowerCase();
            conteo[emo] = (conteo[emo] || 0) + 1;

            let ms = Date.now();
            let fechaText = d.fechaFiltro || "Reciente";
            if (d.timestamp) {
                const dateObj = d.timestamp.toDate();
                ms = dateObj.getTime();
                fechaText = dateObj.toLocaleString();
            }
            if(ms > ultimaConexionMs) ultimaConexionMs = ms;

            const badge = obtenerColorEmocion(d.emocion);
            listaEmociones.push({ ms: ms, html: `<div class="timeline-item"><div class="timeline-fecha">${fechaText}</div><div class="timeline-contenido" style="background:transparent; border:none; padding:0;">Se sintió: <span class="${badge}">${d.emocion}</span></div></div>` });
        });

        listaEmociones.sort((a,b) => b.ms - a.ms);
        divEmociones.innerHTML = listaEmociones.length ? listaEmociones.map(x => x.html).join('') : "<p style='color:#64748b;'>No hay emociones registradas.</p>";

        if (Object.keys(conteo).length > 0) {
            let dom = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
            document.getElementById('det-emocion').innerHTML = `<span class="${obtenerColorEmocion(dom)}">${dom.toUpperCase()}</span>`;
        } else {
            document.getElementById('det-emocion').innerText = "Sin registros";
        }

        if(ultimaConexionMs > 0) {
            document.getElementById('det-conexion').innerText = new Date(ultimaConexionMs).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
        } else {
            document.getElementById('det-conexion').innerText = "Desconocida";
        }

    } catch (e) {
        divDiarios.innerHTML = "Error al cargar"; divEmociones.innerHTML = "Error al cargar";
        console.error(e);
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

function deseleccionarPaciente() {
    document.getElementById('detalle-paciente').style.display = 'none';
    document.getElementById('estado-vacio').style.display = 'flex';
    document.querySelectorAll('.usuario-card').forEach(c => c.classList.remove('activo'));
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') deseleccionarPaciente(); });
window.addEventListener('popstate', () => { deseleccionarPaciente(); });
