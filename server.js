require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); 
const Groq = require('groq-sdk');
const axios = require('axios'); // Librería para conectar con OpenWeather

const app = express();
app.use(cors()); 
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const WEATHER_KEY = process.env.WEATHER_API_KEY;

// 🧠 CEREBRO Y MEMORIA DE ALEGRIA
let historialChat = [
    {
        role: "system",
        content: "Eres ALEGRIA, una asistente virtual súper empática, alegre, entusiasta y animada para adolescentes. ¡Tu misión es contagiar buena energía! Responde de forma corta, amigable y muy natural. ¡Usa emojis en cada respuesta si es necesario de forma regular (como ✨, 😊, 🎉, 🙌, 💕, 🚀) para que el chat se vea colorido y divertido! Puedes recomendar música, películas o juegos con emoción. Si te preguntan por el clima, usa los datos reales adjuntos en el contexto para responder con tu estilo alegre. Si hay riesgo de autolesión, baja un poco el tono y sugiere hablar con un adulto de confianza de forma amorosa."
    }
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
    try {
        const mensajeUsuario = req.body.mensaje;
        let datosClima = "No se solicitó información del clima.";

        // 🌤️ DETECTOR INTELIGENTE DE CLIMA (BLINDADO)
        if (mensajeUsuario.toLowerCase().includes("clima") || mensajeUsuario.toLowerCase().includes("tiempo")) {
            const match = mensajeUsuario.match(/(?:clima|tiempo)\s+(?:en|de)\s+([a-zA-Z\s]+)/i);
            let ciudad = match ? match[1] : "Chiclayo";

            // Limpiamos palabras extras o signos de puntuación que el usuario pueda escribir
            ciudad = ciudad.replace(/(?:\b(?:hoy|ahora|por favor|ya|mañana)\b|[?!.,])/gi, '').trim();
            
            if (ciudad === "") ciudad = "Chiclayo"; // Por si la limpieza lo dejó vacío

            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(ciudad)}&appid=${WEATHER_KEY}&units=metric&lang=es`;
                const response = await axios.get(url);
                const temp = response.data.main.temp;
                const desc = response.data.weather[0].description;
                datosClima = `El clima actual en ${ciudad} es de ${temp}°C con ${desc}.`;
            } catch (err) {
                datosClima = "No se pudo obtener el clima real en este momento para esa ubicación.";
            }
        }

        // 📝 Añadimos el nuevo mensaje a la memoria
        historialChat.push({
            role: "user",
            content: `Contexto oculto: [${datosClima}]. Mensaje: ${mensajeUsuario}`
        });

        // Limitamos la memoria (mantiene la personalidad base en índice 0, y los últimos 6 mensajes)
        if (historialChat.length > 7) {
            historialChat.splice(1, 2); 
        }

        // Enviamos toda la conversación a Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: historialChat,
            model: "llama-3.1-8b-instant", 
            max_tokens: 200 
        });

        const respuestaIA = chatCompletion.choices[0]?.message?.content || "No entendí bien, ¿puedes repetir?";
        
        // 📝 Guardamos la respuesta de ALEGRIA en la memoria para que ella sepa qué dijo
        historialChat.push({
            role: "assistant",
            content: respuestaIA
        });

        res.json({ respuesta: respuestaIA });

    } catch (error) {
        console.error("Error real detectado:", error);
        res.status(500).json({ respuesta: "Lo siento, tuve un pequeño mareo tecnológico. ¿Puedes repetir?" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ ALEGRIA VIVA e Inteligente en http://localhost:${PORT}`);
});