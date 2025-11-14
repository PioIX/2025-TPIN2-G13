import styles from "@/components/Button.module.css"
import clsx from "clsx";


export default function Button(props) {
    return (
        <>
            <button className={
                clsx(
                    {
                        [styles.buttonhome] : props.page == "home",
                        [styles.buttonLogin] : props.page === "login",
                        [styles.buttonRegister] : props.page === "register",
                        [styles.startButton] : props.page === "lobby",
                        [styles.btnSingle] : props.use === "single",
                        [styles.btnMulti] : props.use === "multi",
                        [styles.btnRules] : props.use === "rules",
                        [styles.joinBtn] : props.use === "join",
                        [styles.cancelBtn] : props.use === "cancel",
                        [styles.createBtn] : props.use === "create",
                        [styles.startButton] : props.use === "playGame",
                    }
                )
            } onClick={props.onClick}>{props.text}</button>
        </>
    );
}
