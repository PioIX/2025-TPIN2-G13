"use client"

import { useEffect, useState } from "react"
import styles from "./admin.module.css"
import { useConection } from "@/hooks/useConection"
import Input from "@/components/Input"

export default function Admin() {
    const [adminData, setAdminData] = useState(null)
    const [users, setUsers] = useState([])
    const [filteredUsers, setFilteredUsers] = useState([])
    const [searchTerm, setSearchTerm] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const {url} = useConection()
    const [fotoPerfil, SetFotoPerfil] = useState(null)

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    
    // Form data
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        image: fotoPerfil,
        admin: false
    })

    
        
    useEffect(() => {
        const userId = sessionStorage.getItem("userId")
        
        // Obtener info del admin
        fetch(url + "/findUserById", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_user: userId
            })
        })
            .then(response => response.json())
            .then(result => {
                setAdminData(result[0]);
                console.log(result[0]);
    
                fetch(url + "/traerFotoUsuario?id=" + userId)
                    .then(r => r.json())
                    .then(json => {
                        const raw = json.foto?.[0]?.image?.data;
                        if (!raw) return;
    
                        const u8 = new Uint8Array(raw);
                        const blob = new Blob([u8], { type: "image/*" });
                        const objectUrl = URL.createObjectURL(blob);
                        SetFotoPerfil(objectUrl);
                    });
            });
        
        // Cargar todos los usuarios (FUERA del fetch anterior)
        loadUsers();

    }, []) // <-- Este useEffect solo se ejecuta una vez al montar
        
        


    useEffect(() => {
    // Filtrar usuarios cuando cambia el término de búsqueda
    if (searchTerm === "") {
        setFilteredUsers(users)
    } else {
        const filtered = users.filter(user => 
            user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredUsers(filtered)
        setCurrentIndex(0) // Reset al primer usuario filtrado
    }
}, [searchTerm, users])

    const loadUsers = () => {
        fetch(url + "/users")
            .then(res => res.json())
            .then(data => {
                // Map through users and convert blob images to URLs
                const usersWithImages = data.map(user => {
                    if (user.image?.data) {
                        // If image is stored as blob in database
                        const u8 = new Uint8Array(user.image.data);
                        const blob = new Blob([u8], { type: "image/*" });
                        const objectUrl = URL.createObjectURL(blob);
                        return { ...user, image: objectUrl };
                    }
                    return user;
                });
                
                setUsers(usersWithImages);
                setFilteredUsers(usersWithImages);
            })
    }

    const handleCreate = () => {
        fetch(url + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(data => {
                alert("Usuario creado exitosamente")
                setShowCreateModal(false)
                setFormData({ username: "", password: "", image: "", admin: false })
                loadUsers()
            })
    }

    const handleEdit = () => {
        fetch(url + "/editUser", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: selectedUser.id_user,
                ...formData
            })
        })
            .then(res => res.json())
            .then(data => {
                alert("Usuario editado exitosamente")
                setShowEditModal(false)
                setSelectedUser(null)
                setFormData({ username: "", password: "", image: "", admin: false })
                loadUsers()
            })
            .catch(err => console.error(err))
    }

    const handleDelete = (userId) => {
        if (confirm("¿Estás seguro de eliminar este usuario?")) {
            fetch(url + `/deleteUser?id=${userId}`, {
                method: "DELETE"
            })
                .then(res => res.json())
                .then(data => {
                    alert("Usuario eliminado")
                    loadUsers()
                })
                .catch(err => console.error(err))
        }
    }

    const handleToggleAdmin = (userId, currentAdminStatus) => {
        fetch(url + "/toggleAdmin", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: userId,
                admin: !currentAdminStatus
            })
        })
            .then(res => res.json())
            .then(data => {
                alert(`Usuario ${!currentAdminStatus ? "promovido a" : "removido de"} admin`)
                loadUsers()
            })
            .catch(err => console.error(err))
    }

    const openEditModal = (user) => {
        setSelectedUser(user)
        setFormData({
            username: user.username,
            password: "",
            image: user.image || "",
            admin: user.admin
        })
        setShowEditModal(true)
    }

     function handleChangeImage(event) {
        let file = event.target.files[0]
        SetFotoPerfil(file)
    }


    const nextUser = () => {
        if (currentIndex < filteredUsers.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const prevUser = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    const currentUser = filteredUsers[currentIndex]

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Panel de Administración</h1>
                {adminData && <p>Bienvenido, <strong>{adminData.username}</strong></p>}
            </div>

            <div className={styles.controls}>
                <input 
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <button 
                    className={styles.createBtn}
                    onClick={() => setShowCreateModal(true)}
                >
                    + Crear Usuario
                </button>
            </div>

            {/* Carrusel */}
            <div className={styles.carousel}>
                <button 
                    className={styles.carouselBtn}
                    onClick={prevUser}
                    disabled={currentIndex === 0}
                >
                    ◀
                </button>

                {currentUser ? (
                    <div className={styles.userCard}>
                        <div className={styles.userImage}>
                            {currentUser.image ? (
                                <img src={currentUser.image} alt={currentUser.username} />
                            ) : (
                                <div className={styles.noImage}>Sin foto</div>
                            )}
                        </div>
                        <h2>{currentUser.username}</h2>
                        <p className={styles.userId}>ID: {currentUser.id_user}</p>
                        <p className={styles.adminBadge}>
                            {currentUser.admin ? "🔑 Admin" : "👤 Usuario"}
                        </p>

                        <div className={styles.actions}>
                            <button 
                                className={styles.editBtn}
                                onClick={() => openEditModal(currentUser)}
                            >
                                ✏️ Editar
                            </button>
                            <button 
                                className={styles.adminBtn}
                                onClick={() => handleToggleAdmin(currentUser.id_user, currentUser.admin)}
                            >
                                {currentUser.admin ? "❌ Quitar Admin" : "✅ Dar Admin"}
                            </button>
                            <button 
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(currentUser.id_user)}
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className={styles.noResults}>No se encontraron usuarios</p>
                )}

                <button 
                    className={styles.carouselBtn}
                    onClick={nextUser}
                    disabled={currentIndex === filteredUsers.length - 1}
                >
                    ▶
                </button>
            </div>

            <p className={styles.counter}>
                {filteredUsers.length > 0 && `${currentIndex + 1} / ${filteredUsers.length}`}
            </p>

            {/* Modal Crear */}
            {showCreateModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Crear Usuario</h2>
                        <input 
                            type="text"
                            placeholder="Username"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                        <input 
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        <Input
                            type="file"
                            accept="image/*"
                            page="register"
                            text="Foto de perfil"
                            required={false}
                            onChange={handleChangeImage}
                        /> 
                        <label>
                            <input 
                                type="checkbox"
                                checked={formData.admin}
                                onChange={(e) => setFormData({...formData, admin: e.target.checked})}
                            />
                            Es Admin
                        </label>
                        <div className={styles.modalActions}>
                            <button onClick={handleCreate}>Crear</button>
                            <button onClick={() => setShowCreateModal(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar */}
            {showEditModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>Editar Usuario</h2>
                        <input 
                            type="text"
                            placeholder="Username"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                        <input 
                            type="password"
                            placeholder="Nueva Password (dejar vacío para no cambiar)"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        <input 
                            type="text"
                            placeholder="URL Imagen"
                            value={formData.image}
                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                        />
                        <label>
                            <input 
                                type="checkbox"
                                checked={formData.admin}
                                onChange={(e) => setFormData({...formData, admin: e.target.checked})}
                            />
                            Es Admin
                        </label>
                        <div className={styles.modalActions}>
                            <button onClick={handleEdit}>Guardar</button>
                            <button onClick={() => setShowEditModal(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}