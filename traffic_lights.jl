using Agents, Random
using StaticArrays: SVector

@enum TrafficLightColor GREEN YELLOW RED

@agent struct TrafficLight(ContinuousAgent{2,Float64})
    color::TrafficLightColor
    timer::Int
    orientation::Symbol
end

const GREEN_TIME = 10
const YELLOW_TIME = 4
const CYCLE_TIME = 2 * (GREEN_TIME + YELLOW_TIME)

function agent_step!(agent::TrafficLight, model)
    agent.timer += 1
    
    if agent.orientation == :horizontal
        cycle_position = mod(agent.timer, CYCLE_TIME)
    else
        cycle_position = mod(agent.timer + CYCLE_TIME ÷ 2, CYCLE_TIME)
    end
    
    if cycle_position < GREEN_TIME
        agent.color = GREEN
    elseif cycle_position < GREEN_TIME + YELLOW_TIME
        agent.color = YELLOW
    else
        agent.color = RED
    end
end

function initialize_model(extent = (25, 25))
    space2d = ContinuousSpace(extent; spacing = 0.5)
    rng = Random.MersenneTwister()

    properties = Dict(
        :step => 0
    )

    model = StandardABM(
        TrafficLight, 
        space2d;
        properties = properties,
        rng, 
        agent_step!, 
        scheduler = Schedulers.Randomly()
    )

    add_agent!(
        SVector(extent[1]/2 - 2, extent[2]/2),
        TrafficLight,
        model;
        color = GREEN,
        timer = 100,
        orientation = :horizontal,
        vel = SVector(0.0, 0.0)
    )

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