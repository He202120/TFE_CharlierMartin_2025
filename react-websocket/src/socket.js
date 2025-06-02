import { io } from "socket.io-client";

export const socket = io("wss://192.168.4.1", {
  path: "/socket.io",
  transports: ["websocket"],
  rejectUnauthorized: false,
});
