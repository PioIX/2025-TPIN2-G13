"use client"

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import styles from "./page.module.css"

export default function Home() {

  const router = useRouter()

  // 1. ESTADOS PRINCIPALES
  // 'video': Mostrando la intro
  // 'transition': Mostrando la pantalla negra (y cargando el contenido detrás)
  // 'content': Mostrando el contenido principal
  const [pageState, setPageState] = useState('video');

  // 2. NUEVOS ESTADOS para controlar las animaciones de fundido
  const [isVideoFading, setIsVideoFading] = useState(false);
  const [isScreenFading, setIsScreenFading] = useState(false);

  function login() {
    router.replace("/login")
  }

  // 3. Cuando el video termina...
  const handleVideoEnd = () => {
    setIsVideoFading(true); // Inicia el fade-out del video
  };

  // 4. Esta función se llama CUANDO LA ANIMACIÓN de fade-out del video TERMINA
  const handleVideoFadeEnd = () => {
    // Solo si estamos en la fase de fade-out del video
    if (isVideoFading) {
      setPageState('transition'); // Cambiamos al estado de transición (pantalla negra)
    }
  };

  // 5. Manejador de la pantalla de transición
  useEffect(() => {
    // Cuando entramos al estado 'transition'
    if (pageState === 'transition') {
      
      // Esperamos un momento con la pantalla en negro (ej: 0.5 segundos)
      const holdBlackTimer = setTimeout(() => {
        setIsScreenFading(true); // Inicia el fade-out de la pantalla negra
      }, 500); // <-- Duración de la pantalla negra

      return () => clearTimeout(holdBlackTimer);
    }
  }, [pageState]); // Se ejecuta cuando pageState cambia a 'transition'

  // 6. Esta función se llama CUANDO LA ANIMACIÓN de fade-out de la pantalla negra TERMINA
  const handleScreenFadeEnd = () => {
    // Solo si estamos en la fase de fade-out de la pantalla
    if (isScreenFading) {
      setPageState('content'); // Cambiamos al estado final de contenido
    }
  };


  // --- RENDERIZADO ---

  // ESTADO 1: Mostrando el video
  if (pageState === 'video') {
    return (
      <div className={styles.videoContainer}>
        <video
          src="/backgrounds/intro2.mp4" 
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnd}
          // Añadimos la clase 'fadeOut' cuando 'isVideoFading' es true
          className={`${styles.videoPlayer} ${isVideoFading ? styles.videoFadeOut : ''}`}
          // Detectamos el fin de la animación CSS
          onAnimationEnd={handleVideoFadeEnd} 
        />
      </div>
    );
  }

  // ESTADO 2: Transición (Pantalla negra + Contenido oculto detrás)
  if (pageState === 'transition') {
    return (
      <>
        {/* La pantalla negra. Se anima con CSS. */}
        <div 
          // Añadimos la clase 'fadeOut' cuando 'isScreenFading' es true
          className={`${styles.fadingScreen} ${isScreenFading ? styles.screenFadeOut : styles.screenFadeIn}`}
          // Detectamos el fin de la animación de fade-out
          onAnimationEnd={handleScreenFadeEnd}
        />

        {/* Renderizamos el contenido principal DETRÁS de la pantalla negra,
            pero lo hacemos invisible (opacity: 0) para que no se vea
            y sus animaciones ('fade-in-slide-up') no se disparen todavía. */}
        <div className={styles.homecontainer} style={{ opacity: 0 }}>
          <nav className={styles.header}>
            <p className={styles.headerhomep}>2025 KABEGOL GRUPO 13...</p>
          </nav>
          <h1 className={`${styles.titlehome}`}>KabeGol</h1>
          <h2 className={`${styles.subtitlehome}`}>Demuestra quien es mejor</h2>
          <div className={`${styles.entrarhome}`}>
            <p className={styles.phome}>El mejor juego del mundo</p>
            <Button text="Jugar Ahora" onClick={login} page="home"/>
          </div>
          <p className={styles.footerhome}>Muchas gracias por visitar este sitio</p>
        </div>
      </>
    );
  }

  // ESTADO 3: Mostrar el contenido principal
  // Ahora la página se renderiza normalmente y las animaciones CSS
  // ('fade-in-slide-up') se dispararán como deben.
  return (
    <div className={styles.homecontainer}>
      <nav className={styles.header}>
        <p className={styles.headerhomep}>2025 KABEGOL GRUPO 13 - INTEGRANTES: FACUNDO SUAREZ, JUAN IGNACIO NASTASI, AGUSTIN PUTRINO, FRANCISCO MANZANARES</p>
      </nav>
      <h1 className={`${styles.titlehome} ${styles['fade-in-slide-up']} ${styles['delay-1']}`}>KabeGol</h1>
      <h2 className={`${styles.subtitlehome} ${styles['fade-in-slide-up']} ${styles['delay-2']}`}>Demuestra quien es mejor</h2>
      
      <div className={`${styles.entrarhome} ${styles['fade-in-slide-up']} ${styles['delay-3']}`}>
        <p className={styles.phome}>El mejor juego del mundo</p>
        <Button text="Jugar Ahora" onClick={login} page="home"/>
      </div>
      <p className={styles.footerhome}>Muchas gracias por visitar este sitio</p>
    </div>
  );
}