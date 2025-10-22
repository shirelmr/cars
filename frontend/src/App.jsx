import { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';

export default function App() {
  let [location, setLocation] = useState("");
  let [trafficLights, setTrafficLights] = useState([]);
  let [simSpeed, setSimSpeed] = useState(10);
  const running = useRef(null);

  let setup = () => {
    console.log("Hola");
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({  })
    }).then(resp => resp.json())
    .then(data => {
      console.log("Setup data:", data);
      console.log("Traffic lights:", data["lights"]);
      setLocation(data["Location"]);
      setTrafficLights(data["lights"]);
    });
  }

  const handleStart = () => {
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        console.log("Update data:", data);
        console.log("Traffic lights:", data["lights"]);
        setTrafficLights(data["lights"]);
      });
    }, 1000 / simSpeed);
  };

  const handleStop = () => {
    clearInterval(running.current);
  }

  const handleSimSpeedSliderChange = (event, newValue) => {
    setSimSpeed(newValue);
  };


  return (
    <div>
      <div>
        <button onClick={setup}>
          Setup
        </button>
        <button onClick={handleStart}>
          Start
        </button>
        <button onClick={handleStop}>
          Stop
        </button>
      </div>

      <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg" style={{backgroundColor:"white"}}>
        <rect x={385} y={0} width={30} height={800} style={{fill: "darkgray"}} />
        <rect x={0} y={385} width={800} height={30} style={{fill: "darkgray"}} />
        
        {trafficLights.map((light, index) => {
          console.log("Rendering light:", light);
          const isHorizontal = light.orientation === "horizontal";
          let color;
          console.log("Light color:", light.color);
          switch(light.color) {
            case "GREEN": color = "#00FF00"; break;
            case "YELLOW": color = "#FFFF00"; break;
            case "RED": color = "#FF0000"; break;
            default: 
              console.log("Unknown color:", light.color);
              color = "#808080";
          }

          const x = isHorizontal ? 350 : 385;
          const y = isHorizontal ? 385 : 350;

          return (
            <rect 
              key={index}
              x={x}
              y={y}
              width={30}
              height={30}
              style={{fill: color, stroke: "black", strokeWidth: 1}}
            />
          );
        })}
      </svg>
    </div>
  );
}
