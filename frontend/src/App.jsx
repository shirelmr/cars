import { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';

export default function App() {
  let [location, setLocation] = useState("");
  let [cars, setCars] = useState([]);
  let [simSpeed, setSimSpeed] = useState(10);
  let [car1Position, setCar1Position] = useState(null);
  let [xValues, setXValues] = useState([]);
  let [yValues, setYValues] = useState([]);
  const running = useRef(null);

  let setup = () => {
    console.log("Hola");
    setXValues([]);
    setYValues([]);
    
    fetch("http://localhost:8000/simulations", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({  })
    }).then(resp => resp.json())
    .then(data => {
      console.log(data);
      setLocation(data["Location"]);
      setCars(data["cars"]);
    });
  }

  const handleStart = () => {
    running.current = setInterval(() => {
      fetch("http://localhost:8000" + location)
      .then(res => res.json())
      .then(data => {
        setCars(data["cars"]);
        const car1 = data["cars"].find(car => car.id === 1);
        if (car1) {
          setCar1Position(car1.pos);
          setXValues(prev => [...prev, prev.length]);
          setYValues(prev => [...prev, car1.vel[0]]);
        }
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
      {car1Position && (
        <div style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '10px' }}>
          Posición del Carro 1: X = {car1Position[0]}, Y = {car1Position[1]}
        </div>
      )}
      <Plot
        data={[
          {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            line: { color: 'blue' }
          }
        ]}
        layout={{
          width: 320,
          height: 240
        }}
      />
      <svg width="800" height="500" xmlns="http://www.w3.org/2000/svg" style={{backgroundColor:"white"}}>

      <rect x={0} y={200} width={800} height={80} style={{fill: "darkgray"}}></rect>
      {
        cars.map(car =>
          <image id={car.id} x={car.pos[0]*32} y={240} width={32} href="./racing-car.png"/>
        )
      }
      </svg>
    </div>
  );
}
