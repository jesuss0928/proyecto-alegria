import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, collectionGroup, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración real de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCXRaqSetEKHEn3-AIhK3XalDEPJ8vhUfE",
    authDomain: "alegria-web-977ea.firebaseapp.com",
    projectId: "alegria-web-977ea",
    storageBucket: "alegria-web-977ea.firebasestorage.app",
    messagingSenderId: "561418892075",
    appId: "1:561418892075:web:133a1ff3948b86a4e88b6e"
};

// 👈 LA LLAVE MAESTRA
const CORREO_ADMIN_AUTORIZADO = "jess.vite0609@gmail.com"; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. VERIFICAR SEGURIDAD AL CARGAR LA PÁGINA
onAuthStateChanged(auth, (user) => {
    const pantallaBloqueo = document.getElementById('pantalla-bloqueo');
    const panelContenido = document.getElementById('panel-contenido');

    if (user && user.email === CORREO_ADMIN_AUTORIZADO) {
        // ES EL ADMIN: Desbloquear pantalla y cargar datos
        pantallaBloqueo.style.display = 'none';
        panelContenido.style.display = 'block';
        cargarDatosReales();
    } else {
        // ES UN INTRUSO O NO INICIÓ SESIÓN
        pantallaBloqueo.innerHTML = "<div style='font-size: 40px; margin-bottom: 15px;'>🚫</div>Acceso Denegado. No tienes permisos para ver esta página.";
        // Opcional: cierra la pestaña automáticamente después de 3 segundos
        setTimeout(() => window.close(), 3000); 
    }
});

// 2. EXTRAER DATOS REALES DE FIREBASE
async function cargarDatosReales() {
    const tablaDiarios = document.getElementById('tabla-diarios');
    const tablaEmociones = document.getElementById('tabla-emociones');

    try {
        // --- A. CARGAR DIARIOS ---
        // Ordenamos los diarios por fecha (los más nuevos primero)
        const qDiarios = query(collection(db, "diarios"), orderBy("fecha", "desc"));
        const diariosSnapshot = await getDocs(qDiarios);
        
        tablaDiarios.innerHTML = ""; // Limpiar tabla
        
        if (diariosSnapshot.empty) {
            tablaDiarios.innerHTML = "<tr><td colspan='3' style='text-align: center; color: #888;'>No hay diarios registrados aún.</td></tr>";
        } else {
            diariosSnapshot.forEach((doc) => {
                const data = doc.data();
                const fechaLegible = new Date(data.fecha).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
                
                const fila = `<tr>
                    <td><strong>${data.correo || 'Usuario anónimo'}</strong></td>
                    <td><span class="badge">${fechaLegible}</span></td>
                    <td style="white-space: pre-wrap;">${data.contenido}</td>
                </tr>`;
                tablaDiarios.innerHTML += fila;
            });
        }

        // --- B. CARGAR EMOCIONES DE TODOS LOS USUARIOS ---
        // Usamos collectionGroup para buscar en todas las subcolecciones "emociones" de todos los usuarios
       const qEmociones = query(collectionGroup(db, "emociones"));
        const emocionesSnapshot = await getDocs(qEmociones);
        
        tablaEmociones.innerHTML = ""; 

        if (emocionesSnapshot.empty) {
            tablaEmociones.innerHTML = "<tr><td colspan='3' style='text-align: center; color: #888;'>No hay emociones registradas aún.</td></tr>";
        } else {
            emocionesSnapshot.forEach((doc) => {
                const data = doc.data();
                // Subir a la referencia del padre para intentar sacar el ID del usuario (opcional)
                const userId = doc.ref.parent.parent ? doc.ref.parent.parent.id : 'Desconocido';
                
                let fechaRegistro = data.fechaFiltro || 'Sin fecha';
                if (data.timestamp) {
                    fechaRegistro = data.timestamp.toDate().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
                }

                const fila = `<tr>
                    <td style="color: #64748b; font-size: 14px;">ID: ${userId}</td>
                    <td style="text-transform: capitalize; font-weight: bold;">${data.emocion}</td>
                    <td><span class="badge">${fechaRegistro}</span></td>
                </tr>`;
                tablaEmociones.innerHTML += fila;
            });
        }

    } catch (error) {
        console.error("Error obteniendo datos:", error);
        tablaDiarios.innerHTML = "<tr><td colspan='3' style='text-align: center; color: red;'>Error al cargar los datos. Revisa que las reglas de Firebase Firestore permitan la lectura.</td></tr>";
        tablaEmociones.innerHTML = "<tr><td colspan='3' style='text-align: center; color: red;'>Error al cargar los datos.</td></tr>";
    }
}
