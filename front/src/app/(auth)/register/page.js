"use client"

import styles from "@/app/(auth)/register/register.module.css"
import Button from "@/components/Button";
import Input from "@/components/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConection } from "@/hooks/useConection";

export default function Register() {

    const {url} = useConection();
    const [nombre, SetNombre] = useState("")
    const [contraseña, SetContraseña] = useState("")
    const [confirmContraseña, setConfirmContraseña] = useState("")
    const [fotoPerfil, SetFotoPerfil] = useState(null)
    const [usuario, setUsuario] = useState([])
    const [preview, setPreview] = useState(null)

    const router = useRouter()

    const [mostrarMensaje, setMostrarMensaje] = useState(false);
    const [textoMensaje, setTextoMensaje] = useState("");

    const showModal = (title, message) => {
    setTextoMensaje(`${title}: ${message}`);
    setMostrarMensaje(true);
    setTimeout(() => setMostrarMensaje(false), 3000); 
    };



    
    useEffect(() => {
        if (usuario.existe == false) {
            SignUp()
        } else if (usuario.existe == true) {
            showModal("Error", "Ya existe un usuario con ese mail")
        }
    }, [usuario])


    function saveName(event) {
        SetNombre(event.target.value)
    }
    function savePassowrd(event) {
        SetContraseña(event.target.value)
    }
    function savePassowrdSecure(event) {
        setConfirmContraseña(event.target.value)
    }
      function handleChangeImage(event) {
        let file = event.target.files[0]
        SetFotoPerfil(file)
        setPreview(URL.createObjectURL(file))
        }

    function removeImageAndPreview() {
        SetFotoPerfil("")
        setPreview(null)
    }  

    function UserExists() {

            if (!nombre || !contraseña) {
                showModal("Error", "Complete todos los campos por favor")
                return
            }

            fetch(url + "/findUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: nombre
                })
            })
            .then(response => response.json())
            .then(result => {
                setUsuario(result)
            })
    }

    function SignUp() { 

        

        if (contraseña === confirmContraseña) {
            const formData = new FormData(); //Se enviaran los datos en formData porque admite imagenes (o sea, binarios)
            formData.set("nombre", nombre) 
            formData.set("contrasena", contraseña)
            if (fotoPerfil) formData.set("foto", fotoPerfil); // File real

            console.log(formData.get("nombre"))
            console.log(formData.get("contrasena"))

            fetch(url + "/register", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                showModal("Exito", "Usuario creado correctamente")
                sessionStorage.setItem("isLoggedIn", "true"); 
                fetch(url + '/findUserId', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: nombre })
                    })
                        .then(response => response.json())
                        .then(data => {
                            sessionStorage.setItem("userId", data[0].id_user); // guardar userId 
                            console.log("userId guardado en sessionStorage:", data[0].id_user);
                            router.replace("/Kabegol/Home") // redirigir a Home
                        })
        })
        } else {
            showModal("Error", "Las contraseñas no coinciden")
        }
    }
            
    return (
        <div className={styles.contenedorRegister}>
            <div className={styles.registerForm}>
                <h1>Registro</h1>
                <br></br>
                <p>Complete los siguientes datos para el registro</p>

                <Input text="Username" placeholder="Escriba su nombre de usuario" page="register" type="text" onChange={saveName} required={true}/>
                <Input text="Contraseña" placeholder="Escriba su contraseña" page="register" type="password" onChange={savePassowrd} required={true}/>
                <Input text="Confirmar Contraseña" placeholder="Escriba de vuelta su contraseña" page="register" type="password" onChange={savePassowrdSecure} required={true}/>
                {fotoPerfil ? <><img src={preview} alt="Cargando..." width={450} height={450} onClick={removeImageAndPreview}></img></> :
                  <>
                    <Input
                      type="file"
                      accept="image/*"
                      page="register"
                      text="Foto de perfil"
                      required={false}
                      onChange={handleChangeImage}></Input> 
                  </>
                }
                
                <Button onClick={UserExists} text="Sign Up" page="register"></Button>
                <Link href={"./login"} className={styles.linkRegister}>¿Ya tenes cuenta? Login</Link>
            </div>

            {mostrarMensaje && (
            <div className={styles.mensaje}>
                {textoMensaje}
            </div>)}


        </div>
        
    );
}   