function toggleSidebar() { document.getElementById('sidebar').classList.toggle('expanded'); document.body.classList.toggle('sidebar-expanded'); }
function abrirModal(id) { document.getElementById(id).style.display = 'flex'; }
function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(event) { if (event.target.classList.contains('modal-overlay')) event.target.style.display = "none"; }

// ==========================================
// CEREBRO DE LA MASCOTA
// ==========================================
const MAX_UPGRADES_DIA = 3;
const tiposMascotas = {
    planta: { nombre: "Planta de Paz", tipoIcon: "🌿 Naturaleza", etapas: ["🌱", "🌿", "🪴", "🌳", "✨🌳✨"] },
    perro: { nombre: "Perrito Fiel", tipoIcon: "🐾 Lealtad", etapas: ["🦴", "🐕‍🦺", "🐕", "🐩", "✨🐶✨"] },
    gato: { nombre: "Gatito Zen", tipoIcon: "🌙 Misterio", etapas: ["🥛", "🐈‍⬛", "🐈", "🐅", "✨🐱✨"] },
    loro: { nombre: "Loro Sabio", tipoIcon: "🦜 Inteligencia", etapas: ["🥚", "🐣", "🐥", "🦜", "✨🐦✨"] }
};

let datosProgreso = {
    tipoActivo: 'planta',
    nivel: 0,
    fechaUltimoUpgrade: new Date().toLocaleDateString(),
    upgradesHoy: 0,
    logros: []
};

window.sincronizarMascotaUI = function(datosRemotos) {
    const hoy = new Date().toLocaleDateString();
    if (datosRemotos) { datosProgreso = datosRemotos; } 
    else { datosProgreso = JSON.parse(localStorage.getItem('alegria_mascota_data')) || { tipoActivo: 'planta', nivel: 0, fechaUltimoUpgrade: hoy, upgradesHoy: 0, logros: [] }; }

    if (datosProgreso.fechaUltimoUpgrade !== hoy) {
        datosProgreso.upgradesHoy = 0; datosProgreso.fechaUltimoUpgrade = hoy;
        guardarProgresoMascota(); 
    }

    actualizarUIMascota(); renderizarLogros();
};

function guardarProgresoMascota() {
    localStorage.setItem('alegria_mascota_data', JSON.stringify(datosProgreso));
    if (typeof window.guardarMascotaBD === "function") { window.guardarMascotaBD(datosProgreso); }
}

function actualizarUIMascota() {
    const config = tiposMascotas[datosProgreso.tipoActivo];
    const indiceEtapa = Math.min(4, Math.floor(datosProgreso.nivel / 25));
    document.getElementById('mascota-emoji').innerText = config.etapas[indiceEtapa];
    document.getElementById('mascota-progreso').style.width = datosProgreso.nivel + '%';
    document.getElementById('mascota-limite-texto').innerText = `${datosProgreso.upgradesHoy}/${MAX_UPGRADES_DIA} Hoy`;

    const textoEl = document.getElementById('mascota-texto');
    if (datosProgreso.nivel < 40) textoEl.innerText = "Fase 1: Inicio";
    else if (datosProgreso.nivel < 80) textoEl.innerText = "Fase 2: Creciendo";
    else if (datosProgreso.nivel < 100) textoEl.innerText = "Fase 3: Casi listo";
    else textoEl.innerText = "¡Completado!";
}

function mejorarMascota() {
    if (datosProgreso.nivel >= 100) return;
    const hoy = new Date().toLocaleDateString();
    if (datosProgreso.fechaUltimoUpgrade !== hoy) { datosProgreso.upgradesHoy = 0; datosProgreso.fechaUltimoUpgrade = hoy; }

    if (datosProgreso.upgradesHoy >= MAX_UPGRADES_DIA) {
        mostrarMensajeEnPagina("¡Tu compañero ya descansó por hoy! Vuelve mañana.", false); return;
    }

    datosProgreso.nivel += 20; datosProgreso.upgradesHoy++;
    
    const emojiEl = document.getElementById('mascota-emoji');
    emojiEl.style.transform = 'scale(1.4)'; setTimeout(() => emojiEl.style.transform = 'scale(1)', 400);

    guardarProgresoMascota(); actualizarUIMascota();

    if (datosProgreso.nivel >= 100) {
        datosProgreso.logros.push({ tipo: datosProgreso.tipoActivo, fecha: hoy, id: Date.now() });
        guardarProgresoMascota(); renderizarLogros();
        document.getElementById('modal-selector-mascota').style.display = 'flex';
    }
}

function seleccionarNuevaMascota(nuevoTipo) {
    datosProgreso.tipoActivo = nuevoTipo; datosProgreso.nivel = 0;
    guardarProgresoMascota(); actualizarUIMascota();
    document.getElementById('modal-selector-mascota').style.display = 'none';
}

function renderizarLogros() {
    const contenedor = document.getElementById('galeria-logros-contenedor');
    const msgVacio = document.getElementById('mensaje-sin-logros');
    if (!contenedor) return;
    if (datosProgreso.logros.length === 0) { if (msgVacio) msgVacio.style.display = 'block'; return; }
    if (msgVacio) msgVacio.style.display = 'none';
    contenedor.innerHTML = '';
    
    datosProgreso.logros.forEach((logro, index) => {
        const config = tiposMascotas[logro.tipo];
        const numColeccion = (index + 1).toString().padStart(3, '0');
        const div = document.createElement('div');
        div.className = 'card-coleccion';
        div.innerHTML = `
            <div class="card-coleccion-header">#${numColeccion} ${config.nombre}</div>
            <div class="card-coleccion-body"><div class="card-coleccion-emoji">${config.etapas[4]}</div></div>
            <div class="card-coleccion-footer"><span>${config.tipoIcon}</span> | <span>🗓️ ${logro.fecha}</span></div>
        `;
        contenedor.appendChild(div);
    });
}

// ==========================================
// VARIABLES GLOBALES Y FUNCIONES DE JUEGOS
// ==========================================
let intervaloRespiracion = null;
let emocionActual = ''; let juegoActivoTipo = ''; 

// BANCO DE ROMPECABEZAS
const bancoImagenesIA = [
    { tipo: "🌄 Paisaje Inteligente", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80" },
    { tipo: "🏙️ Ciudad del Futuro", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop&q=80" },
    { tipo: "🎨 Arte Impresionista", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80" },
    { tipo: "🌌 Galaxia Fantástica", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80" },
    { tipo: "🧸 Animación e Ilustración", url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80" }
];

// BANCO DE PREGUNTAS
const bancoPreguntas = [
    { p: "¿Qué es lo primero que debes hacer si te sientes muy abrumado?", o: ["Respirar hondo y tomar una pausa", "Seguir trabajando sin parar", "Enojarte con todos"], r: 0 },
    { p: "Si un amigo te cuenta que está triste, ¿cómo puedes ayudarlo?", o: ["Decirle que no es para tanto", "Escucharlo sin juzgar", "Ignorarlo para que se le pase"], r: 1 },
    { p: "Cuidar de tu salud mental significa...", o: ["Estar feliz las 24 horas del día", "Aceptar tus emociones y buscar apoyo", "Esconder lo que sientes"], r: 1 }
];

window.configEmociones = {
    feliz: { title: "¡Qué increíble verte así! 🌟", text: "Tu positividad y buena energía son contagiosas.", tips: ["Anota qué te hizo feliz hoy.", "Comparte tu alegría con alguien."], color: "#27AE60", emoji: "🤩", texto: "Feliz" },
    ansiedad: { title: "Respira profundo", text: "Es normal sentir estrés. Enfócate en tu respiración.", tips: ["Inhala 4 segundos", "Exhala 6 segundos"], color: "#F2994A", emoji: "😰", texto: "Ansioso" },
    tristeza: { title: "Es válido estar triste", text: "No tienes que fingir que todo está bien todo el tiempo.", tips: ["Escribe lo que sientes", "Escucha tu canción favorita"], color: "#9B51E0", emoji: "😢", texto: "Triste" },
    enojo: { title: "Canaliza tu enojo", text: "El enojo nos avisa que algo nos incomoda.", tips: ["Sal a caminar un momento", "Dibuja líneas fuertes en un papel"], color: "#EB5757", emoji: "😡", texto: "Enojado" },
    desmotivado: { title: "Escucha a tu cuerpo", text: "La desmotivación puede ser cansancio mental.", tips: ["Descansa sin pantallas", "Haz solo una acción muy pequeña hoy"], color: "#78909C", emoji: "😮‍💨", texto: "Cansado" }
};

function showAdvice(emotion) {
    emocionActual = emotion;
    const container = document.getElementById('advice-container');
    const data = window.configEmociones[emotion];
    document.getElementById('advice-title').textContent = data.title;
    document.getElementById('advice-title').style.color = data.color;
    container.style.borderLeftColor = data.color;
    document.getElementById('advice-text').textContent = data.text;
    
    const list = document.getElementById('advice-list'); list.innerHTML = '';
    data.tips.forEach(tip => { const li = document.createElement('li'); li.textContent = tip; list.appendChild(li); });
    container.style.display = 'block';

    if (typeof window.guardarEmocionBD === "function") { window.guardarEmocionBD(emotion); }
    if (intervaloRespiracion) clearInterval(intervaloRespiracion);
    
    activarJuegoPorEmocion(emotion, false);

    const chatWindow = document.getElementById('chat-window');
    if (chatWindow && chatWindow.style.display !== 'flex') { toggleChat(); }
}

function mostrarMensajeEnPagina(mensaje, exito = true) {
    const div = document.getElementById('resultado-juego');
    div.innerText = mensaje; div.style.display = 'block';
    div.style.backgroundColor = exito ? "#E8F5E9" : "#FFF3E0";
    div.style.color = exito ? "#2E7D32" : "#E65100";
    setTimeout(() => { div.style.display = 'none'; }, 5000);
}

// --- SISTEMAS DE JUEGOS ---
function iniciarRespiracionGuiada() {
    juegoActivoTipo = 'respiracion';
    
    document.getElementById('btn-juego-parar').style.display = 'inline-block';
    document.querySelector('.btn-reset').style.display = 'none';
    document.querySelector('.btn-change').style.display = 'none';

    const contenedor = document.getElementById('juego-interactivo');
    contenedor.innerHTML = `
        <div class="breathing-instruction" id="texto-respiracion">Inhala</div>
        <div class="timer-number" id="tiempo-respiracion">4</div>
        <div class="progress-bar-container"><div class="progress-bar-fill" id="barra-respiracion" style="background: linear-gradient(90deg, #F2994A, #EB5757);"></div></div>
    `;
    
    let segundos = 4; let fase = 0; 
    let totalCiclos = 0; const MAX_CICLOS = 4;
    const fases = [{ txt: "Inhala...", bar: "100%" }, { txt: "Sostén...", bar: "100%" }, { txt: "Exhala...", bar: "0%" }, { txt: "Sostén...", bar: "0%" }];
    
    const textoEl = document.getElementById('texto-respiracion');
    const tiempoEl = document.getElementById('tiempo-respiracion');
    const barraEl = document.getElementById('barra-respiracion');
    
    if(intervaloRespiracion) clearInterval(intervaloRespiracion);
    
    barraEl.style.transition = 'none';
    barraEl.style.width = "0%"; 
    setTimeout(() => { 
        barraEl.style.transition = 'width 4s linear';
        barraEl.style.width = "100%"; 
    }, 50);

    intervaloRespiracion = setInterval(() => {
        segundos--; tiempoEl.innerText = segundos;
        if (segundos <= 0) {
            fase = (fase + 1) % 4; segundos = 4;
            textoEl.innerText = fases[fase].txt; 
            barraEl.style.width = fases[fase].bar;
            
            if (fase === 0) totalCiclos++;
            if (totalCiclos >= MAX_CICLOS) {
                clearInterval(intervaloRespiracion);
                restaurarBotonesJuego();
                contenedor.innerHTML = `<div class="breathing-instruction" style="color: #27AE60;">¡Excelente! Tu cuerpo está más relajado.</div>`;
                mostrarMensajeEnPagina("Has completado tu respiración. Tu mascota está feliz."); mejorarMascota();
            }
        }
    }, 1000);
}

function pararEjercicioRespiracion() {
    if(intervaloRespiracion) clearInterval(intervaloRespiracion);
    restaurarBotonesJuego();
    const contenedor = document.getElementById('juego-interactivo');
    contenedor.innerHTML = `<div class="breathing-instruction" style="color: #EB5757;">Ejercicio detenido por el usuario.</div>`;
    mostrarMensajeEnPagina("Ejercicio de respiración parado.", false);
    mejorarMascota(); 
}

function restaurarBotonesJuego() {
    document.getElementById('btn-juego-parar').style.display = 'none';
    document.querySelector('.btn-reset').style.display = 'inline-block';
    document.querySelector('.btn-change').style.display = 'inline-block';
}

function iniciarExplosionBurbujas(emocion) {
    juegoActivoTipo = 'burbujas';
    
    const contenedor = document.getElementById('juego-interactivo');
    contenedor.innerHTML = '<div class="bubble-grid" id="contenedor-burbujas"></div>';
    const areaBurbujas = document.getElementById('contenedor-burbujas');
    
    const colores = ["#EB5757", "#F2994A", "#9B51E0", "#2F80ED", "#27AE60"];
    const emojis = ["🎈", "💙", "🌟", "🚀", "🦄", "🌸", "⭐"];
    let burbujasReventadas = 0; const totalBurbujas = 10;
    
    for(let i=0; i<totalBurbujas; i++) {
        let btn = document.createElement('div');
        btn.className = "happy-bubble"; 
        btn.innerText = emojis[Math.floor(Math.random() * emojis.length)]; 
        btn.style.backgroundColor = colores[Math.floor(Math.random() * colores.length)];
        
        let size = 50 + Math.random() * 40;
        btn.style.width = size + "px"; btn.style.height = size + "px"; btn.style.fontSize = (size * 0.5) + "px";
        btn.style.animationDelay = (Math.random() * 2) + "s";
        
        const reventar = function(e) {
            if (e && e.cancelable) e.preventDefault();
            if (btn.classList.contains('popped')) return;
            
            btn.classList.add('popped');
            
            setTimeout(() => { btn.style.display = 'none'; }, 250);

            burbujasReventadas++;
            if(burbujasReventadas >= totalBurbujas) {
                mostrarMensajeEnPagina("¡Toda esa energía negativa se ha esfumado!"); 
                setTimeout(mejorarMascota, 800);
            }
        };

        btn.onmousedown = reventar;
        btn.ontouchstart = reventar;
        
        areaBurbujas.appendChild(btn);
    }
}

function iniciarRompecabezasIA() {
    juegoActivoTipo = 'puzzle';
    const imagenElegida = bancoImagenesIA[Math.floor(Math.random() * bancoImagenesIA.length)];
    document.getElementById('juego-descripcion').innerText = "Rearma este: " + imagenElegida.tipo;
    
    const contenedor = document.getElementById('juego-interactivo');
    contenedor.innerHTML = `
        <div class="puzzle-board-container">
            <div class="puzzle-slots-grid" id="puzzle-tablero"></div>
            <div class="puzzle-pieces-pool" id="puzzle-piezas"></div>
        </div>
    `;
    
    const filas = 3; const columnas = 3; 
    const anchoTablero = 300; const altoTablero = 300;
    const anchoPieza = anchoTablero / columnas; const altoPieza = altoTablero / filas;
    
    const tablero = document.getElementById('puzzle-tablero');
    tablero.style.gridTemplateColumns = `repeat(${columnas}, ${anchoPieza}px)`;
    tablero.style.gridTemplateRows = `repeat(${filas}, ${altoPieza}px)`;
    tablero.style.width = `${anchoTablero + 12}px`; 
    
    let idPieza = 0; let posiciones = [];
    for(let f=0; f<filas; f++) {
        for(let c=0; c<columnas; c++) {
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot'; slot.dataset.targetId = idPieza;
            slot.ondragover = (e) => e.preventDefault();
            slot.ondrop = manejarDrop;
            tablero.appendChild(slot);
            posiciones.push({ id: idPieza, x: c * anchoPieza, y: f * altoPieza });
            idPieza++;
        }
    }
    
    posiciones.sort(() => Math.random() - 0.5);
    const pool = document.getElementById('puzzle-piezas');
    
    pool.ondragover = (e) => e.preventDefault();
    pool.ondrop = manejarDrop;
    
    posiciones.forEach(pos => {
        const pieza = document.createElement('div');
        pieza.className = 'puzzle-piece-canvas';
        pieza.draggable = true; pieza.dataset.id = pos.id;
        pieza.style.width = `${anchoPieza}px`; pieza.style.height = `${altoPieza}px`;
        pieza.style.backgroundImage = `url(${imagenElegida.url})`;
        pieza.style.backgroundSize = `${anchoTablero}px ${altoTablero}px`;
        pieza.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
        
        pieza.ondragstart = (e) => { e.dataTransfer.setData('text/plain', pos.id); pieza.style.opacity = '0.5'; };
        pieza.ondragend = () => { pieza.style.opacity = '1'; };
        pool.appendChild(pieza);
    });
}

function manejarDrop(e) {
    e.preventDefault();
    const idArrastrado = e.dataTransfer.getData('text/plain');
    const piezaArrastrada = document.querySelector(`.puzzle-piece-canvas[data-id="${idArrastrado}"]`);
    if (!piezaArrastrada) return;
    
    const dropTarget = e.target;
    
    if (dropTarget.id === 'puzzle-piezas' || dropTarget.classList.contains('puzzle-pieces-pool')) {
        document.getElementById('puzzle-piezas').appendChild(piezaArrastrada);
        verificarRompecabezas();
        return;
    }
    
    if (dropTarget.classList.contains('puzzle-piece-canvas') && dropTarget.parentElement.id === 'puzzle-piezas') {
        document.getElementById('puzzle-piezas').appendChild(piezaArrastrada);
        verificarRompecabezas();
        return;
    }

    const targetSlot = dropTarget.closest('.puzzle-slot');
    if (targetSlot && !targetSlot.hasChildNodes()) {
        targetSlot.appendChild(piezaArrastrada); 
        verificarRompecabezas();
    }
}

function verificarRompecabezas() {
    const slots = document.querySelectorAll('.puzzle-slot');
    let resuelto = true;
    slots.forEach(slot => {
        if (!slot.hasChildNodes()) resuelto = false;
        else {
            const piezaId = slot.firstChild.dataset.id;
            if (slot.dataset.targetId !== piezaId) resuelto = false;
        }
    });
    if (resuelto) {
        mostrarMensajeEnPagina("🎉 ¡Excelente trabajo! Completaste el arte y ordenaste tus ideas."); 
        setTimeout(mejorarMascota, 1500);
    }
}

function iniciarPreguntasReflexivas() {
    juegoActivoTipo = 'preguntas';
    
    const contenedor = document.getElementById('juego-interactivo');
    const preguntaRnd = bancoPreguntas[Math.floor(Math.random() * bancoPreguntas.length)];
    
    contenedor.innerHTML = `
        <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;">${preguntaRnd.p}</p>
        <div id="opciones-contenedor" style="display: flex; flex-direction: column; gap: 10px; align-items: center;"></div>
    `;
    
    const opcionesDiv = document.getElementById('opciones-contenedor');
    preguntaRnd.o.forEach((opcion, idx) => {
        const btn = document.createElement('button');
        btn.innerText = opcion;
        btn.style.cssText = "padding: 10px 15px; width: 85%; max-width: 400px; border: 2px solid #2F80ED; background: white; color: #2F80ED; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.2s;";
        
        btn.onclick = function() {
            const botones = opcionesDiv.querySelectorAll('button');
            botones.forEach(b => b.disabled = true);
            
            if(idx === preguntaRnd.r) {
                btn.style.backgroundColor = "#27AE60"; btn.style.color = "white"; btn.style.borderColor = "#27AE60";
                mostrarMensajeEnPagina("¡Excelente reflexión!"); setTimeout(mejorarMascota, 1000);
            } else {
                btn.style.backgroundColor = "#EB5757"; btn.style.color = "white"; btn.style.borderColor = "#EB5757";
                botones[preguntaRnd.r].style.backgroundColor = "#27AE60"; botones[preguntaRnd.r].style.color = "white"; botones[preguntaRnd.r].style.borderColor = "#27AE60";
                mostrarMensajeEnPagina("Inténtalo de nuevo para seguir aprendiendo.", false);
            }
        };
        opcionesDiv.appendChild(btn);
    });
}

function activarJuegoPorEmocion(emocion, esAleatorio) {
    const seccion = document.getElementById('seccion-juego'); seccion.style.display = 'block';
    if(intervaloRespiracion) clearInterval(intervaloRespiracion);
    
    restaurarBotonesJuego();

    if (esAleatorio) {
        const juegos = ['respiracion', 'burbujas', 'preguntas', 'puzzle'];
        const juegoRnd = juegos[Math.floor(Math.random() * juegos.length)];
        
        if(juegoRnd === 'respiracion') {
            document.getElementById('juego-titulo-header').innerText = "🌿 Respira Profundo";
            document.getElementById('juego-descripcion').innerText = "Tómate un minuto para calmar tu mente y cuerpo.";
            iniciarRespiracionGuiada();
        } else if(juegoRnd === 'burbujas') {
            document.getElementById('juego-titulo-header').innerText = "🎈 Explosión de Estrés";
            document.getElementById('juego-descripcion').innerText = "¡Libera esa energía negativa! Explotar globos es un gran alivio.";
            iniciarExplosionBurbujas(null);
        } else if(juegoRnd === 'puzzle') {
            document.getElementById('juego-titulo-header').innerText = "🧩 Rompecabezas Visual Relajante";
            iniciarRompecabezasIA();
        } else {
            document.getElementById('juego-titulo-header').innerText = "🧠 Preguntas Reflexivas";
            document.getElementById('juego-descripcion').innerText = "Responde con honestidad para reflexionar sobre tu bienestar.";
            iniciarPreguntasReflexivas();
        }
    } else {
        if (emocion === 'ansiedad') {
            document.getElementById('juego-titulo-header').innerText = "🌿 Control de Ansiedad";
            document.getElementById('juego-descripcion').innerText = "Enfócate en tu respiración para reducir el estrés en 1 minuto.";
            iniciarRespiracionGuiada();
        }
        else if (emocion === 'enojo') {
            document.getElementById('juego-titulo-header').innerText = "🎈 Globos de Frustración"; 
            document.getElementById('juego-descripcion').innerText = "Haz clic rápido para explotar tu enojo antes de que se escapen."; 
            iniciarExplosionBurbujas(emocion);
        }
        else if (emocion === 'desmotivado' || emocion === 'tristeza') {
            if(Math.random() > 0.5) {
                document.getElementById('juego-titulo-header').innerText = "🧠 Reflexión de Estado de Ánimo";
                document.getElementById('juego-descripcion').innerText = "Piensa en tu bienestar con estas preguntas clave.";
                iniciarPreguntasReflexivas();
            } else {
                document.getElementById('juego-titulo-header').innerText = "🧩 Rompecabezas Visual Relajante";
                iniciarRompecabezasIA();
            }
        }
        else {
            document.getElementById('juego-titulo-header').innerText = "🌟 ¡Zona de Buenas Vibras!";
            document.getElementById('juego-descripcion').innerText = "Te sientes genial hoy. ¡Toma un impulso extra para tu compañero!";
            document.getElementById('juego-interactivo').innerHTML = `<button onclick="mostrarMensajeEnPagina('¡Energía positiva absorbida!'); mejorarMascota(); this.disabled=true;" style="padding:15px; font-size:1.2rem; background:#27AE60; color:white; border:none; border-radius:10px; cursor:pointer;">⚡ Enviar Energía a mi Mascota</button>`;
        }
    }
}

function reiniciarJuegoActual() {
    if (juegoActivoTipo === 'respiracion') {
        iniciarRespiracionGuiada();
    } else if (juegoActivoTipo === 'burbujas') {
        iniciarExplosionBurbujas(emocionActual);
    } else if (juegoActivoTipo === 'puzzle') {
        iniciarRompecabezasIA();
    } else if (juegoActivoTipo === 'preguntas') {
        iniciarPreguntasReflexivas();
    } else {
        activarJuegoPorEmocion(emocionActual, false);
    }
}

function cambiarDeJuegoAleatorio() { activarJuegoPorEmocion('', true); }

// ==========================================
// CEREBRO AVANZADO DE ALEGRIA
// ==========================================
function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
}

function handleKeyPress(event) { if (event.key === 'Enter') sendMessage(); }

function sendMessage() {
    const input = document.getElementById('chat-input');
    const messageText = input.value.trim();
    
    if (messageText !== "") {
        addChatBubble(messageText, 'user-message');
        input.value = '';
        
        document.getElementById('typing').style.display = 'block';
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;

        const delay = Math.floor(Math.random() * 1500) + 1000;
        setTimeout(() => {
            document.getElementById('typing').style.display = 'none';
            procesarRespuestaIA(messageText.toLowerCase());
        }, delay);
    }
}

function addChatBubble(text, className) {
    const chatMessages = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', className);
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function procesarRespuestaIA(textoUsuario) {
    try {
        const respuesta = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje: textoUsuario })
        });

        const datos = await respuesta.json();
        addChatBubble(datos.respuesta, 'bot-message');

    } catch (error) {
        addChatBubble("Uy, parece que perdí la conexión con mi servidor. Por favor revisa si la ventana negra está encendida.", 'bot-message');
    }
}

function sendQuickReply(texto) { document.getElementById('chat-input').value = texto; sendMessage(); }

// ==========================================
// SEGURIDAD ANTIFISGONES
// ==========================================
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('keydown', function(e) {
    if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
    ) {
        e.preventDefault();
    }
});
// =========================================
// COMPORTAMIENTO DEL DIARIO (Guardar)
// =========================================
async function guardarDiario() {
    const textarea = document.getElementById('diary-text');
    const texto = textarea.value.trim();
    const mensajeDiv = document.getElementById('diary-message');
    const btn = document.getElementById('btn-save-diary');

    if (texto === "") {
        mensajeDiv.style.color = "#dc2626"; // Rojo error
        mensajeDiv.textContent = "Por favor, escribe algo antes de guardar.";
        mensajeDiv.style.display = "block";
        return;
    }

    btn.textContent = "Guardando... ⏳";
    btn.disabled = true;

    try {
        // Ejecutamos la función que se comunicará con Firebase
        await window.guardarEntradaEnFirebase(texto);
        
        textarea.value = ""; // Limpiamos el cuadro de texto
        mensajeDiv.style.color = "#16a34a"; // Verde éxito
        mensajeDiv.textContent = "¡Tu entrada ha sido guardada con éxito! ✨";
        mensajeDiv.style.display = "block";
        
        // ¡AQUÍ ESTÁ LA MAGIA! Actualizamos el librito al instante
        cargarHistorialDiario();
        
        setTimeout(() => { mensajeDiv.style.display = "none"; }, 4000);
    } catch (error) {
        mensajeDiv.style.color = "#dc2626";
        mensajeDiv.textContent = error.message || "Hubo un error al guardar.";
        mensajeDiv.style.display = "block";
    } finally {
        btn.textContent = "Guardar Entrada";
        btn.disabled = false;
    }
}

// =========================================
// SISTEMA DE PÁGINAS DEL DIARIO (Leer y Hojear)
// =========================================
let fechaVisionDiario = new Date(); // Inicia en el día de hoy

function cambiarDiaDiario(dias) {
    // Suma o resta días según la flecha que presionemos
    fechaVisionDiario.setDate(fechaVisionDiario.getDate() + dias);
    cargarHistorialDiario();
}

async function cargarHistorialDiario() {
    const historialContenedor = document.getElementById('historial-diario');
    const textoFecha = document.getElementById('diario-fecha-texto');
    const btnSiguiente = document.getElementById('btn-diario-siguiente');
    const zonaEscritura = document.getElementById('zona-escritura-diario');
    if (!historialContenedor) return;

    // Verificamos si estamos en la página de "Hoy"
    const hoy = new Date();
    const esHoy = fechaVisionDiario.toLocaleDateString() === hoy.toLocaleDateString();

    if (esHoy) {
        textoFecha.textContent = "Hoy";
        btnSiguiente.style.visibility = "hidden"; // No podemos viajar al futuro
        zonaEscritura.style.display = "block"; // Permitimos escribir
    } else {
        // Mostramos la fecha pasada bonita (ej: jueves, 6 de julio)
        const opciones = { weekday: 'long', month: 'long', day: 'numeric' };
        textoFecha.textContent = fechaVisionDiario.toLocaleDateString('es-ES', opciones);
        btnSiguiente.style.visibility = "visible"; // Permitimos regresar hacia hoy
        zonaEscritura.style.display = "none"; // Ocultamos el cuadro de texto
    }

    historialContenedor.innerHTML = "<p style='text-align: center; color: #888;'>Pasando página... 📖</p>";

    try {
        const entradas = await window.obtenerEntradasDiarioPorFecha(fechaVisionDiario);
        historialContenedor.innerHTML = ""; 

        if (entradas.length === 0) {
            historialContenedor.innerHTML = "<p style='text-align: center; color: #888; font-style: italic;'>Esta página está en blanco.</p>";
            return;
        }

        entradas.forEach(entrada => {
            const hora = entrada.fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const div = document.createElement('div');
            div.style.backgroundColor = "#f3f4f6";
            div.style.padding = "10px 15px";
            div.style.borderRadius = "8px";
            div.style.marginBottom = "10px";
            div.style.borderLeft = "4px solid #a855f7";

            div.innerHTML = `
                <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 5px;">⌚ ${hora}</div>
                <div style="color: #374151; font-size: 0.95rem; white-space: pre-wrap;">${entrada.contenido}</div>
            `;
            historialContenedor.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        historialContenedor.innerHTML = "<p style='text-align: center; color: #dc2626;'>Error al leer la página.</p>";
    }
}
