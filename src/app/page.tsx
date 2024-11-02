"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "./socket";

import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { useDrag } from "react-use-gesture";

import styles from "../styles.module.css";

const cards = [
  "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
];

// Animation helpers
const to = (i: number) => ({
  x: 0,
  y: 0,
  // y: 0
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
});
const from = (_i: number) => ({ x: 0, rot: 0, scale: 1, y: 0 });
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(30deg) rotateY(${
    r / 10
  }deg) rotateZ(${r}deg) scale(${s})`;

function Deck() {
  const [gone] = useState(() => new Set()); // The set flags all the cards that are flicked out
  const [props, api] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(i),
  })); // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
  const bind = useDrag(
    ({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
      const trigger = velocity > 0.2; // If you flick hard enough it should trigger the card to fly out
      const dir = xDir < 0 ? -1 : 1; // Direction should either point left or right
      if (!down && trigger) gone.add(index); // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
      api.start((i) => {
        if (index !== i) return; // We're only interested in changing spring-data for the current spring
        const isGone = gone.has(index);
        const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0; // When a card is gone it flys out left or right, otherwise goes back to zero
        const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0); // How much the card tilts, flicking it harder makes it rotate faster
        const scale = down ? 1.1 : 1; // Active cards lift up a bit
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        };
      });
      if (!down && gone.size === cards.length)
        setTimeout(() => {
          gone.clear();
          api.start((i) => to(i));
        }, 600);
    }
  );
  // Now we're just mapping the animated values to our view, that's it. Btw, this component only renders once. :-)
  return (
    <>
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div
          className={styles.deck}
          key={i}
          style={{ x, y, border: "2px solid red", padding: "20px" }}
        >
          {/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
          <animated.div
            {...bind(i)}
            style={{
              transform: interpolate([rot, scale], trans),
              backgroundImage: `url(${cards[i]})`,
              border: "2px solid red",
              padding: "20px",
            }}
          />
        </animated.div>
      ))}
    </>
  );
}

export default function Home() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [transport, setTransport] = useState<string>("N/A");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Ref to store audio chunks
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref for the recording interval
  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
      console.log("doing this");
      socket.removeAllListeners();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Cleanup function to remove event listeners
    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopRecording(); // Ensure recording is stopped
    };

    window.addEventListener("beforeunload", cleanup);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Clear previous audio chunks
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const fileReader = new FileReader();

        fileReader.onloadend = () => {
          const base64String = fileReader.result as string;
          console.log(base64String);
          socket.emit("audioStream", base64String);
          // socket.emit("lol", "hey");
        };

        fileReader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      intervalRef.current = setInterval(() => {
        mediaRecorder.stop();
        mediaRecorder.start();
      }, 1000);
    } catch (error) {
      console.error("Error recording audio: ", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  const toggleRecordAudio = () => {
    if (isRecording) {
      setIsRecording(false);
      stopRecording();
    } else {
      setIsRecording(true);
      startRecording();
    }
  };

  return (
    // <div className={styles.container}>
    //   <p>Status: {isConnected ? "connected" : "disconnected"}</p>
    //   <p>Transport: {transport}</p>
    //   <button
    //     onClick={toggleRecordAudio}
    //     className={`px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-colors duration-300 ${
    //       isRecording
    //         ? "bg-red-500 hover:bg-red-600"
    //         : "bg-green-500 hover:bg-green-600"
    //     }`}
    //   >
    //     {isRecording ? "Stop Recording" : "Start Recording"}
    //   </button>
    //   <div>
    //     <Deck />
    //   </div>
    // </div>
    <div
      className={styles.container}
      style={{ border: "2px solid red", padding: "20px" }}
    >
      <div style={{ border: "2px solid red", padding: "20px" }}>
        <p>Status: {isConnected ? "connected" : "disconnected"}</p>
        <p>Transport: {transport}</p>
        <button
          onClick={toggleRecordAudio}
          className={`px-6 py-3 rounded-lg font-semibold text-white shadow-md transition-colors duration-300 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
      <Deck />
    </div>
  );
}
