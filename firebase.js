import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, getDocs, serverTimestamp, doc, getDoc, setDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCXRaqSetEKHEn3-AIhK3XalDEPJ8vhUfE",
    authDomain: "alegria-web-977ea.firebaseapp.com",
    projectId: "alegria-web-977ea",
    storageBucket: "alegria-web-977ea.firebasestorage.app",
    messagingSenderId: "561418892075",
    appId: "1:561418892075:web:133a1ff3948b86a4e88b6e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
window.db = getFirestore(app);
window.usuarioLogueado = null;

// ==========================================
// FUNCIONES HOISTED SINCRO
// ==========================================
async function guardarMascotaBD(datosMascota) {
    if (window.usuarioLogueado && window.db) {
        try {
            const usuarioRef = doc(window.db, "usuarios", window.usuarioLogueado.uid);
            await setDoc(usuarioRef, { mascota: datosMascota }, { merge: true });
        } catch (error) { console.error("Error subiendo mascota a la nube: ", error); }
    }
}
window.guardarMascotaBD = guardarMascotaBD;

async function cargarMascotaBD() {
    let datosDescargados = null;
    if (window.usuarioLogueado && window.db) {
        try {
            const usuarioRef = doc(window.db, "usuarios", window.usuarioLogueado.uid);
            const docSnap = await getDoc(usuarioRef);
            if (docSnap.exists() && docSnap.data().mascota) {
                datosDescargados = docSnap.data().mascota;
            }
        } catch(error) { console.error("Error descargando mascota: ", error); }
    }
    if (typeof window.sincronizarMascotaUI === "function") {
        window.sincronizarMascotaUI(datosDescargados);
    }
}
window.cargarMascotaBD = cargarMascotaBD;

async function guardarEmocionBD(emocionName) {
    if (!window.usuarioLogueado) return;
    try {
        const subcoleccionRef = collection(window.db, "usuarios", window.usuarioLogueado.uid, "emociones");
        await addDoc(subcoleccionRef, {
            emocion: emocionName,
            fechaFiltro: new Date().toLocaleDateString(),
            timestamp: serverTimestamp()
        });
        if (typeof window.cargarHistorialYCalendario === "function") {
            window.cargarHistorialYCalendario(); 
        }
    } catch (error) { console.error("Error guardando emoción:", error); }
}
window.guardarEmocionBD = guardarEmocionBD;

async function cargarHistorialYCalendario() {
    if (!window.usuarioLogueado) return;
    try {
        const q = query(collection(window.db, "usuarios", window.usuarioLogueado.uid, "emociones"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        
        const historialPorDia = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const fechaTxt = data.fechaFiltro;
            if (!historialPorDia[fechaTxt]) historialPorDia[fechaTxt] = [];
            historialPorDia[fechaTxt].push(data.emocion);
        });
        dibujarCalendarioUI(historialPorDia);
    } catch (error) { console.error("Error cargando historial:", error); }
}
window.cargarHistorialYCalendario = cargarHistorialYCalendario;

function dibujarCalendarioUI(historialPorDia) {
    const grid = document.getElementById("calendario-contenedor");
    const tituloMes = document.getElementById("calendario-titulo");
    const seccionDetalle = document.getElementById("detalle-dia-seccion");
    const listaEmociones = document.getElementById("detalle-emociones-lista");
    const textoFechaDetalle = document.getElementById("detalle-fecha-texto");

    if(!grid) return; grid.innerHTML = '';
    
    const hoyDate = new Date();
    const year = hoyDate.getFullYear(); const month = hoyDate.getMonth();
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    if(tituloMes) tituloMes.innerText = `${nombresMeses[month]} ${year}`;
    
    const primerDiaMes = new Date(year, month, 1).getDay();
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const diasVaciios = (primerDiaMes === 0) ? 6 : primerDiaMes - 1;

    for (let i = 0; i < diasVaciios; i++) {
        const divVacio = document.createElement("div");
        divVacio.className = "celda-dia vacia"; grid.appendChild(divVacio);
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaCeldaStr = new Date(year, month, dia).toLocaleDateString();
        const celda = document.createElement("div");
        celda.className = "celda-dia";
        if (dia === hoyDate.getDate()) celda.classList.add("hoy");

        const numeroDiv = document.createElement("div");
        numeroDiv.className = "numero-dia"; numeroDiv.innerText = dia;
        celda.appendChild(numeroDiv);

        const divEmocion = document.createElement("div");
        divEmocion.className = "emocion-registro";
        
        if (historialPorDia[fechaCeldaStr] && historialPorDia[fechaCeldaStr].length > 0) {
            const emocionesDia = historialPorDia[fechaCeldaStr];
            const ultimaEmocion = emocionesDia[emocionesDia.length - 1];
            const dataEmocion = window.configEmociones ? window.configEmociones[ultimaEmocion] : null;
            
            if (dataEmocion) {
                divEmocion.innerText = dataEmocion.emoji;
                if (emocionesDia.length > 1) {
                    const indicador = document.createElement("div");
                    indicador.className = "indicador-multiples";
                    indicador.innerText = emocionesDia.length;
                    celda.appendChild(indicador);
                }
            }
            
            celda.onclick = () => {
                document.querySelectorAll('.celda-dia').forEach(c => c.classList.remove('seleccionada'));
                celda.classList.add('seleccionada');
                
                if(textoFechaDetalle) textoFechaDetalle.innerText = `Registro del ${dia} de ${nombresMeses[month]}`;
                if(listaEmociones) {
                    listaEmociones.innerHTML = '';
                    emocionesDia.forEach(emo => {
                        const conf = window.configEmociones[emo];
                        if(conf) {
                            const b = document.createElement("span");
                            b.className = "badge-emocion"; b.style.backgroundColor = conf.color;
                            b.innerText = `${conf.emoji} ${conf.texto}`;
                            listaEmociones.appendChild(b);
                        }
                    });
                }
                if(seccionDetalle) seccionDetalle.style.display = 'block';
            };
        } else {
            celda.onclick = () => {
                document.querySelectorAll('.celda-dia').forEach(c => c.classList.remove('seleccionada'));
                celda.classList.add('seleccionada');
                if(textoFechaDetalle) textoFechaDetalle.innerText = `Registro del ${dia} de ${nombresMeses[month]}`;
                if(listaEmociones) listaEmociones.innerHTML = '<span style="color:#888; font-style:italic;">No hay registros este día.</span>';
                if(seccionDetalle) seccionDetalle.style.display = 'block';
            };
        }
        
        celda.appendChild(divEmocion); grid.appendChild(celda);
    }
}

// ==========================================
// OBSERVADOR DE SESIÓN Y CERRAR SESIÓN
// ==========================================
window.cerrarSesion = function() {
    auth.signOut().then(() => {
        window.location.reload();
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        window.usuarioLogueado = user;
        
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            const nombreUsuario = user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario');
            
            const fotoPerfil = user.photoURL 
                ? `<img src="${user.photoURL}" alt="Perfil" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin: 0; box-shadow: 0 0 5px rgba(0,0,0,0.3);">` 
                : `<div class="sidebar-icon" style="margin:0; color: white;">👤</div>`;

            authContainer.innerHTML = `
                <div class="auth-profile" style="cursor: default;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; overflow: hidden;">
                        ${fotoPerfil}
                    </div>
                    <div class="auth-info" style="flex-direction: column; align-items: flex-start; gap: 4px; overflow: hidden;">
                        <span style="font-size: 14px; font-weight: bold; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;" title="${user.email || ''}">${nombreUsuario}</span>
                        <button onclick="window.cerrarSesion()" style="background: rgba(255,255,255,0.1); border: none; color: #BDC3C7; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            `;
        }
        
        const btnDiario = document.getElementById('btn-sidebar-diario');
        if (btnDiario) {
            btnDiario.style.display = 'flex';
        }
        
        if (typeof window.cargarMascotaBD === "function") {
            window.cargarMascotaBD().then(() => {
                if (typeof window.cargarHistorialYCalendario === "function") {
                    window.cargarHistorialYCalendario();
                }
            }).catch(err => console.error("Error en flujo de sesión:", err));
        }
        
    } else {
        window.usuarioLogueado = null;
        
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.innerHTML = `
                <a href="login.html" class="auth-profile">
                    <div class="sidebar-icon" style="margin:0; color: white;">👤</div>
                    <div class="auth-info">
                        <span style="font-size: 14px; font-weight: bold; color: white;">Iniciar Sesión</span>
                    </div>
                </a>
            `;
        }

        const btnDiario = document.getElementById('btn-sidebar-diario');
        if (btnDiario) {
            btnDiario.style.display = 'none';
        }
        
        if (typeof window.sincronizarMascotaUI === "function") {
            window.sincronizarMascotaUI(null);
        }
    }
});
// =========================================
// 1. GUARDAR DIARIO EN FIREBASE (Con correo para el Admin)
// =========================================
async function guardarEntradaEnFirebase(texto) {
    const usuarioActual = auth.currentUser; 
    
    if (!usuarioActual) {
        throw new Error("Debes iniciar sesión para poder guardar en tu diario.");
    }

    try {
        await addDoc(collection(db, "diarios"), {
            userId: usuarioActual.uid,
            correo: usuarioActual.email, // Fundamental para tu panel clínico
            contenido: texto,
            fecha: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error al escribir en Firestore: ", error);
        throw new Error("No se pudo conectar con la base de datos.");
    }
}
window.guardarEntradaEnFirebase = guardarEntradaEnFirebase;


// =========================================
// 2. OBTENER DIARIO POR FECHA (Hojear páginas del paciente)
// =========================================
async function obtenerEntradasDiarioPorFecha(fechaTarget) {
    const usuarioActual = auth.currentUser;
    if (!usuarioActual) return [];

    const q = query(collection(db, "diarios"), where("userId", "==", usuarioActual.uid));
    const querySnapshot = await getDocs(q);
    
    const fechaBuscada = fechaTarget.toLocaleDateString(); 
    let entradas = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fechaEntrada = new Date(data.fecha);
        
        if (fechaEntrada.toLocaleDateString() === fechaBuscada) {
            entradas.push({ id: doc.id, ...data, fechaObj: fechaEntrada });
        }
    });

    entradas.sort((a, b) => b.fechaObj - a.fechaObj); // Ordenar por hora
    return entradas;
}
window.obtenerEntradasDiarioPorFecha = obtenerEntradasDiarioPorFecha;
