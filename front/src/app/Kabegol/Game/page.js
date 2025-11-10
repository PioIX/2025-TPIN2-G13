"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";

// Import dinámico del componente Phaser
const Game = dynamic(() => import("./Game"), { ssr: false });

export default function GamePage() {
    const searchParams = useSearchParams();
    const code_room = searchParams.get("code");
    const userId = typeof window !== 'undefined' ? sessionStorage.getItem("userId") : null;

    const { socket, isConnected } = useSocket();
    const [playerNumber, setPlayerNumber] = useState(null);
    const [isReady, setIsReady] = useState(false);

    // 🔥 Estados para las imágenes
    const [imageP1, setImageP1] = useState(null);
    const [imageP2, setImageP2] = useState(null);


    useEffect(() => {
        if (!socket || !code_room || !userId) return;

        console.log("🎮 GamePage montado, uniéndose a sala:", code_room);

        // 1️⃣ Unirse a la sala de juego
        socket.emit("joinGameRoom", { code_room, userId });

        // 2️⃣ Escuchar asignación de jugador
        socket.on("playerAssigned", (data) => {
            console.log("✅ Asignación recibida:", data);

            const jugadoresStr = sessionStorage.getItem("jugadores");
            if (jugadoresStr) {
                try {
                    const jugadores = JSON.parse(jugadoresStr);
                    console.log("👥 Jugadores del sessionStorage:", jugadores);
                    
                    // Buscar las imágenes de P1 y P2
                    const p1Data = jugadores.find(j => j.id_user == data.p1);
                    const p2Data = jugadores.find(j => j.id_user == data.p2);
                    
                    const imgP1 = p1Data?.imageUrl || null;
                    const imgP2 = p2Data?.imageUrl || null;
                    
                    console.log("📸 Imagen P1:", imgP1);
                    console.log("📸 Imagen P2:", imgP2);
                    
                    setImageP1(imgP1);
                    setImageP2(imgP2);
                } catch (error) {
                    console.error("❌ Error parseando jugadores:", error);
                }
            }
            
            if (data.p1 == userId) {
                setPlayerNumber(1);
                console.log("👤 Soy el Jugador 1 (izquierda)");
            } else if (data.p2 == userId) {
                setPlayerNumber(2);
                console.log("👤 Soy el Jugador 2 (derecha)");
            }
            
            setIsReady(true);
        });

        return () => {
            socket.off("playerAssigned");
        };
    }, [socket, code_room, userId]);

    if (!isConnected) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: '#111',
                color: 'white',
                fontSize: '24px'
            }}>
                🔌 Conectando al servidor...
            </div>
        );
    }

    if (!isReady || playerNumber === null) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: '#111',
                color: 'white',
                fontSize: '24px'
            }}>
                ⏳ Cargando juego...
            </div>
        );
    }

    return (
        <div style={{ width: "100vw", height: "100vh", backgroundColor: "#111" }}>
            <Game 
                socket={socket} 
                code_room={code_room} 
                playerNumber={playerNumber}
                userId={userId}
                imageP1={imageP1}  // 🔥 Pasar imagen P1
                imageP2={imageP2}  // 🔥 Pasar imagen P2
            />
        </div>
    );
}