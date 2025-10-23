import { useState, useRef } from 'react';
import Plot from 'react-plotly.js';

export default function App() {
  let [location, setLocation] = useState("");
  let [trafficLights, setTrafficLights] = useState([]);
  let [cars, setCars] = useState([]);
  let [simSpeed, setSimSpeed] = useState(10);
  let [numCars, setNumCars] = useState(1);
  let [speedHistory, setSpeedHistory] = useState([]);
  let [currentStep, setCurrentStep] = useState(0);
  const running = useRef(null);

  let setup = () => {
    console.log("Setting up simulation with", numCars, "cars");
    
    // Limpiar datos previos
    setSpeedHistory([]);
    setCurrentStep(0);
    
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_cars: numCars })
    }).then(resp => resp.json())
    .then(data => {
      console.log("Setup data:", data);
      setLocation(data["Location"]);
      setTrafficLights(data["lights"] || []);
      setCars(data["cars"] || []);
      setSpeedHistory([{step: 0, avgSpeed: data["avg_speed"] || 0}]);
    });
  }

  const handleStart = () => {
    if (running.current) {
      clearInterval(running.current);
    }
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        setTrafficLights(data["lights"] || []);
        setCars(data["cars"] || []);
        setCurrentStep(data["step"] || 0);
        
        // Agregar nueva velocidad al historial
        setSpeedHistory(prev => [
          ...prev, 
          {step: data["step"] || 0, avgSpeed: data["avg_speed"] || 0}
        ]);
      });
    }, 1000 / simSpeed);
  };

  const handleStop = () => {
    clearInterval(running.current);
  }

  // Preparar datos para la gráfica
  const speedData = {
    x: speedHistory.map(h => h.step),
    y: speedHistory.map(h => h.avgSpeed),
    type: 'scatter',
    mode: 'lines+markers',
    marker: {color: 'blue'},
    name: 'Velocidad Promedio'
  };

  return (
    <div style={{padding: "20px", display: "flex", gap: "20px"}}>
      {/* Panel izquierdo - Simulación */}
      <div>
        <div style={{marginBottom: "20px"}}>
          <button onClick={setup} style={{marginRight: "10px", padding: "10px 20px"}}>
            Setup
          </button>
          <button onClick={handleStart} style={{marginRight: "10px", padding: "10px 20px"}}>
            Start
          </button>
          <button onClick={handleStop} style={{marginRight: "10px", padding: "10px 20px"}}>
            Stop
          </button>
        </div>

        <div style={{marginBottom: "20px"}}>
          <label style={{marginRight: "20px"}}>
            Número de carros: 
            <input 
              type="number" 
              value={numCars} 
              onChange={(e) => setNumCars(parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              style={{marginLeft: "10px", width: "60px", padding: "5px"}}
            />
          </label>
          
          <label>
            Velocidad: 
            <input 
              type="range" 
              value={simSpeed} 
              onChange={(e) => setSimSpeed(parseInt(e.target.value))}
              min="1"
              max="30"
              style={{marginLeft: "10px"}}
            />
            {simSpeed}x
          </label>
        </div>

        <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg" style={{backgroundColor:"#e0e0e0", border: "2px solid #333"}}>
          {/* Calles */}
          <rect x={385} y={0} width={30} height={800} style={{fill: "#404040"}} />
          <rect x={0} y={385} width={800} height={30} style={{fill: "#404040"}} />
          
          {/* Líneas divisorias de carriles */}
          <line x1={400} y1={0} x2={400} y2={800} stroke="#FFD700" strokeWidth={2} strokeDasharray="10,10" />
          <line x1={0} y1={400} x2={800} y2={400} stroke="#FFD700" strokeWidth={2} strokeDasharray="10,10" />
          
          {/* Semáforos */}
          {trafficLights.map((light, index) => {
            const isHorizontal = light.orientation === "horizontal";
            let color;
            
            switch(light.color) {
              case "GREEN": color = "#00FF00"; break;
              case "YELLOW": color = "#FFFF00"; break;
              case "RED": color = "#FF0000"; break;
              default: color = "#808080";
            }

            const x = light.pos[0] * 32;
            const y = light.pos[1] * 32;

            return (
              <g key={`light-${index}`}>
                <rect 
                  x={x - 5}
                  y={y - 5}
                  width={10}
                  height={40}
                  style={{fill: "#333"}}
                />
                <circle 
                  cx={x}
                  cy={y + 20}
                  r={15}
                  style={{fill: color, stroke: "#000", strokeWidth: 2}}
                />
              </g>
            );
          })}
          
          {/* Carros */}
          {cars.map((car, index) => {
            const x = car.pos[0] * 32;
            const y = car.pos[1] * 32;

            return (
              <image
                key={`car-${index}`}
                href="/redcar.png"
                x={x - 15}
                y={y - 10}
                width={30}
                height={20}
              />
            );
          })}
        </svg>
        
        <div style={{marginTop: "20px"}}>
        </div>
      </div>

      {/* Panel derecho - Gráficas */}
      <div style={{backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "8px"}}>
        <h3>Monitoreo de Velocidad</h3>
        
        <Plot
          data={[speedData]}
          layout={{
            width: 500,
            height: 400,
            title: {text: 'Velocidad Promedio vs Tiempo'},
            xaxis: {title: 'Step'},
            yaxis: {title: 'Velocidad Promedio', range: [0, 1.1]},
            showlegend: true
          }}
        />

      </div>
    </div>
  );
}