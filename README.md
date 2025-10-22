# Implementación de Semáforos en la Simulación

## Implementación del Agente Semáforo

### Definición del Tipo TrafficLight

```julia
@enum TrafficLightColor GREEN YELLOW RED

@agent struct TrafficLight(ContinuousAgent{2,Float64})
    color::TrafficLightColor    # Estado actual del semáforo
    timer::Int                  # Contador para cambios de estado
    orientation::Symbol         # :horizontal o :vertical
end
```

El agente `TrafficLight` hereda de `ContinuousAgent{2,Float64}` para poder posicionarse en un espacio 2D. Los atributos adicionales son:
- `color`: Enum que representa el color actual del semáforo
- `timer`: Contador que ayuda a sincronizar los cambios de estado
- `orientation`: Define si el semáforo controla el tráfico horizontal o vertical

### Constantes de Tiempo

```julia
const GREEN_TIME = 10     # Duración de la luz verde
const YELLOW_TIME = 4     # Duración de la luz amarilla
const RED_TIME = 14      # Duración de la luz roja
const CYCLE_TIME = 28    # Ciclo completo
```

Estas constantes definen la duración de cada fase del ciclo del semáforo. El ciclo completo es la suma de:
- Tiempo en verde
- Tiempo en amarillo
- Tiempo en rojo (mientras el otro semáforo completa su ciclo)

### Lógica de Actualización

```julia
function agent_step!(agent::TrafficLight, model)
    props = abmproperties(model)
    props[:step] += 1
    tiempo = props[:step]
    
    cycle_time = mod(tiempo - 1, CYCLE_TIME)
    
    if agent.orientation == :horizontal
        if cycle_time < GREEN_TIME
            agent.color = GREEN
        elseif cycle_time < GREEN_TIME + YELLOW_TIME
            agent.color = YELLOW
        else
            agent.color = RED
        end
    else
        if cycle_time < GREEN_TIME + YELLOW_TIME
            agent.color = RED
        elseif cycle_time < GREEN_TIME + YELLOW_TIME + GREEN_TIME
            agent.color = GREEN
        elseif cycle_time < CYCLE_TIME
            agent.color = YELLOW
        end
    end
end
```

La función `agent_step!` implementa la lógica de cambio de estados:

1. **Timer Global**: 
   - Usa `props[:step]` como contador global para sincronizar todos los semáforos
   - Se incrementa en cada paso de la simulación

2. **Cálculo del Tiempo en el Ciclo**:
   - `cycle_time = mod(tiempo - 1, CYCLE_TIME)` determina la posición actual en el ciclo
   - El módulo asegura que el ciclo se repita cada `CYCLE_TIME` pasos

3. **Lógica de Cambio de Color**:
   - Para semáforo horizontal:
     * `0 → GREEN_TIME`: Verde
     * `GREEN_TIME → GREEN_TIME + YELLOW_TIME`: Amarillo
     * Resto del ciclo: Rojo
   
   - Para semáforo vertical:
     * `0 → GREEN_TIME + YELLOW_TIME`: Rojo (mientras el horizontal está activo)
     * `GREEN_TIME + YELLOW_TIME → GREEN_TIME + YELLOW_TIME + GREEN_TIME`: Verde
     * Resto del ciclo: Amarillo

### Inicialización del Modelo

```julia
function initialize_model(extent = (25, 25))
    space2d = ContinuousSpace(extent; spacing = 0.5)
    properties = Dict(:step => 0)
    
    model = StandardABM(
        TrafficLight, 
        space2d;
        properties = properties,
        agent_step!,
        scheduler = Schedulers.ByID()  # Asegura actualización ordenada
    )

    # Semáforo horizontal (comienza en verde)
    add_agent!(
        SVector(extent[1]/2 - 2, extent[2]/2),
        TrafficLight,
        model;
        color = GREEN,
        timer = 0,
        orientation = :horizontal,
        vel = SVector(0.0, 0.0)
    )

    # Semáforo vertical (comienza en rojo)
    add_agent!(
        SVector{2, Float64}(12.0, 15.0),
        TrafficLight,
        model;
        color = RED,
        timer = 0,
        orientation = :vertical,
        vel = SVector(0.0, 0.0)
    )

    model
end
```

La función `initialize_model` configura:
1. Un espacio continuo 2D para posicionar los semáforos
2. El contador global inicializado en 0
3. El scheduler `ByID()` para actualización ordenada
4. Dos semáforos en posiciones opuestas de la intersección
   - El horizontal comienza en verde
   - El vertical comienza en rojo