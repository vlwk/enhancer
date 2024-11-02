"use client";

import { io } from "socket.io-client";

// const SERVER_URL = "http://18.171.127.234:8000/"; 

// export const socket = io(SERVER_URL, {
//   transports: ['websocket'], 
//   reconnection: false,
// });

export const socket = io("http://18.171.127.234:8000/", {
    transports: ["websocket"],
    reconnection: false,
  });

//   export const socket = io("http://localhost:5000/", {
//     transports: ["websocket"],
//     reconnection: false,
//   });