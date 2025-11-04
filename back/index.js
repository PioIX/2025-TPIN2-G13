var express = require('express'); //Tipo de servidor: Express
var bodyParser = require('body-parser'); //Convierte los JSON

var cors = require('cors');
const session = require("express-session")
const { realizarQuery } = require('./modulos/mysql');
const { Socket } = require('socket.io');


var app = express(); //Inicializo express
var port = process.env.PORT || 4006; //Ejecuto el servidor en el puerto 300// Convierte una petición recibida (POST-GET...) a objeto JSON

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://10.1.4.168:3001",
        "http://10.1.4.129:3000",
        "http://10.1.4.129:3000",
        "http://10.1.4.129:3001",
        "http://10.1.4.12:3000",
        "http://10.1.4.12:3001",
        "http://10.1.5.165:3001",
        "http://10.1.5.165:3000",
        "http://10.1.4.86:3000",
        "http://10.1.4.85:3000",
        "http://10.1.5.89:3000",
        "http://10.1.5.90:3000",
        "http://192.168.0.175:3000",
        "http://10.1.5.144:3000",
        "http://10.1.5.88:3000",
        "http://10.1.4.160:3000",
        "http://10.1.4.168:3000",
        "http://10.1.5.134:3000"
 
    ],
    credentials: true
}));


const server = app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}/`)
})

const io = require("socket.io")(server, {
    cors: {
        origin: [
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://10.1.4.168:3000",
        "http://10.1.4.168:3001",
        "http://10.1.4.129:3000",
        "http://10.1.4.12:3000",
        "http://10.1.4.12:3001",
        "http://10.1.5.165:3001",
        "http://10.1.5.165:3000",
        "http://10.1.4.86:3000",
        "http://10.1.4.85:3000",
        "http://10.1.5.89:3000",
        "http://10.1.5.90:3000",
        "http://192.168.0.175:3000",
        "http://10.1.5.144:3000",
        "http://10.1.5.88:3000",
        "http://10.1.4.160:3000",
        "http://10.1.4.168:3000",
        "http://10.1.5.134:3000"


        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

const sessionMiddleware = session({
    secret: "pototo",
    resave: false,
    saveUninitialized: false,
});

app.use(sessionMiddleware)
io.use((Socket, next) => {
    sessionMiddleware(Socket.request, {}, next)
})








app.get('/', function (req, res) {
    res.status(200).send({
        message: 'GET Home route working fine!'
    });
});






app.get('/users', async function (req, res) {
    try {
        const respuesta = await realizarQuery(`
            SELECT * FROM Users
        `)
        res.send(respuesta)
    } catch (error) {
        console.log(error)
    }
})

app.post('/register', async function (req, res) {
    console.log(req.body)
    try {
        if (req.body.image == null) {
            req.body.image = null
        } else {
            req.body.image = `'${req.body.image}'`
        }
        const respuesta = await realizarQuery(`
            INSERT INTO Users (username, password, image)    
            VALUES ('${req.body.username}', '${req.body.password}', ${req.body.image})
        `)
        res.send({res: true, message: "Usuario Creado Correctamente"})
    } catch (error) {
        console.log(error)
    }
})

app.post('/findUser', async function (req, res) {
    try {
        const respuesta = await realizarQuery(`
            SELECT * FROM Users WHERE username = '${req.body.username}'
        `)
        if (respuesta.length > 0)
            res.send({ vector: respuesta, existe: true })
        else
            res.send({ vector: respuesta, existe: false })
    } catch (error) {
        console.log(error)
    }
})

app.post('/findUserById', async function (req, res) {
    try {
        const respuesta = await realizarQuery(`
            SELECT * FROM Users WHERE id_user = '${req.body.id_user}'
        `)
        res.send(respuesta)
    } catch (error) {
        console.log(error)
    }
})

app.post('/findUserId', async function (req, res) {
    try {
        const respuesta = await realizarQuery(`
            SELECT id_user FROM Users WHERE username = '${req.body.username}'
        `)
        res.send(respuesta)
    } catch (error) {
        console.log(error)
    }
})

app.put('/putOnline', async function (req, res) {
    try {
        const respuesta = await realizarQuery(`
            UPDATE UsuariosChat
            SET en_linea = ${req.body.en_linea}
            WHERE id_usuario = ${req.body.id_usuario}
        `)
        res.send(respuesta)
    } catch (error) {
        console.log(error)
    }
})

app.post('/bringContacts', async function (req, res) {
    try {

        const respuesta = await realizarQuery(`
            Select Chats.foto, nom_grupo, grupo, UsuariosChat.image, UsuariosPorChats.id_chat, UsuariosChat.nombre
            FROM Chats
            INNER JOIN UsuariosPorChats ON Chats.id_chat = UsuariosPorChats.id_chat
            INNER JOIN UsuariosChat ON UsuariosPorChats.id_usuario = UsuariosChat.id_usuario
            WHERE UsuariosPorChats.id_chat IN (
                SELECT id_chat FROM UsuariosPorChats WHERE id_usuario = ${req.body.id_usuario}
            ) AND UsuariosChat.id_usuario != ${req.body.id_usuario};
        `)

        for (let i=0; i<respuesta.length; i++) {
            if (respuesta[i].image == null || respuesta[i].image == "") {
                respuesta[i].image = "https://cdn-icons-png.flaticon.com/512/847/847969.png"
            }
            if (respuesta[i].foto == null || respuesta[i].foto == "") {
                respuesta[i].foto = "https://cdn-icons-png.flaticon.com/512/847/847969.png"
            }
        }

        

        res.send(respuesta)
    } catch (error) {
        console.log(error)
    }
})


app.post('/getMessages', async function (req, res) {
    try {
        const respuesta = await realizarQuery(`
            SELECT id_mensajes, id_usuario, contenido, hora
            FROM Mensajes
            WHERE id_chat = ${req.body.id_chat}
            ORDER BY hora ASC
        `)
        res.send(respuesta)
    } catch (error) {
        console.log(error)
        res.status(500).send("Error al traer mensajes")
    }
})

app.post('/sendMessage', async function (req, res) {
    try {
        const respuesta = await realizarQuery(`
            INSERT INTO Mensajes (id_usuario, id_chat, contenido, hora)
            VALUES (${req.body.id_usuario}, ${req.body.id_chat}, '${req.body.contenido}', '${req.body.hora}')
        `)
        res.send(respuesta)
    } catch (error) {
        console.log(error)
        res.status(500).send("Error al enviar mensaje")
    }
})


app.post('/newChat', async function (req, res) {

    try {


        // 1. Buscar si existe un chat con esa persona
        const existingChat = await realizarQuery(`
            SELECT uc1.id_chat
            FROM UsuariosPorChats uc1
            INNER JOIN UsuariosPorChats uc2 ON uc1.id_chat = uc2.id_chat
            WHERE uc1.id_usuario = ${req.body.id_usuarioPropio} AND uc2.id_usuario = ${req.body.id_usuarioAjeno};    
        `)

        // 2. Verificar si existe
        if (existingChat.length === 1) {
            return res.send({ ok: false, mensaje: "Ya existe un chat entre ustedes", id_chat: existingChat[0].id_chat })
        }


        //3. Crear el chat
        const crearChat = await realizarQuery(`
            INSERT INTO Chats (grupo, nom_grupo, descripcion, foto)   
            VALUES (${req.body.grupo}, "", "", "")
        `);

        //4. Buscar nuevo ChatID
        const NuevoChatId = crearChat.insertId // insertId es un mensaje que devuelve predeterminadamente al realizar una sentencia "INSERT INTO"


        await realizarQuery(`
            INSERT INTO UsuariosPorChats (id_chat, id_usuario)
            VALUES (${NuevoChatId}, ${req.body.id_usuarioPropio})        
        `);

        await realizarQuery(`
            INSERT INTO UsuariosPorChats (id_chat, id_usuario)
            VALUES (${NuevoChatId}, ${req.body.id_usuarioAjeno})        
        `);

        res.send({ ok: true, mensaje: "Se ha podido crear el chat y su relacion con éxito.", id_chat: NuevoChatId })
    } catch (error) {
        console.log(error)
        res.status(500).send({ ok: false, mensaje: "Error al crear el chat" })
    }
})






io.on("connection", (socket) => {
    const req = socket.request;

    console.log("🟢 Cliente conectado:", socket.id);

    // --- Crear sala ---
    socket.on("createRoom", async (data) => {
    try {
        const { id_user } = data;

      // Generar código único (6 caracteres)
        const code_room = Math.random().toString(36).substring(2, 10).toUpperCase();

      // Crear la sala en la base
        const queryRoom = `
        INSERT INTO Rooms (code_room, id_host)
        VALUES ('${code_room}', ${id_user})
        `;
        const result = await realizarQuery(queryRoom);

      // Obtener el id_room insertado
        const id_room = result.insertId;

      // Insertar al host en RoomPlayers
        const queryPlayer = `
        INSERT INTO RoomPlayers (id_room, id_user)
        VALUES (${id_room}, ${id_user})
        `;
        await realizarQuery(queryPlayer);

      // Unir al socket a la sala
        socket.join(code_room);

        console.log(`✅ Sala creada: ${code_room} por host ${id_user}`);
        socket.emit("roomCreated", { code_room, host: {id_user} });

        // Obtener jugadores de la sala (por ahora solo el host)
        const jugadores = await realizarQuery(`
            SELECT 
                u.id_user, 
                u.username, 
                u.image,
                CASE WHEN u.id_user = r.id_host THEN 1 ELSE 0 END AS esHost
            FROM RoomPlayers rp
            JOIN Users u ON rp.id_user = u.id_user
            JOIN Rooms r ON rp.id_room = r.id_room
            WHERE rp.id_room = ${id_room}
            ORDER BY esHost DESC, u.id_user ASC
        `);

        // Enviar a todos (por ahora solo el host conectado)
        io.to(code_room).emit("updatePlayers", jugadores);


    } catch (err) {
        console.error("❌ Error al crear sala:", err);
        socket.emit("errorRoom", "No se pudo crear la sala");
    }
    });

  // --- Unirse a una sala por código ---
    socket.on("joinRoomByCode", async (data) => {
    try {
        const { code_room, id_user } = data;

      // Buscar sala existente
        const queryFind = `
        SELECT * FROM Rooms 
        WHERE code_room = '${code_room}' AND estado = 'esperando'
        `;
        const roomData = await realizarQuery(queryFind);

        if (roomData.length === 0) {
        return socket.emit("errorRoom", "Sala no encontrada o ya iniciada");
        }

        const id_room = roomData[0].id_room;


        const checkExisting = await realizarQuery(`
            SELECT * FROM RoomPlayers WHERE id_room = ${id_room} AND id_user = ${id_user}
        `);

        console.log("Check Existing:", checkExisting);

        if (checkExisting.length > 0) {
            console.log(`⚠️ Usuario ${id_user} ya está en la sala ${code_room}`);
            return socket.emit("joinedRoom", { code_room }); // Ya estaba dentro
        }
      // Insertar jugador en RoomPlayers
        const queryInsert = `
        INSERT INTO RoomPlayers (id_room, id_user)
        VALUES (${id_room}, ${id_user})
        `;
        await realizarQuery(queryInsert);
        
    
        // Unir al socket a la sala
        socket.join(code_room);
        console.log(`👥 Usuario ${id_user} se unió a sala ${code_room}`);
        
        const jugadores = await realizarQuery(`
            SELECT 
                u.id_user, 
                u.username, 
                u.image,
                CASE WHEN u.id_user = r.id_host THEN 1 ELSE 0 END AS esHost
            FROM RoomPlayers rp
            JOIN Users u ON rp.id_user = u.id_user
            JOIN Rooms r ON rp.id_room = r.id_room
            WHERE rp.id_room = ${id_room}
            ORDER BY esHost DESC, u.id_user ASC
        `);

        // Notificar a todos en la sala con la lista completa
        io.to(code_room).emit("updatePlayers", jugadores);

        // Confirmar al que se acaba de unir
        socket.emit("joinedRoom", { code_room });
    } catch (err) {
        console.error("❌ Error al unirse a sala:", err);
        socket.emit("errorRoom", "No se pudo unir a la sala");
    }
    });

    socket.on("test", (data) => {
        console.log("TEST DATA: ", data);
        io.to(data.roomCode).emit("testResponse", { message: "Test recibido correctamente" });
    });

    socket.on("startGame", async (data) => {
        const code = data.code;
        console.log(`El host inició la partida en la sala ${code}`);
        console.log(`La sala del host es: ${code}`);

        await realizarQuery(`
            UPDATE Rooms 
            SET estado = 'en_juego' 
            WHERE code_room = '${code}'
        `);


        io.to(code).emit("gameStart", {code});

    });

    socket.on("joinGameRoom", async (data) => {
        const { code_room, userId } = data;
        socket.join(code_room);
        
        console.log(`🎮 Jugador ${userId} (socket: ${socket.id}) se unió a sala de juego ${code_room}`);

        // Obtener los jugadores de esta sala
        const jugadores = await realizarQuery(`
            SELECT rp.id_user, r.id_host
            FROM RoomPlayers rp
            JOIN Rooms r ON rp.id_room = r.id_room
            WHERE r.code_room = '${code_room}'
            ORDER BY rp.id ASC
        `);

        if (jugadores.length >= 2) {
            const p1 = jugadores[0].id_user; // Primer jugador (host)
            const p2 = jugadores[1].id_user; // Segundo jugador

            // Enviar asignación al jugador que acaba de unirse
            socket.emit("playerAssigned", { p1, p2 });

            console.log(`✅ Asignación enviada a ${userId}: P1=${p1}, P2=${p2}`);
        }
    });

    socket.on("playerMove", (data) => {
        const { code_room, playerNumber, x, y, vx, vy, bootX, bootY, bootAngle } = data;

        // Validación liviana opcional
        if (!code_room) return;

        socket.to(code_room).emit("opponentMove", {
            playerNumber,
            x, y, vx, vy,
            bootX, bootY,
            bootAngle
        });
    });

    socket.on("ballUpdate", (data) => {
        const { code_room, x, y, vx, vy } = data;
        
        // Solo el host actualiza la pelota, broadcast a todos
        socket.to(code_room).emit("ballSync", {
            x,
            y,
            vx,
            vy
        });
    });

    socket.on("kick", (data) => {
        socket.to(data.code_room).emit("playerKick", {
            playerNumber: data.playerNumber,
            force: data.force
        });
});

    socket.on("goal", async (data) => {
        const { code_room, score1, score2 } = data;
        
        console.log(`⚽ GOL en sala ${code_room}! Score: ${score1} - ${score2}`);
        
        // Broadcast a todos en la sala
        io.to(code_room).emit("goalScored", {
            score1,
            score2
        });

        // Opcional: Guardar en base de datos
        // await realizarQuery(`UPDATE RoomPlayers SET score = ${score1} WHERE ...`);
    });


    socket.on("updateCountdown", (data) => {
        io.to(data.code_room).emit("updateCountdown", { countdown: data.countdown });
    });

    socket.on("startGameTimer", (data) => {
        io.to(data.code_room).emit("startGameTimer");
    });

    socket.on("timerTick", (data) => {
        io.to(data.code_room).emit("timerUpdate", { time: data.time });
    });

    socket.on("endGame", async (data) => {
        const { code_room, score1, score2 } = data;
        
        console.log(`🏁 Juego terminado en sala ${code_room}. Score: ${score1} - ${score2}`);
        
        // Actualizar estado de la sala a "finalizada"
        await realizarQuery(`
            UPDATE Rooms 
            SET estado = 'finalizada', fecha_fin = NOW() 
            WHERE code_room = '${code_room}'
        `);
        
        // Broadcast a todos
        io.to(code_room).emit("gameEnded", { score1, score2 });
    });

    socket.on("leaveGame", async (data) => {
        const { code_room } = data;
        console.log(`👋 Jugador salió de la sala ${code_room}`);
        
        // Opcional: limpiar sala
        socket.leave(code_room);
    });




    socket.on("pingAll", (data) => {
        console.log("PING ALL: ", data);
        io.emit("pingAll", { event: "Ping to all", message: data });
    });


    socket.on("disconnect", () => {
        console.log("🔴 Cliente desconectado:", socket.id);
    });
});



