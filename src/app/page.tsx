"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "./socket";

import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { useDrag } from "react-use-gesture";

import styles from "../styles.module.css";
import styles2 from "../styles2.module.css";

const initialCards = [
  [
    "https://upload.wikimedia.org/wikipedia/commons/1/13/Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg",
  ],
  [
    "enhances/amogus_stage4.png",
    "enhances/amogus_stage2.png",
    "enhances/amogus_stage1.png",
    "enhances/amogus_stage0.png",
    "enhances/amogus_stage.png",
  ],
  [
    "enhances/small_stage6.png",
    "enhances/small_stage5.png",
    "enhances/small_stage2.png",
    "enhances/small_stage1.png",
    "enhances/small_stage.png",
  ],
  [
    "enhances/mystery_stage6.png",
    "enhances/mystery_stage3.png",
    "enhances/mystery_stage2.png",
    "enhances/mystery_stage1.png",
    "enhances/mystery_stage0.png",
    "enhances/mystery_stage.png",
  ],
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

function Deck({ onSendInfo, command, lock }) {
  const [cards, setCards] = useState(() => {
    return initialCards.map((card) => [card[0], 0]);
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(cards.length - 1);
  const [isInArray, setIsInArray] = useState(Array(cards.length).fill(true));
  const [props, api] = useSprings(cards.length, (i) => ({
    ...to(i),
    from: from(i),
  })); // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity

  useEffect(() => {
    if (!lock) {
      //back, sus, reset
      if (command === "zoom") {
        // voice
        console.log("zoom triggered in Deck");
        window.open("zoomus://zoom.us/start"); // Opens the Zoom app
      }

      if (command === "enhance") {
        // voice
        console.log("enhance triggered in Deck");

        api.start((i) => {
          if (i === currentCardIndex) {
            setCards((prevCards) => {
              const newCards = [...prevCards];
              let idx: number = newCards[i][1];
              console.log(idx);
              if (initialCards[i].length > idx + 1) {
                newCards[i] = [initialCards[i][idx + 1], idx + 1];
              }
              return newCards;
            });
          }
          return {}; // Keep other cards in place
        });
        onSendInfo("hey");
      }

      if (command === "point") {
        const imageUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Replace with your image URL
        window.open(imageUrl, "_blank"); // Open in a new tab
        onSendInfo("hey");
      }

      if (command === "reset") {
        console.log("reset triggered in Deck");
        api.start((i) => {
          if (i === currentCardIndex) {
            setCards((prevCards) => {
              const newCards = [...prevCards];
              let idx: number = newCards[i][1];
              console.log(idx);
              newCards[i] = [initialCards[i][0], 0];
              return newCards;
            });
          }
          return {};
        });
        onSendInfo("hey");
      }

      //swipe,throw,point,snap,zoomin,middle

      // if (command === "")
      // if (command === "zoomin") {
      //   console.log("zoomin triggered in Deck");
      //   api.start((i) => {
      //     if (i === currentCardIndex) {
      //       return {
      //         scale: 2.0,
      //       };
      //     }
      //     return {};
      //   });
      //   onSendInfo("hey");
      // }

      if (command === "snap") {
        console.log("snap triggered in Deck");

        setTimeout(() => {}, 2000);
        const newCards = cards.map(
          (cardGroup) =>
            cardGroup.map(
              () =>
                "https://wallpapers.com/images/featured/blank-white-7sn5o1woonmklx1h.jpg"
            ) // Replace each image with the white picture
        );
        setCards(newCards);
        onSendInfo("snap");
      }

      if (command === "zoomin") {
        console.log("zoomin triggered in Deck");

        // Start the zoom-in effect
        api.start((i) => {
          if (i === currentCardIndex) {
            return {
              scale: 2.0, // Zoom in
            };
          }
          return {};
        });

        // Set a timeout to zoom out after 2 seconds
        setTimeout(() => {
          api.start((i) => {
            if (i === currentCardIndex) {
              return {
                scale: 1.0, // Zoom out
              };
            }
            return {};
          });
        }, 2000); // 2 seconds
        onSendInfo("hey");
      }

      if (command === "swipe") {
        // gesture
        console.log("swipe triggered in Deck");
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

      if (command === "throw" || command === "delete") {
        // gesture
        console.log("throw triggered in Deck");
        console.log(currentCardIndex);

        const startX = 0; // Starting x position (centered)
        const endX = -window.innerWidth / 2; // Ending x position (bottom left)
        const endY = window.innerHeight / 2; // Ending y position (bottom of the screen)
        const duration = 500; // Duration of the animation in milliseconds

        // Parabolic motion with shrinking and spinning effect
        const parabolicPath = (t) => {
          const progress = t / duration; // Normalized time
          const height =
            (window.innerHeight / 4) * Math.sin(Math.PI * progress); // Up then down
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
    }
  }, [command]); // Add dependencies for useEffect

  useEffect(() => {
    if (isInArray.every((val) => val)) {
      return; // Skip if all values are true
    }
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
              backgroundImage: `url(${cards[i][0]})`,
              //border: "2px solid red",
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
  const [lock, setLock] = useState(false);
  const [snap, setSnap] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Ref to store audio chunks
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref for the recording interval

  const handleInfoFromChild = (info) => {
    console.log("Received from child:", info);
    if (info == "snap") {
      setSnap((snap) => true);

      setTimeout(() => {
        setSnap((snap) => false);
      }, 2000);
    }
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

        if (message == "middle") {
          setLock((lock) => !lock);
        }
        if (message == "snap") {
          const audio = new Audio("avengers.mp3");
          audio.play();
        }
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
    <div className={styles.container}>
      <video
        autoPlay
        loop
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="surveil.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className={styles.container2}>
        <div className={styles2.container}>
          <div className={styles2.neon}>
            Status:
            {isConnected ? " Connected" : " Disconnected"}
          </div>
        </div>
        <div className={styles2.container}>
          <div className={styles2.neon}>Transport:{" " + transport}</div>
        </div>
        <div className={styles2.container}>
          <button onClick={toggleRecordAudio} className={styles2.neonbutton}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>
      </div>
      <div className={styles.container3}>
        <div className={styles.container3a}>
          <div className={`${styles.container4} ${styles.flashingborder}`}>
            <Deck
              onSendInfo={handleInfoFromChild}
              command={command}
              lock={lock}
            />
          </div>
        </div>
        <div className={styles.container3b}>
          <img
            src={"http://0.0.0.0:8080/webcam"}
            alt="Webcam Stream"
            style={{ height: "100%" }}
          />
        </div>
      </div>
      {lock && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "url('https://ichef.bbci.co.uk/ace/standard/624/cpsprodpb/119C9/production/_89473127_frank_kendohacking.jpg')", // Replace with your overlay image path
            backgroundSize: "cover",
            opacity: 0.5, // Adjust opacity as needed
            zIndex: 1, // Ensure it's above the card
          }}
        />
      )}
      {snap && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "url('https://upload.wikimedia.org/wikipedia/en/a/a0/Thanos%27s_snap_from_Avengers_Infinity_War.gif')", // Replace with your overlay image path
            backgroundSize: "cover",
            opacity: 0.5, // Adjust opacity as needed
            zIndex: 5, // Ensure it's above the card
          }}
        />
      )}
    </div>
  );
}
