// ==========================================
// 🔐 SISTEMA DE ROLES Y PERMISOS (NUEVO)
// ==========================================
const CORREOS_ADMIN_AUTORIZADOS = [
    "tucorreo@gmail.com" // 👈 PON TU CORREO REAL AQUÍ
];

window.verificarRolUsuario = function(usuarioFirebase) {
    const botonAdmin = document.getElementById('btn-secreto-admin');
    if (!botonAdmin) return;

    // Si el usuario tiene sesión activa y su correo está en la lista secreta...
    if (usuarioFirebase && CORREOS_ADMIN_AUTORIZADOS.includes(usuarioFirebase.email)) {
        botonAdmin.style.display = "flex"; // Se muestra el botón
    } else {
        botonAdmin.style.display = "none"; // Se mantiene oculto para los demás
    }
};

// ==========================================
// FUNCIONES DE INTERFAZ Y MODALES
// ==========================================
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('expanded'); document.body.classList.toggle('sidebar-expanded'); } //[cite: 2]
function abrirModal(id) { document.getElementById(id).style.display = 'flex'; } //[cite: 2]
function cerrarModal(id) { document.getElementById(id).style.display = 'none'; } //[cite: 2]
window.onclick = function(event) { if (event.target.classList.contains('modal-overlay')) event.target.style.display = "none"; } //[cite: 2]

// ==========================================
// CEREBRO DE LA MASCOTA
// ==========================================
const MAX_UPGRADES_DIA = 3; //[cite: 2]
const tiposMascotas = {
    planta: { nombre: "Planta de Paz", tipoIcon: "🌿 Naturaleza", etapas: ["🌱", "🌿", "🍀", "🌳", "✨🌳✨"] }, //[cite: 2]
    perro: { nombre: "Perrito Fiel", tipoIcon: "🐾 Lealtad", etapas: ["🦴", "🐕‍🦺", "🐕", "🐩", "✨🐶✨"] }, //[cite: 2]
    gato: { nombre: "Gatito Zen", tipoIcon: "🌙 Misterio", etapas: ["🥛", "🐈‍⬛", "🐈", "🐅", "✨🐱✨"] }, //[cite: 2]
    loro: { nombre: "Loro Sabio", tipoIcon: "🦜 Inteligencia", etapas: ["🥚", "🐣", "🐥", "🦜", "✨🐦✨"] } //[cite: 2]
};

let datosProgreso = {
    tipoActivo: 'planta', //[cite: 2]
    nivel: 0, //[cite: 2]
    fechaUltimoUpgrade: new Date().toLocaleDateString(), //[cite: 2]
    upgradesHoy: 0, //[cite: 2]
    logros: [] //[cite: 2]
};

window.sincronizarMascotaUI = function(datosRemotos) {
    const hoy = new Date().toLocaleDateString(); //[cite: 2]
    if (datosRemotos) { datosProgreso = datosRemotos; }  //[cite: 2]
    else { datosProgreso = JSON.parse(localStorage.getItem('alegria_mascota_data')) || { tipoActivo: 'planta', nivel: 0, fechaUltimoUpgrade: hoy, upgradesHoy: 0, logros: [] }; } //[cite: 2]

    if (datosProgreso.fechaUltimoUpgrade !== hoy) { //[cite: 2]
        datosProgreso.upgradesHoy = 0; datosProgreso.fechaUltimoUpgrade = hoy; //[cite: 2]
        guardarProgresoMascota();  //[cite: 2]
    }

    actualizarUIMascota(); renderizarLogros(); //[cite: 2]
};

function guardarProgresoMascota() {
    localStorage.setItem('alegria_mascota_data', JSON.stringify(datosProgreso)); //[cite: 2]
    if (typeof window.guardarMascotaBD === "function") { window.guardarMascotaBD(datosProgreso); } //[cite: 2]
}

function actualizarUIMascota() {
    const config = tiposMascotas[datosProgreso.tipoActivo]; //[cite: 2]
    const indiceEtapa = Math.min(4, Math.floor(datosProgreso.nivel / 25)); //[cite: 2]
    document.getElementById('mascota-emoji').innerText = config.etapas[indiceEtapa]; //[cite: 2]
    document.getElementById('mascota-progreso').style.width = datosProgreso.nivel + '%'; //[cite: 2]
    document.getElementById('mascota-limite-texto').innerText = `${datosProgreso.upgradesHoy}/${MAX_UPGRADES_DIA} Hoy`; //[cite: 2]

    const textoEl = document.getElementById('mascota-texto'); //[cite: 2]
    if (datosProgreso.nivel < 40) textoEl.innerText = "Fase 1: Inicio"; //[cite: 2]
    else if (datosProgreso.nivel < 80) textoEl.innerText = "Fase 2: Creciendo"; //[cite: 2]
    else if (datosProgreso.nivel < 100) textoEl.innerText = "Fase 3: Casi listo"; //[cite: 2]
    else textoEl.innerText = "¡Completado!"; //[cite: 2]
}

function mejorarMascota() {
    if (datosProgreso.nivel >= 100) return; //[cite: 2]
    const hoy = new Date().toLocaleDateString(); //[cite: 2]
    if (datosProgreso.fechaUltimoUpgrade !== hoy) { datosProgreso.upgradesHoy = 0; datosProgreso.fechaUltimoUpgrade = hoy; } //[cite: 2]

    if (datosProgreso.upgradesHoy >= MAX_UPGRADES_DIA) { //[cite: 2]
        mostrarMensajeEnPagina("¡Tu compañero ya descansó por hoy! Vuelve mañana.", false); return; //[cite: 2]
    }

    datosProgreso.nivel += 20; datosProgreso.upgradesHoy++; //[cite: 2]
    
    const emojiEl = document.getElementById('mascota-emoji'); //[cite: 2]
    emojiEl.style.transform = 'scale(1.4)'; setTimeout(() => emojiEl.style.transform = 'scale(1)', 400); //[cite: 2]

    guardarProgresoMascota(); actualizarUIMascota(); //[cite: 2]

    if (datosProgreso.nivel >= 100) { //[cite: 2]
        datosProgreso.logros.push({ tipo: datosProgreso.tipoActivo, fecha: hoy, id: Date.now() }); //[cite: 2]
        guardarProgresoMascota(); renderizarLogros(); //[cite: 2]
        document.getElementById('modal-selector-mascota').style.display = 'flex'; //[cite: 2]
    }
}

function seleccionarNuevaMascota(nuevoTipo) {
    datosProgreso.tipoActivo = nuevoTipo; datosProgreso.nivel = 0; //[cite: 2]
    guardarProgresoMascota(); actualizarUIMascota(); //[cite: 2]
    document.getElementById('modal-selector-mascota').style.display = 'none'; //[cite: 2]
}

function renderizarLogros() {
    const contenedor = document.getElementById('galeria-logros-contenedor'); //[cite: 2]
    const msgVacio = document.getElementById('mensaje-sin-logros'); //[cite: 2]
    if (!contenedor) return; //[cite: 2]
    if (datosProgreso.logros.length === 0) { if (msgVacio) msgVacio.style.display = 'block'; return; } //[cite: 2]
    if (msgVacio) msgVacio.style.display = 'none'; //[cite: 2]
    contenedor.innerHTML = ''; //[cite: 2]
    
    datosProgreso.logros.forEach((logro, index) => { //[cite: 2]
        const config = tiposMascotas[logro.tipo]; //[cite: 2]
        const numColeccion = (index + 1).toString().padStart(3, '0'); //[cite: 2]
        const div = document.createElement('div'); //[cite: 2]
        div.className = 'card-coleccion'; //[cite: 2]
        div.innerHTML = `
            <div class="card-coleccion-header">#${numColeccion} ${config.nombre}</div>
            <div class="card-coleccion-body"><div class="card-coleccion-emoji">${config.etapas[4]}</div></div>
            <div class="card-coleccion-footer"><span>${config.tipoIcon}</span> | <span>🗓️ ${logro.fecha}</span></div>
        `; //[cite: 2]
        contenedor.appendChild(div); //[cite: 2]
    });
}

// ==========================================
// VARIABLES GLOBALES Y FUNCIONES DE JUEGOS
// ==========================================
let intervaloRespiracion = null; //[cite: 2]
let emocionActual = ''; let juegoActivoTipo = ''; //[cite: 2]

// BANCO DE ROMPECABEZAS
const bancoImagenesIA = [
    { tipo: "🌄 Paisaje Inteligente", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80" }, //[cite: 2]
    { tipo: "🏙️ Ciudad del Futuro", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop&q=80" }, //[cite: 2]
    { tipo: "🎨 Arte Impresionista", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80" }, //[cite: 2]
    { tipo: "🌌 Galaxia Fantástica", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80" }, //[cite: 2]
    { tipo: "🧸 Animación e Ilustración", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80" } //[cite: 2]
];

// BANCO DE PREGUNTAS
const bancoPreguntas = [
    { p: "¿Qué es lo primero que debes hacer si te sientes muy abrumado?", o: ["Respirar hondo y tomar una pausa", "Seguir trabajando sin parar", "Enojarte con todos"], r: 0 }, //[cite: 2]
    { p: "Si un amigo te cuenta que está triste, ¿cómo puedes ayudarlo?", o: ["Decirle que no es para tanto", "Escucharlo sin juzgar", "Ignorarlo para que se le pase"], r: 1 }, //[cite: 2]
    { p: "Cuidar de tu salud mental significa...", o: ["Estar feliz las 24 horas del día", "Aceptar tus emociones y buscar apoyo", "Esconder lo que sientes"], r: 1 } //[cite: 2]
];

window.configEmociones = {
    feliz: { title: "¡Qué increíble verte así! 🌟", text: "Tu positividad y buena energía son contagiosas.", tips: ["Anota qué te hizo feliz hoy.", "Comparte tu alegría con alguien."], color: "#27AE60", emoji: "🤩", texto: "Feliz" }, //[cite: 2]
    ansiedad: { title: "Respira profundo", text: "Es normal sentir estrés. Enfócate en tu respiración.", tips: ["Inhala 4 segundos", "Exhala 6 segundos"], color: "#F2994A", emoji: "😰", texto: "Ansioso" }, //[cite: 2]
    tristeza: { title: "Es válido estar triste", text: "No tienes que fingir que todo está bien todo el tiempo.", tips: ["Escribe lo que sientes", "Escucha tu canción favorita"], color: "#9B51E0", emoji: "😢", texto: "Triste" }, //[cite: 2]
    enojo: { title: "Canaliza tu enojo", text: "El enojo nos avisa que algo nos incomoda.", tips: ["Sal a caminar un momento", "Dibuja líneas fuertes en un papel"], color: "#EB5757", emoji: "😡", texto: "Enojado" }, //[cite: 2]
    desmotivado: { title: "Escucha a tu cuerpo", text: "La desmotivación puede ser cansancio mental.", tips: ["Descansa sin pantallas", "Haz solo una acción muy pequeña hoy"], color: "#78909C", emoji: "😮‍💨", texto: "Cansado" } //[cite: 2]
};

function showAdvice(emotion) {
    emocionActual = emotion; //[cite: 2]
    const container = document.getElementById('advice-container'); //[cite: 2]
    const data = window.configEmociones[emotion]; //[cite: 2]
    document.getElementById('advice-title').textContent = data.title; //[cite: 2]
    document.getElementById('advice-title').style.color = data.color; //[cite: 2]
    container.style.borderLeftColor = data.color; //[cite: 2]
    document.getElementById('advice-text').textContent = data.text; //[cite: 2]
    
    const list = document.getElementById('advice-list'); list.innerHTML = ''; //[cite: 2]
    data.tips.forEach(tip => { const li = document.createElement('li'); li.textContent = tip; list.appendChild(li); }); //[cite: 2]
    container.style.display = 'block'; //[cite: 2]

    if (typeof window.guardarEmocionBD === "function") { window.guardarEmocionBD(emotion); } //[cite: 2]
    if (intervaloRespiracion) clearInterval(intervaloRespiracion); //[cite: 2]
    
    activarJuegoPorEmocion(emotion, false); //[cite: 2]

    const chatWindow = document.getElementById('chat-window'); //[cite: 2]
    if (chatWindow && chatWindow.style.display !== 'flex') { toggleChat(); } //[cite: 2]
}

function mostrarMensajeEnPagina(mensaje, exito = true) {
    const div = document.getElementById('resultado-juego'); //[cite: 2]
    div.innerText = mensaje; div.style.display = 'block'; //[cite: 2]
    div.style.backgroundColor = exito ? "#E8F5E9" : "#FFF3E0"; //[cite: 2]
    div.style.color = exito ? "#2E7D32" : "#E65100"; //[cite: 2]
    setTimeout(() => { div.style.display = 'none'; }, 5000); //[cite: 2]
}

// --- SISTEMAS DE JUEGOS ---
function iniciarRespiracionGuiada() {
    juegoActivoTipo = 'respiracion'; //[cite: 2]
    
    document.getElementById('btn-juego-parar').style.display = 'inline-block'; //[cite: 2]
    document.querySelector('.btn-reset').style.display = 'none'; //[cite: 2]
    document.querySelector('.btn-change').style.display = 'none'; //[cite: 2]

    const contenedor = document.getElementById('juego-interactivo'); //[cite: 2]
    contenedor.innerHTML = `
        <div class="breathing-instruction" id="texto-respiracion">Inhala</div>
        <div class="timer-number" id="tiempo-respiracion">4</div>
        <div class="progress-bar-container"><div class="progress-bar-fill" id="barra-respiracion" style="background: linear-gradient(90deg, #F2994A, #EB5757);"></div></div>
    `; //[cite: 2]
    
    let segundos = 4; let fase = 0;  //[cite: 2]
    let totalCiclos = 0; const MAX_CICLOS = 4; //[cite: 2]
    const fases = [{ txt: "Inhala...", bar: "100%" }, { txt: "Sostén...", bar: "100%" }, { txt: "Exhala...", bar: "0%" }, { txt: "Sostén...", bar: "0%" }]; //[cite: 2]
    
    const textoEl = document.getElementById('texto-respiracion'); //[cite: 2]
    const tiempoEl = document.getElementById('tiempo-respiracion'); //[cite: 2]
    const barraEl = document.getElementById('barra-respiracion'); //[cite: 2]
    
    if(intervaloRespiracion) clearInterval(intervaloRespiracion); //[cite: 2]
    
    barraEl.style.transition = 'none'; //[cite: 2]
    barraEl.style.width = "0%";  //[cite: 2]
    setTimeout(() => { 
        barraEl.style.transition = 'width 4s linear'; //[cite: 2]
        barraEl.style.width = "100%";  //[cite: 2]
    }, 50);

    intervaloRespiracion = setInterval(() => {
        segundos--; tiempoEl.innerText = segundos; //[cite: 2]
        if (segundos <= 0) { //[cite: 2]
            fase = (fase + 1) % 4; segundos = 4; //[cite: 2]
            textoEl.innerText = fases[fase].txt;  //[cite: 2]
            barraEl.style.width = fases[fase].bar; //[cite: 2]
            
            if (fase === 0) totalCiclos++; //[cite: 2]
            if (totalCiclos >= MAX_CICLOS) { //[cite: 2]
                clearInterval(intervaloRespiracion); //[cite: 2]
                restaurarBotonesJuego(); //[cite: 2]
                contenedor.innerHTML = `<div class="breathing-instruction" style="color: #27AE60;">¡Excelente! Tu cuerpo está más relajado.</div>`; //[cite: 2]
                mostrarMensajeEnPagina("Has completado tu respiración. Tu mascota está feliz."); mejorarMascota(); //[cite: 2]
            }
        }
    }, 1000);
}

function pararEjercicioRespiracion() {
    if(intervaloRespiracion) clearInterval(intervaloRespiracion); //[cite: 2]
    restaurarBotonesJuego(); //[cite: 2]
    const contenedor = document.getElementById('juego-interactivo'); //[cite: 2]
    contenedor.innerHTML = `<div class="breathing-instruction" style="color: #EB5757;">Ejercicio detenido por el usuario.</div>`; //[cite: 2]
    mostrarMensajeEnPagina("Ejercicio de respiración parado.", false); //[cite: 2]
    mejorarMascota();  //[cite: 2]
}

function restaurarBotonesJuego() {
    document.getElementById('btn-juego-parar').style.display = 'none'; //[cite: 2]
    document.querySelector('.btn-reset').style.display = 'inline-block'; //[cite: 2]
    document.querySelector('.btn-change').style.display = 'inline-block'; //[cite: 2]
}

function iniciarExplosionBurbujas(emocion) {
    juegoActivoTipo = 'burbujas'; //[cite: 2]
    
    const contenedor = document.getElementById('juego-interactivo'); //[cite: 2]
    contenedor.innerHTML = '<div class="bubble-grid" id="contenedor-burbujas"></div>'; //[cite: 2]
    const areaBurbujas = document.getElementById('contenedor-burbujas'); //[cite: 2]
    
    const colores = ["#EB5757", "#F2994A", "#9B51E0", "#2F80ED", "#27AE60"]; //[cite: 2]
    const emojis = ["🎈", "💙", "🌟", "🚀", "🦄", "🌸", "⭐"]; //[cite: 2]
    let burbujasReventadas = 0; const totalBurbujas = 10; //[cite: 2]
    
    for(let i=0; i<totalBurbujas; i++) { //[cite: 2]
        let btn = document.createElement('div'); //[cite: 2]
        btn.className = "happy-bubble";  //[cite: 2]
        btn.innerText = emojis[Math.floor(Math.random() * emojis.length)];  //[cite: 2]
        btn.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)]; //[cite: 2]
        
        let size = 50 + Math.random() * 40; //[cite: 2]
        btn.style.width = size + "px"; btn.style.height = size + "px"; btn.style.fontSize = (size * 0.5) + "px"; //[cite: 2]
        btn.style.animationDelay = (Math.random() * 2) + "s"; //[cite: 2]
        
        const reventar = function(e) {
            if (e && e.cancelable) e.preventDefault(); //[cite: 2]
            if (btn.classList.contains('popped')) return; //[cite: 2]
            
            btn.classList.add('popped'); //[cite: 2]
            
            setTimeout(() => { btn.style.display = 'none'; }, 250); //[cite: 2]

            burbujasReventadas++; //[cite: 2]
            if(burbujasReventadas >= totalBurbujas) { //[cite: 2]
                mostrarMensajeEnPagina("¡Toda esa energía negativa se ha esfumado!");  //[cite: 2]
                setTimeout(mejorarMascota, 800); //[cite: 2]
            }
        };

        btn.onmousedown = reventar; //[cite: 2]
        btn.ontouchstart = reventar; //[cite: 2]
        
        areaBurbujas.appendChild(btn); //[cite: 2]
    }
}

function iniciarRompecabezasIA() {
    juegoActivoTipo = 'puzzle'; //[cite: 2]
    const imagenElegida = bancoImagenesIA[Math.floor(Math.random() * bancoImagenesIA.length)]; //[cite: 2]
    document.getElementById('juego-descripcion').innerText = "Rearma este: " + imagenElegida.tipo; //[cite: 2]
    
    const contenedor = document.getElementById('juego-interactivo'); //[cite: 2]
    contenedor.innerHTML = `
        <div class="puzzle-board-container">
            <div class="puzzle-slots-grid" id="puzzle-tablero"></div>
            <div class="puzzle-pieces-pool" id="puzzle-piezas"></div>
        </div>
    `; //[cite: 2]
    
    const filas = 3; const columnas = 3;  //[cite: 2]
    const anchoTablero = 300; const altoTablero = 300; //[cite: 2]
    const anchoPieza = anchoTablero / columnas; const altoPieza = altoTablero / filas; //[cite: 2]
    
    const tablero = document.getElementById('puzzle-tablero'); //[cite: 2]
    tablero.style.gridTemplateColumns = `repeat(${columnas}, ${anchoPieza}px)`; //[cite: 2]
    tablero.style.gridTemplateRows = `repeat(${filas}, ${altoPieza}px)`; //[cite: 2]
    tablero.style.width = `${anchoTablero + 12}px`;  //[cite: 2]
    
    let idPieza = 0; let posiciones = []; //[cite: 2]
    for(let f=0; f<filas; f++) { //[cite: 2]
        for(let c=0; c<columnas; c++) { //[cite: 2]
            const slot = document.createElement('div'); //[cite: 2]
            slot.className = 'puzzle-slot'; slot.dataset.targetId = idPieza; //[cite: 2]
            slot.ondragover = (e) => e.preventDefault(); //[cite: 2]
            slot.ondrop = manejarDrop; //[cite: 2]
            tablero.appendChild(slot); //[cite: 2]
            posiciones.push({ id: idPieza, x: c * anchoPieza, y: f * altoPieza }); //[cite: 2]
            idPieza++; //[cite: 2]
        }
    }
    
    posiciones.sort(() => Math.random() - 0.5); //[cite: 2]
    const pool = document.getElementById('puzzle-piezas'); //[cite: 2]
    
    pool.ondragover = (e) => e.preventDefault(); //[cite: 2]
    pool.ondrop = manejarDrop; //[cite: 2]
    
    posiciones.forEach(pos => { //[cite: 2]
        const pieza = document.createElement('div'); //[cite: 2]
        pieza.className = 'puzzle-piece-canvas'; //[cite: 2]
        pieza.draggable = true; pieza.dataset.id = pos.id; //[cite: 2]
        pieza.style.width = `${anchoPieza}px`; pieza.style.height = `${altoPieza}px`; //[cite: 2]
        pieza.style.backgroundImage = `url(${imagenElegida.url})`; //[cite: 2]
        pieza.style.backgroundSize = `${anchoTablero}px ${altoTablero}px`; //[cite: 2]
        pieza.style.backgroundPosition = `-${pos.x}px -${pos.y}px`; //[cite: 2]
        
        pieza.ondragstart = (e) => { e.dataTransfer.setData('text/plain', pos.id); pieza.style.opacity = '0.5'; }; //[cite: 2]
        pieza.ondragend = () => { pieza.style.opacity = '1'; }; //[cite: 2]
        pool.appendChild(pieza); //[cite: 2]
    });
}

function manejarDrop(e) {
    e.preventDefault(); //[cite: 2]
    const idArrastrado = e.dataTransfer.getData('text/plain'); //[cite: 2]
    const piezaArrastrada = document.querySelector(`.puzzle-piece-canvas[data-id="${idArrastrado}"]`); //[cite: 2]
    if (!piezaArrastrada) return; //[cite: 2]
    
    const dropTarget = e.target; //[cite: 2]
    
    if (dropTarget.id === 'puzzle-piezas' || dropTarget.classList.contains('puzzle-pieces-pool')) { //[cite: 2]
        document.getElementById('puzzle-piezas').appendChild(piezaArrastrada); //[cite: 2]
        verificarRompecabezas(); //[cite: 2]
        return; //[cite: 2]
    }
    
    if (dropTarget.classList.contains('puzzle-piece-canvas') && dropTarget.parentElement.id === 'puzzle-piezas') { //[cite: 2]
        document.getElementById('puzzle-piezas').appendChild(piezaArrastrada); //[cite: 2]
        verificarRompecabezas(); //[cite: 2]
        return; //[cite: 2]
    }

    const targetSlot = dropTarget.closest('.puzzle-slot'); //[cite: 2]
    if (targetSlot && !targetSlot.hasChildNodes()) { //[cite: 2]
        targetSlot.appendChild(piezaArrastrada);  //[cite: 2]
        verificarRompecabezas(); //[cite: 2]
    }
}

function verificarRompecabezas() {
    const slots = document.querySelectorAll('.puzzle-slot'); //[cite: 2]
    let resuelto = true; //[cite: 2]
    slots.forEach(slot => { //[cite: 2]
        if (!slot.hasChildNodes()) resuelto = false; //[cite: 2]
        else { //[cite: 2]
            const piezaId = slot.firstChild.dataset.id; //[cite: 2]
            if (slot.dataset.targetId !== piezaId) resuelto = false; //[cite: 2]
        }
    });
    if (resuelto) { //[cite: 2]
        mostrarMensajeEnPagina("🎉 ¡Excelente trabajo! Completaste el arte y ordenaste tus ideas.");  //[cite: 2]
        setTimeout(mejorarMascota, 1500); //[cite: 2]
    }
}

function iniciarPreguntasReflexivas() {
    juegoActivoTipo = 'preguntas'; //[cite: 2]
    
    const contenedor = document.getElementById('juego-interactivo'); //[cite: 2]
    const preguntaRnd = bancoPreguntas[Math.floor(Math.random() * bancoPreguntas.length)]; //[cite: 2]
    
    contenedor.innerHTML = `
        <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;">${preguntaRnd.p}</p>
        <div id="opciones-contenedor" style="display: flex; flex-direction: column; gap: 10px; align-items: center;"></div>
    `; //[cite: 2]
    
    const opcionesDiv = document.getElementById('opciones-contenedor'); //[cite: 2]
    preguntaRnd.o.forEach((opcion, idx) => { //[cite: 2]
        const btn = document.createElement('button'); //[cite: 2]
        btn.innerText = opcion; //[cite: 2]
        btn.style.cssText = "padding: 10px 15px; width: 85%; max-width: 400px; border: 2px solid #2F80ED; background: white; color: #2F80ED; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.2s;"; //[cite: 2]
        
        btn.onclick = function() { //[cite: 2]
            const botones = opcionesDiv.querySelectorAll('button'); //[cite: 2]
            botones.forEach(b => b.disabled = true); //[cite: 2]
            
            if(idx === preguntaRnd.r) { //[cite: 2]
                btn.style.backgroundColor = "#27AE60"; btn.style.color = "white"; btn.style.borderColor = "#27AE60"; //[cite: 2]
                mostrarMensajeEnPagina("¡Excelente reflexión!"); setTimeout(mejorarMascota, 1000); //[cite: 2]
            } else { //[cite: 2]
                btn.style.backgroundColor = "#EB5757"; btn.style.color = "white"; btn.style.borderColor = "#EB5757"; //[cite: 2]
                botones[preguntaRnd.r].style.backgroundColor = "#27AE60"; botones[preguntaRnd.r].style.color = "white"; botones[preguntaRnd.r].style.borderColor = "#27AE60"; //[cite: 2]
                mostrarMensajeEnPagina("Inténtalo de nuevo para seguir aprendiendo.", false); //[cite: 2]
            }
        };
        opcionesDiv.appendChild(btn); //[cite: 2]
    });
}

function activarJuegoPorEmocion(emocion, esAleatorio) {
    const seccion = document.getElementById('seccion-juego'); seccion.style.display = 'block'; //[cite: 2]
    if(intervaloRespiracion) clearInterval(intervaloRespiracion); //[cite: 2]
    
    restaurarBotonesJuego(); //[cite: 2]

    if (esAleatorio) { //[cite: 2]
        const juegos = ['respiracion', 'burbujas', 'preguntas', 'puzzle']; //[cite: 2]
        const juegoRnd = juegos[Math.floor(Math.random() * juegos.length)]; //[cite: 2]
        
        if(juegoRnd === 'respiracion') { //[cite: 2]
            document.getElementById('juego-titulo-header').innerText = "🌿 Respira Profundo"; //[cite: 2]
            document.getElementById('juego-descripcion').innerText = "Tómate un minuto para calmar tu mente y cuerpo."; //[cite: 2]
            iniciarRespiracionGuiada(); //[cite: 2]
        } else if(juegoRnd === 'burbujas') { //[cite: 2]
            document.getElementById('juego-titulo-header').innerText = "🎈 Explosión de Estrés"; //[cite: 2]
            document.getElementById('juego-descripcion').innerText = "¡Libera esa energía negativa! Explotar globos es un gran alivio."; //[cite: 2]
            iniciarExplosionBurbujas(null); //[cite: 2]
        } else if(juegoRnd === 'puzzle') { //[cite: 2]
            document.getElementById('juego-titulo-header').innerText = "🧩 Rompecabezas Visual Relajante"; //[cite: 2]
            iniciarRompecabezasIA(); //[cite: 2]
        } else { //[cite: 2]
            document.getElementById('juego-titulo-header').innerText = "🧠 Preguntas Reflexivas"; //[cite: 2]
            document.getElementById('juego-descripcion').innerText = "Responde con honestidad para reflexionar sobre tu bienestar."; //[cite: 2]
            iniciarPreguntasReflexivas(); //[cite: 2]
        }
    } else { //[cite: 2]
        if (emocion === 'ansiedad') { //[cite: 2]
            document.getElementById('juego-titulo-header').innerText = "🌿 Control de Ansiedad"; //[cite: 2]
            document.getElementById('juego-descripcion').innerText = "Enfócate en tu respiración para reducir el estrés en 1 minuto."; //[cite: 2]
            iniciarRespiracionGuiada(); //[cite: 2]
        }
        else if (emocion === 'enojo') { //[cite: 2]
            document.getElementById('juego-titulo-header').innerText = "🎈 Globos de Frustración";  //[cite: 2]
            document.getElementById('juego-descripcion').innerText = "Haz clic rápido para explotar tu enojo antes de que se escapen.";  //[cite: 2]
            iniciarExplosionBurbujas(emocion); //[cite: 2]
        }
        else if (emocion === 'desmotivado' || emocion === 'tristeza') { //[cite: 2]
            if(Math.random() > 0.5) { //[cite: 2]
                document.getElementById('juego-titulo-header').innerText = "🧠 Reflexión de Estado de Ánimo"; //[cite: 2]
                document.getElementById('juego-descripcion').innerText = "Piensa en tu bienestar con estas preguntas clave."; //[cite: 2]
                iniciarPreguntasReflexivas(); //[cite: 2]
            } else { //[cite: 2]
                document.getElementById('juego-titulo-header').innerText = "🧩 Rompecabezas Visual Relajante"; //[cite: 2]
                iniciarRompecabezasIA(); //[cite: 2]
            }
        }
        else { //[cite: 2]
            document.getElementById('juego-titulo-header').innerText = "🌟 ¡Zona de Buenas Vibras!"; //[cite: 2]
            document.getElementById('juego-descripcion').innerText = "Te sientes genial hoy. ¡Toma un impulso extra para tu compañero!"; //[cite: 2]
            document.getElementById('juego-interactivo').innerHTML = `<button onclick="mostrarMensajeEnPagina('¡Energía positiva absorbida!'); mejorarMascota(); this.disabled=true;" style="padding:15px; font-size:1.2rem; background:#27AE60; color:white; border:none; border-radius:10px; cursor:pointer;">⚡ Enviar Energía a mi Mascota</button>`; //[cite: 2]
        }
    }
}

function reiniciarJuegoActual() {
    if (juegoActivoTipo === 'respiracion') { //[cite: 2]
        iniciarRespiracionGuiada(); //[cite: 2]
    } else if (juegoActivoTipo === 'burbujas') { //[cite: 2]
        iniciarExplosionBurbujas(emocionActual); //[cite: 2]
    } else if (juegoActivoTipo === 'puzzle') { //[cite: 2]
        iniciarRompecabezasIA(); //[cite: 2]
    } else if (juegoActivoTipo === 'preguntas') { //[cite: 2]
        iniciarPreguntasReflexivas(); //[cite: 2]
    } else { //[cite: 2]
        activarJuegoPorEmocion(emocionActual, false); //[cite: 2]
    }
}

function cambiarDeJuegoAleatorio() { activarJuegoPorEmocion('', true); } //[cite: 2]

// ==========================================
// CEREBRO AVANZADO DE ALEGRIA
// ==========================================
function toggleChat() {
    const chatWindow = document.getElementById('chat-window'); //[cite: 2]
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex'; //[cite: 2]
}

function handleKeyPress(event) { if (event.key === 'Enter') sendMessage(); } //[cite: 2]

function sendMessage() {
    const input = document.getElementById('chat-input'); //[cite: 2]
    const messageText = input.value.trim(); //[cite: 2]
    
    if (messageText !== "") { //[cite: 2]
        addChatBubble(messageText, 'user-message'); //[cite: 2]
        input.value = ''; //[cite: 2]
        
        document.getElementById('typing').style.display = 'block'; //[cite: 2]
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight; //[cite: 2]

        const delay = Math.floor(Math.random() * 1500) + 1000; //[cite: 2]
        setTimeout(() => { //[cite: 2]
            document.getElementById('typing').style.display = 'none'; //[cite: 2]
            procesarRespuestaIA(messageText.toLowerCase()); //[cite: 2]
        }, delay); //[cite: 2]
    }
}

function addChatBubble(text, className) {
    const chatMessages = document.getElementById('chat-messages'); //[cite: 2]
    const bubble = document.createElement('div'); //[cite: 2]
    bubble.classList.add('chat-bubble', className); //[cite: 2]
    bubble.textContent = text; //[cite: 2]
    chatMessages.appendChild(bubble); //[cite: 2]
    chatMessages.scrollTop = chatMessages.scrollHeight; //[cite: 2]
}

async function procesarRespuestaIA(textoUsuario) {
    try { //[cite: 2]
        const respuesta = await fetch('/api/chat', { //[cite: 2]
            method: 'POST', //[cite: 2]
            headers: { 'Content-Type': 'application/json' }, //[cite: 2]
            body: JSON.stringify({ mensaje: textoUsuario }) //[cite: 2]
        }); //[cite: 2]

        const datos = await respuesta.json(); //[cite: 2]
        addChatBubble(datos.respuesta, 'bot-message'); //[cite: 2]

    } catch (error) { //[cite: 2]
        addChatBubble("Uy, parece que perdí la conexión con mi servidor. Por favor revisa si la ventana negra está encendida.", 'bot-message'); //[cite: 2]
    }
}

function sendQuickReply(texto) { document.getElementById('chat-input').value = texto; sendMessage(); } //[cite: 2]

// ==========================================
// SEGURIDAD ANTIFISGONES
// ==========================================
document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); //[cite: 2]
});

document.addEventListener('keydown', function(e) {
    if ( //[cite: 2]
        e.key === 'F12' || //[cite: 2]
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || //[cite: 2]
        (e.ctrlKey && e.key === 'u') //[cite: 2]
    ) {
        e.preventDefault(); //[cite: 2]
    }
});
// =========================================
// COMPORTAMIENTO DEL DIARIO (Guardar)
// =========================================
async function guardarDiario() {
    const textarea = document.getElementById('diary-text'); //[cite: 2]
    const texto = textarea.value.trim(); //[cite: 2]
    const mensajeDiv = document.getElementById('diary-message'); //[cite: 2]
    const btn = document.getElementById('btn-save-diary'); //[cite: 2]

    if (texto === "") { //[cite: 2]
        mensajeDiv.style.color = "#dc2626"; //[cite: 2]
        mensajeDiv.textContent = "Por favor, escribe algo antes de guardar."; //[cite: 2]
        mensajeDiv.style.display = "block"; //[cite: 2]
        return; //[cite: 2]
    }

    btn.textContent = "Guardando... ⏳"; //[cite: 2]
    btn.disabled = true; //[cite: 2]

    try { //[cite: 2]
        await window.guardarEntradaEnFirebase(texto); //[cite: 2]
        
        textarea.value = ""; //[cite: 2]
        mensajeDiv.style.color = "#16a34a"; //[cite: 2]
        mensajeDiv.textContent = "¡Tu entrada ha sido guardada con éxito! ✨"; //[cite: 2]
        mensajeDiv.style.display = "block"; //[cite: 2]
        
        cargarHistorialDiario(); //[cite: 2]
        
        setTimeout(() => { mensajeDiv.style.display = "none"; }, 4000); //[cite: 2]
    } catch (error) { //[cite: 2]
        mensajeDiv.style.color = "#dc2626"; //[cite: 2]
        mensajeDiv.textContent = error.message || "Hubo un error al guardar."; //[cite: 2]
        mensajeDiv.style.display = "block"; //[cite: 2]
    } finally { //[cite: 2]
        btn.textContent = "Guardar Entrada"; //[cite: 2]
        btn.disabled = false; //[cite: 2]
    }
}

// =========================================
// SISTEMA DE PÁGINAS DEL DIARIO (Leer y Hojear)
// =========================================
let fechaVisionDiario = new Date(); //[cite: 2]

function cambiarDiaDiario(dias) {
    fechaVisionDiario.setDate(fechaVisionDiario.getDate() + dias); //[cite: 2]
    cargarHistorialDiario(); //[cite: 2]
}

async function cargarHistorialDiario() {
    const historialContenedor = document.getElementById('historial-diario'); //[cite: 2]
    const textoFecha = document.getElementById('diario-fecha-texto'); //[cite: 2]
    const btnSiguiente = document.getElementById('btn-diario-siguiente'); //[cite: 2]
    const zonaEscritura = document.getElementById('zona-escritura-diario'); //[cite: 2]
    if (!historialContenedor) return; //[cite: 2]

    historialContenedor.classList.remove('page-turn-animation'); //[cite: 2]
    void historialContenedor.offsetWidth; //[cite: 2]
    historialContenedor.classList.add('page-turn-animation'); //[cite: 2]
    historialContenedor.className = "notebook-page page-turn-animation"; //[cite: 2]

    const hoy = new Date(); //[cite: 2]
    const esHoy = fechaVisionDiario.toLocaleDateString() === hoy.toLocaleDateString(); //[cite: 2]
    
    const opcionesMes = { month: 'long' }; //[cite: 2]
    const diaNum = fechaVisionDiario.getDate(); //[cite: 2]
    let mesTexto = fechaVisionDiario.toLocaleDateString('es-ES', opcionesMes); //[cite: 2]
    mesTexto = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1); //[cite: 2]
    
    textoFecha.textContent = `${diaNum} De ${mesTexto}`; //[cite: 2]

    if (esHoy) { //[cite: 2]
        textoFecha.textContent += " (Hoy)"; //[cite: 2]
        btnSiguiente.style.visibility = "hidden"; //[cite: 2]
        zonaEscritura.style.display = "block"; //[cite: 2]
    } else { //[cite: 2]
        btnSiguiente.style.visibility = "visible"; //[cite: 2]
        zonaEscritura.style.display = "none";  //[cite: 2]
    }

    historialContenedor.innerHTML = "<p style='text-align: center; color: #888; line-height: 32px;'>Pasando página... 📖</p>"; //[cite: 2]

    try { //[cite: 2]
        const entradas = await window.obtenerEntradasDiarioPorFecha(fechaVisionDiario); //[cite: 2]
        historialContenedor.innerHTML = "";  //[cite: 2]

        if (entradas.length === 0) { //[cite: 2]
            historialContenedor.innerHTML = "<p style='text-align: center; color: #888; font-style: italic; line-height: 32px;'>Esta página está en blanco.</p>"; //[cite: 2]
            return; //[cite: 2]
        }

        entradas.forEach(entrada => { //[cite: 2]
            const hora = entrada.fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); //[cite: 2]
            
            const div = document.createElement('div'); //[cite: 2]
            div.className = "notebook-entry"; //[cite: 2]

            div.innerHTML = `
                <div class="notebook-time">${hora}</div>
                <div class="notebook-content">${entrada.contenido}</div>
            `; //[cite: 2]
            historialContenedor.appendChild(div); //[cite: 2]
        });
    } catch (error) { //[cite: 2]
        console.error(error); //[cite: 2]
        historialContenedor.innerHTML = "<p style='text-align: center; color: #dc2626; line-height: 32px;'>Error al leer la página.</p>"; //[cite: 2]
    }
}

// ==========================================
// ⚙️ LÓGICA DEL PANEL DE ADMINISTRADOR (NUEVO)
// ==========================================
const CONTRASEÑA_ADMIN_SECRETA = "Admin1234"; // 👈 Tu clave de acceso

function handleAdminKey(event) {
    if (event.key === 'Enter') verificarAccesoAdmin();
}

function verificarAccesoAdmin() {
    const inputPass = document.getElementById('admin-pass-input');
    const txtError = document.getElementById('admin-login-error');
    const loginSection = document.getElementById('admin-login-section');
    const dashboardSection = document.getElementById('admin-dashboard-section');

    if (inputPass.value === CONTRASEÑA_ADMIN_SECRETA) {
        txtError.style.display = "none";
        loginSection.style.display = "none";
        dashboardSection.style.display = "block";
        inputPass.value = ""; 
        
        cargarMetricasAdmin();
    } else {
        txtError.textContent = "Contraseña incorrecta. 🔒";
        txtError.style.display = "block";
        inputPass.value = "";
    }
}

async function cargarMetricasAdmin() {
    const tabla = document.getElementById('tabla-admin-emociones');
    const totalEl = document.getElementById('stat-total-emociones');
    const fechaEl = document.getElementById('stat-ultima-fecha');
    
    if (!tabla) return;
    tabla.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>Cargando datos de Firebase... ⏳</td></tr>";

    try {
        const registros = [
            { usuario: "juan.perez@email.com", emocion: "ansiedad", fecha: "08/07/2026 15:30" },
            { usuario: "maria.lopez@email.com", emocion: "feliz", fecha: "08/07/2026 18:45" },
            { usuario: "carlos.g@email.com", emocion: "tristeza", fecha: "08/07/2026 20:10" }
        ];

        totalEl.textContent = registros.length;
        if(registros.length > 0) {
            fechaEl.textContent = registros[0].fecha.split(' ')[0];
        }

        tabla.innerHTML = "";
        registros.forEach(reg => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4338ca;">${reg.usuario}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${reg.emocion}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${reg.fecha}</td>
            `;
            tabla.appendChild(tr);
        });

    } catch (error) {
        console.error("Error cargando panel:", error);
        tabla.innerHTML = "<tr><td colspan='3' style='text-align:center; color:#ef4444;'>Error al cargar los datos.</td></tr>";
    }
}
