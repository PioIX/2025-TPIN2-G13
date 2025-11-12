"use client"

import styles from "@/app/(auth)/login/login.module.css"
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useConection } from "@/hooks/useConection";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";



export default function Login() {
    
    const [mostrarMensaje, setMostrarMensaje] = useState(false);
    const [textoMensaje, setTextoMensaje] = useState("");
    const {url} = useConection();

    const showModal = (title, message) => {
    setTextoMensaje(`${title}: ${message}`);
    setMostrarMensaje(true);
    setTimeout(() => setMostrarMensaje(false), 3000); 
    };

    const [usuarios, setUsuarios] = useState([])
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter()

    
    useEffect(() => {
        fetch(url + "/users")
            .then(response => response.json())
            .then(result => {
                console.log(result)
                setUsuarios(result)
            })
    }, [])


    function SignIn() {
        try {

            if (!user || !password) {
                showModal("Error", "Debes completar todos los campos")
                return
            }

            for (let i = 0; i < usuarios.length; i++) {
                if (usuarios[i].username == user) {
                    if (usuarios[i].password == password) {
                        sessionStorage.setItem("isLoggedIn", "true"); // guardar login
                        showModal("Has iniciado Sesión", "Enseguida estarás en KabeGol")
                        fetch(url + "/findUserId", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: user })
                        })
                            .then(response => response.json())
                            .then(data => {
                                sessionStorage.setItem("userId", data[0].id_user); // guardar userId 
                                console.log("userId guardado en sessionStorage:", data[0].id_user);
                                fetch(url + "/findUserById", {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id_user: sessionStorage.getItem("userId") })
                                })
                                .then(response => response.json())
                                .then(userData => {
                                    console.log(userData)
                                    if (userData[0].admin === 1) {
                                        router.replace("/Kabegol/admin") // admin
                                    } else {
                                        router.replace("/Kabegol/Home") // redirigir a Home
                                    }
                                })
                                
                            })
                    } else {
                        showModal("Error", "Contraseña o Usuario Incorrecto")
                    }
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    function savePassword(event) {
        setPassword(event.target.value)
    }

    function saveUser(event) {
        setUser(event.target.value)
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            SignIn(); // Llamar a la función para enviar el mensaje
        }
    }

    return (
        <div className={styles.contenedorLogin}>
            <div className={styles.contenedorFormLogin}>
                <h1>Login</h1>
                <Input placeholder="Escriba su nombre de usuario" page="login" type="text" onChange={saveUser} name="Nombre" text="Username" />
                <Input placeholder="Escriba su contraseña" page="login" type="password" onChange={savePassword} name="contraseña" text="Contraseña" onKeyDown={handleKeyDown}/>
                <Button text="Sign In" onClick={SignIn} page="login"></Button>
                <h3>¿Es la primera vez que ingresas?</h3>
                <Link href="./register" className={styles.linkLogin}>Registrarse</Link>
            </div>
            {mostrarMensaje && (
            <div className={styles.mensaje}>
                {textoMensaje}
            </div>
        )}
        </div>
    );
}
