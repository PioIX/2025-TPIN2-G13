import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useConection } from './useConection';



const useSocket = (options = { withCredentials: false }, serverUrl = "ws://10.1.4.160:4006/") => { //ACÁ PONER LA IP DEL BACK
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false) 
  
  const { url } = useConection();
  useEffect(() => {
    // Crear una conexión con el backend usando Socket.IO
    const socketIo = io(serverUrl, options);

    // Actualizar el estado de la conexión
    socketIo.on('connect', () => {
      setIsConnected(true);
       // ✅ Al conectarse, informamos al backend la URL base del cliente
      socketIo.emit("clientInfo", { baseUrl: url });
      // Esto asegura que el backend genere imageUrl correctas
      console.log("Enviando baseUrl al server:", url);
      console.log('WebSocket connectado.');
    });

    socketIo.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket desconectado');
    });

    // Guardar la instancia del socket en el estado
    setSocket(socketIo);

    // Limpiar la conexión cuando el componente se desmonte
    return () => {
      socketIo.disconnect();
    };
  }, [serverUrl, JSON.stringify(options)]);

  return { socket, isConnected };
};

export { useSocket };