import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (!authUser) return;

    // create socket connection
    const socketInstance = io("http://localhost:5000", {
      query: { userId: authUser._id },
      transports: ["websocket", "polling"], // dono allow karo
    });

    setSocket(socketInstance);

    // listener for online users
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    socketInstance.on("getOnlineUsers", handleOnlineUsers);

    // optional: listen for incoming messages
    // socketInstance.on("newMessage", (message) => {
    //   // update your chat state here
    // });

    return () => {
      // cleanup listeners and disconnect properly
      socketInstance.off("getOnlineUsers", handleOnlineUsers);
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
