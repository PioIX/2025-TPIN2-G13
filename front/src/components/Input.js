import clsx from "clsx";
import styles from "@/components/Input.module.css"

export default function Input(props) {
    return(
        <>
            <label htmlFor={props.name}>{props.text}</label>
            <input 
                value={props.value}
                placeholder={props.placeholder}
                accept={props.accept}
                id={props.id} 
                className={clsx(styles.input, {
                    [styles.inputLogin] : props.page === "login",
                    [styles.inputRegister] : props.page === "register",
                    [styles.inputChat] : props.page === "chat",
                    [styles.inputBuscarContacto] : props.use === "buscarContacto",
                    [styles.inputEscribirMensaje] : props.use === "EscribirMensaje",
                    [styles.inputNuevoChat] : props.use === "mailNewChat",
                })} 
                type={props.type} 
                onChange={props.onChange} 
                required={props.required} 
                onKeyDown={props.onKeyDown}>

            </input>
        </>
    )
}