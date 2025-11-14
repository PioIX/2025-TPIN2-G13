"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const GameSingle = dynamic(() => import("./SingleGame"), { ssr: false });

export default function SinglePlayerPage() {
    const userId = typeof window !== 'undefined' ? sessionStorage.getItem("userId") : null;
    const [imageProfile, setImageProfile] = useState(null);

    // Opcional: cargar foto de perfil si querés
    // useEffect(() => { fetch... }, []);

    return (
        // 1. El Contenedor NEGRO (ocupa toda la pantalla y CENTRA)
        <div style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "#111",
            display: "flex",        // <<< NUEVO
            justifyContent: "center", // <<< NUEVO
            alignItems: "center"      // <<< NUEVO
        }}>
            
            {/* 2. El "Rectángulo" (el contenedor 16:9 del juego) */}
            <div style={{
                width: "100%",     // Que intente ocupar el 100% del ancho
                height: "100%",    // Que intente ocupar el 100% del alto
                maxWidth: "100vw", // Pero no más ancho que la pantalla
                maxHeight: "100vh", // Pero no más alto que la pantalla
                aspectRatio: "16 / 9" // <<< LA MAGIA (1280/720)
            }}>
                <GameSingle 
                    userId={userId}
                    imageProfile={imageProfile}
                />
            </div>

        </div>
    );
}