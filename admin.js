import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ==========================================
// 1. SEGURIDAD
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user && user.email === CORREO_ADMIN_AUTORIZADO) {
        document.getElementById('pantalla-bloqueo').style.display = 'none';
        document.getElementById('panel-contenido').style.display = 'block';
        cargarDatosReales();
    } else {
        document.getElementById('pantalla-bloqueo').innerHTML = "<div style='font-size: 40px; margin-bottom: 15px;'>🚫</div>Acceso Denegado.";
    }
});

async function cargarDatosReales() {
    const mapaUsuarios = await obtenerMapaCorreos();

    await cargarDiarios();
    await cargarEmociones(mapaUsuarios);
    await cargarMascotas(mapaUsuarios);
    configurarBuscador();
}

// ==========================================
// TRUCO MAESTRO: TRADUCTOR DE IDs A CORREOS
// ==========================================
async function obtenerMapaCorreos() {
    let mapa = {};
    try {
        // Intento 1: Buscar en perfiles
        const q1 = query(collection(db, "usuarios"));
        const snap1 = await getDocs(q1);
        snap1.forEach(doc => {
            const data = doc.data();
            if (data.correo || data.email) mapa[doc.id] = data.correo || data.email;
        });

        // Intento 2: Extraer los correos desde los Diarios
        const q2 = query(collection(db, "diarios"));
        const snap2 = await getDocs(q2);
        snap2.forEach(doc => {
            const data = doc.data();
            if (data.userId && data.correo) {
                mapa[data.userId] = data.correo;
            }
        });
    } catch (e) { console.error("Error mapeando correos", e); }
    return mapa;
}

// ==========================================
// A. CARGAR DIARIOS Y ESTADÍSTICA
// ==========================================
async function cargarDiarios() {
    const tabla = document.getElementById('tabla-diarios');
    try {
        const q = query(collection(db, "diarios"), orderBy("fecha", "desc"));
        const snapshot = await getDocs(q);
        
        document.getElementById('stat-diarios').innerText = snapshot.size; 
        tabla.innerHTML = ""; 

        if (snapshot.empty) {
            tabla.innerHTML = "<tr><td colspan='3' style='text-align: center;'>No hay diarios registrados.</td></tr>";
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const fecha = new Date(data.fecha).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
            
            tabla.innerHTML += `<tr>
                <td><strong>${data.correo || 'Anónimo'}</strong></td>
                <td><span class="badge neutro">${fecha}</span></td>
                <td style="white-space: pre-wrap; color: #475569;">${data.contenido}</td>
            </tr>`;
        });
    } catch (e) { tabla.innerHTML = "<tr><td colspan='3' style='color: red;'>Error al cargar diarios.</td></tr>"; }
}

// ==========================================
// B. CARGAR EMOCIONES (VERSIÓN SEGURA SIN COLLECTIONGROUP)
// ==========================================
function obtenerColorEmocion(emocion) {
    const e = emocion.toLowerCase();
    if (e.includes('feliz')) return 'badge feliz';
    if (e.includes('ansied') || e.includes('ansios')) return 'badge ansiedad';
    if (e.includes('trist')) return 'badge tristeza';
    if (e.includes('enoj')) return 'badge enojo';
    if (e.includes('desmotiv') || e.includes('cansad')) return 'badge desmotivado';
    return 'badge neutro';
}

async function cargarEmociones(mapaUsuarios) {
    const tabla = document.getElementById('tabla-emociones');
    let conteoEmociones = {};
    let totalEmocionesContadas = 0;

    try {
        tabla.innerHTML = ""; 
        let filasHtml = [];

        // 1. Traemos a todos los usuarios de la base de datos de manera normal
        const qUsuarios = query(collection(db, "usuarios"));
        const snapUsuarios = await getDocs(qUsuarios);

        for (const usuarioDoc of snapUsuarios.docs) {
            const userId = usuarioDoc.id;
            const identificador = mapaUsuarios[userId] || userId;

            // 2. Por cada usuario, entramos a ver si tiene emociones registradas
            const qEmociones = collection(db, "usuarios", userId, "emociones");
            const snapEmociones = await getDocs(qEmociones);

            snapEmociones.forEach((doc) => {
                const data = doc.data();
                if (!data.emocion || typeof data.emocion !== 'string') return;

                totalEmocionesContadas++;
                const emo = data.emocion.toLowerCase();
                conteoEmociones[emo] = (conteoEmociones[emo] || 0) + 1;

                let fecha = data.fechaFiltro || 'Reciente';
                if (data.timestamp) {
                    fecha = data.timestamp.toDate().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
                }

                const claseColor = obtenerColorEmocion(data.emocion);

                filasHtml.push(`<tr>
                    <td style="color: #64748b; font-size: 14px; font-weight: bold;">${identificador}</td>
                    <td><span class="${claseColor}" style="text-transform: capitalize;">${data.emocion}</span></td>
                    <td><span class="badge neutro">${fecha}</span></td>
                </tr>`);
            });
        }

        // Actualizamos la tarjeta superior con el total de emociones
        document.getElementById('stat-emociones').innerText = totalEmocionesContadas; 

        if (filasHtml.length === 0) {
            tabla.innerHTML = "<tr><td colspan='3' style='text-align: center;'>No hay emociones registradas.</td></tr>";
            return;
        }

        // Mostramos las emociones
        tabla.innerHTML = filasHtml.reverse().join(''); 

        if (Object.keys(conteoEmociones).length > 0) {
            let dominante = Object.keys(conteoEmociones).reduce((a, b) => conteoEmociones[a] > conteoEmociones[b] ? a : b);
            document.getElementById('stat-tendencia').innerText = dominante.toUpperCase();
        }

    } catch (e) { 
        console.error("Error al cargar emociones:", e);
        tabla.innerHTML = "<tr><td colspan='3' style='color: red;'>Error al cargar emociones.</td></tr>"; 
    }
}

// ==========================================
// C. CARGAR MASCOTAS
// ==========================================
async function cargarMascotas(mapaUsuarios) {
    const tabla = document.getElementById('tabla-mascotas');
    try {
        const q = query(collection(db, "usuarios"));
        const snapshot = await getDocs(q);
        tabla.innerHTML = "";

        if (snapshot.empty) {
            tabla.innerHTML = "<tr><td colspan='3' style='text-align: center;'>No hay registros de mascotas aún.</td></tr>";
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            
            const identificador = mapaUsuarios[id] || id;

            const tipo = data.tipoActivo || data.mascota?.tipoActivo || 'Desconocido';
            const nivel = data.nivel || data.mascota?.nivel || 0;

            tabla.innerHTML += `<tr>
                <td><strong>${identificador}</strong></td>
                <td style="text-transform: capitalize;">${tipo}</td>
                <td><span class="badge nivel">Nivel ${nivel}%</span></td>
            </tr>`;
        });
    } catch (e) { tabla.innerHTML = "<tr><td colspan='3' style='color: red;'>Aún no hay datos de mascotas.</td></tr>"; }
}

// ==========================================
// D. LÓGICA DEL BUSCADOR INTELIGENTE
// ==========================================
function configurarBuscador() {
    document.getElementById('buscador').addEventListener('input', function(e) {
        const termino = e.target.value.toLowerCase();
        const cuerposTablas = [
            document.getElementById('tabla-diarios'),
            document.getElementById('tabla-emociones'),
            document.getElementById('tabla-mascotas')
        ];

        cuerposTablas.forEach(tbody => {
            if(!tbody) return;
            const filas = tbody.getElementsByTagName('tr');
            Array.from(filas).forEach(fila => {
                const textoFila = fila.textContent.toLowerCase();
                fila.style.display = textoFila.includes(termino) ? '' : 'none';
            });
        });
    });
}
