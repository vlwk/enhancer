"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "./socket";

import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { useDrag } from "react-use-gesture";

import styles from "../styles.module.css";

const initialCards = [
  "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/1/13/Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg",
];

const replacementCards = [
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg",
];

// Animation helpers
const to = (i: number) => ({
  x: 0,
  y: 0,
  // y: 0
  scale: 1,
  // rot: -10 + Math.random() * 20,
  rot: 0,
  delay: i * 100,
});
const from = (_i: number) => ({ x: 0, rot: 0, scale: 1, y: 0 });
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(0deg) rotateY(${
    r / 10
  }deg) rotateZ(${r}deg) scale(${s})`;

function Deck({ onSendInfo, command }) {
  const [cards, setCards] = useState(initialCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(cards.length - 1);
  const [isInArray, setIsInArray] = useState(Array(cards.length).fill(true));
  const [props, api] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(i),
  })); // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity

  useEffect(() => {
    if (command === "zoom") {
      console.log("zoom triggered in Deck");
      window.open("zoomus://zoom.us/start"); // Opens the Zoom app
    }

    if (command === "enhance") {
      console.log("enhance triggered in Deck");

      api.start((i) => {
        if (i === currentCardIndex) {
          setCards((prevCards) => {
            const newCards = [...prevCards];
            newCards[i] = replacementCards[i];
            return newCards;
          });
        }
        return {}; // Keep other cards in place
      });
    }

    if (command === "left") {
      console.log("das me");
      console.log("left triggered in Deck");
      console.log(currentCardIndex);

      api.start((i) => {
        if (i === currentCardIndex) {
          return {
            x: -(1000 + window.innerWidth),
          };
        }
        return {}; // Keep other cards in place
      });

      setCurrentCardIndex((prevIndex) => {
        for (let i = prevIndex - 1; i >= 0; i--) {
          if (isInArray[i]) {
            return i;
          }
        }
        api.start((i) => {
          if (isInArray[i]) {
            return to(i);
          }
        });
        for (let i = isInArray.length - 1; i >= 0; i--) {
          if (isInArray[i]) {
            return i;
          }
        }
        return -1;
      });

      onSendInfo("hey");
    }

    //   if (command === "delete") {
    //     console.log("delete triggered in Deck");
    //     console.log(currentCardIndex);
    //     api.start((i) => {
    //       if (i === currentCardIndex) {
    //         return {
    //           y: -(200 + window.innerWidth),
    //         };
    //       }
    //       return {}; // Keep other cards in place
    //     });

    //     setIsInArray((prevArray) => {
    //       const newArray = [...prevArray]; // Create a copy of the previous state
    //       newArray[currentCardIndex] = false; // Set the desired index to false
    //       return newArray; // Return the updated array
    //     });

    //     // setCurrentCardIndex((prevIndex) => {
    //     //   for (let i = prevIndex - 1; i >= 0; i--) {
    //     //     if (isInArray[i]) {
    //     //       return i;
    //     //     }
    //     //   }
    //     //   api.start((i) => {
    //     //     if (isInArray[i]) {
    //     //       return to(i);
    //     //     }
    //     //   });
    //     //   for (let i = isInArray.length - 1; i >= 0; i--) {
    //     //     if (isInArray[i]) {
    //     //       return i;
    //     //     }
    //     //   }
    //     //   return -1;
    //     // });

    //     onSendInfo("hey");
    //   }
    //

    if (command === "delete") {
      console.log("delete triggered in Deck");
      console.log(currentCardIndex);

      const startX = 0; // Starting x position (centered)
      const endX = -window.innerWidth / 2; // Ending x position (bottom left)
      const endY = window.innerHeight / 2; // Ending y position (bottom of the screen)
      const duration = 500; // Duration of the animation in milliseconds

      // Parabolic motion with shrinking and spinning effect
      const parabolicPath = (t) => {
        const progress = t / duration; // Normalized time
        const height = (window.innerHeight / 4) * Math.sin(Math.PI * progress); // Up then down
        const scale = 1 - progress * 0.5; // Shrink to 50% of original size
        const x = startX + (endX - startX) * progress; // Linear interpolation for x
        const y = height; // Move up and down
        const rotation = progress * 720; // Rotate 720 degrees over the duration
        return { x, y, scale, rotation };
      };

      const animate = () => {
        let startTime;

        const step = (time) => {
          if (!startTime) startTime = time;
          const elapsed = time - startTime;

          if (elapsed < duration) {
            const { x, y, scale, rotation } = parabolicPath(elapsed);
            api.start((i) => {
              if (i === currentCardIndex) {
                return { x, y, scale, rot: rotation }; // Update position, scale, and rotation
              }
              return {}; // Keep other cards in place
            });
            requestAnimationFrame(step); // Continue animation
          } else {
            // Final position when animation ends
            api.start((i) => {
              if (i === currentCardIndex) {
                return { x: endX, y: endY, scale: 0, rot: 720 }; // Final position and rotation
              }
              return {}; // Keep other cards in place
            });
          }
        };

        requestAnimationFrame(step); // Start the animation
      };

      animate(); // Call the animate function

      // Update the array state to mark the card as deleted
      setIsInArray((prevArray) => {
        const newArray = [...prevArray]; // Create a copy of the previous state
        newArray[currentCardIndex] = false; // Set the desired index to false
        return newArray; // Return the updated array
      });

      onSendInfo("hey");
    }

    // if (command === "delete") {
    //   console.log("delete triggered in Deck");
    //   console.log(currentCardIndex);

    //   const startX = 0; // Starting x position (centered)
    //   const endX = -window.innerWidth; // Ending x position (bottom left)
    //   const duration = 500; // Duration of the animation in milliseconds

    //   // Parabolic motion with shrinking effect
    //   const parabolicPath = (t) => {
    //     const progress = t / duration; // Normalized time
    //     const height = (window.innerHeight / 4) * Math.sin(Math.PI * progress); // Up then down
    //     const scale = 1 - progress; // Shrink to 50% of original size
    //     const x = startX + (endX - startX) * progress; // Linear interpolation for x
    //     return { x, y: height, scale };
    //   };

    //   const animate = () => {
    //     let startTime;

    //     const step = (time) => {
    //       if (!startTime) startTime = time;
    //       const elapsed = time - startTime;

    //       if (elapsed < duration) {
    //         const { x, y, scale } = parabolicPath(elapsed);
    //         api.start((i) => {
    //           if (i === currentCardIndex) {
    //             return { x, y, scale }; // Update position and scale
    //           }
    //           return {}; // Keep other cards in place
    //         });
    //         requestAnimationFrame(step); // Continue animation
    //       } else {
    //         // Final position when animation ends
    //         api.start((i) => {
    //           if (i === currentCardIndex) {
    //             return { x: endX, y: window.innerHeight, scale: 0 }; // Final position and scale down to 0
    //           }
    //           return {}; // Keep other cards in place
    //         });
    //       }
    //     };

    //     requestAnimationFrame(step); // Start the animation
    //   };

    //   animate(); // Call the animate function

    //   // Update the array state to mark the card as deleted
    //   setIsInArray((prevArray) => {
    //     const newArray = [...prevArray]; // Create a copy of the previous state
    //     newArray[currentCardIndex] = false; // Set the desired index to false
    //     return newArray; // Return the updated array
    //   });

    //   onSendInfo("hey");
    // }
  }, [command]); // Add dependencies for useEffect

  useEffect(() => {
    if (isInArray.every((val) => val)) {
      return; // Skip if all values are true
    }
    console.log("lol");
    setCurrentCardIndex((prevIndex) => {
      for (let i = prevIndex - 1; i >= 0; i--) {
        if (isInArray[i]) {
          return i;
        }
      }
      api.start((i) => {
        if (isInArray[i]) {
          return to(i);
        }
      });
      for (let i = isInArray.length - 1; i >= 0; i--) {
        if (isInArray[i]) {
          return i;
        }
      }
      return -1;
    });
  }, [isInArray]); // Runs whenever isInArray changes

  // const bind = useDrag(
  //   ({
  //     args: [index],
  //     down,
  //     movement: [mx, my],
  //     direction: [xDir, yDir],
  //     velocity,
  //   }) => {
  //     console.log("dragged" + index);
  //     const trigger = velocity > 0.2; // If you flick hard enough it should trigger the card to fly out
  //     // let dirX = xDir < 0 ? -1 : 1; // Direction should either point left or right

  //     // let dirY = yDir < 0 ? -1 : 1;
  //     let dirX = -1;
  //     let dirY = -1;
  //     if (Math.abs(xDir) < Math.abs(yDir)) {
  //       dirX = 0;
  //       dirY = yDir < 0 ? -1 : 1;
  //     } else {
  //       dirX = xDir < 0 ? -1 : 1;
  //       dirY = 0;
  //     }

  //     if (!down && trigger) {
  //       gone.add(index);
  //       if (dirY != 0) {
  //         deleted.add(index);
  //       }
  //     }
  //     api.start((i) => {
  //       if (index !== i) return;
  //       const isGone = gone.has(index);
  //       const x = isGone ? (200 + window.innerWidth) * dirX : down ? mx : 0;
  //       const y = isGone ? (200 + window.innerWidth) * dirY : down ? my : 0;
  //       // const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0); // How much the card tilts, flicking it harder makes it rotate faster
  //       const scale = down ? 1.1 * zoom : 1 * zoom;
  //       return {
  //         x,
  //         y,
  //         // rot,
  //         scale,
  //         delay: undefined,
  //         config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
  //       };
  //     });
  //     if (!down && gone.size === cards.length)
  //       setTimeout(() => {
  //         gone.clear();
  //         api.start((i) => {
  //           // Only reset cards that are not in the gone set
  //           if (!deleted.has(i)) {
  //             return to(i); // Animate to the original position
  //           } else {
  //             gone.add(i);
  //             return {
  //               y: -200 - window.innerHeight,
  //             }; // Keep gone cards out of view
  //           }
  //         });
  //       }, 600);
  //   }
  // );

  return (
    <>
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div
          className={`${styles.deck}`}
          key={i}
          style={{ x, y, padding: "20px" }}
        >
          <animated.div
            // {...bind(i)}
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
  const [command, setCommand] = useState(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [transport, setTransport] = useState<string>("N/A");
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Ref to store audio chunks
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref for the recording interval

  const handleInfoFromChild = (info) => {
    console.log("Received from child:", info);
    setCommand((command) => null);
  };

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

      socket.on("returnCommand", (message) => {
        console.log("Received message: ", message);
        setCommand(message);
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
      socket.off("returnCommand");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopRecording(); // Ensure recording is stopped
    };

    window.addEventListener("beforeunload", cleanup);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("returnCommand");
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
        // audioChunksRef.current = [];
        while (audioChunksRef.current.length > 1)
          audioChunksRef.current.shift();
        const fileReader = new FileReader();

        fileReader.onloadend = () => {
          const base64String = fileReader.result as string;
          //console.log(base64String);
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
    <div className={styles.container} style={{ border: "2px solid red" }}>
      <div className={styles.container2}>
        <p style={{ color: "white" }}>
          Status: {isConnected ? "connected" : "disconnected"}
        </p>
        <p style={{ color: "white" }}>Transport: {transport}</p>
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
      <div className={styles.container3}>
        <div className={styles.container3a}>
          <div className={`${styles.container4} ${styles.flashingborder}`}>
            <Deck onSendInfo={handleInfoFromChild} command={command} />
          </div>
        </div>
        <div className={styles.container3b}></div>
      </div>
    </div>
  );
}
