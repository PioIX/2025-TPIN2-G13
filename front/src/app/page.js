"use client"

import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import styles from "./page.module.css"

export default function Home() {

  const router = useRouter()

  function login() {
    router.replace("/login")
  }


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
