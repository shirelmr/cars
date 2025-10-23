include("traffic_simulation.jl")
using Genie, Genie.Renderer.Json, Genie.Requests, HTTP
using UUIDs
using Statistics

instances = Dict()

route("/simulations", method = POST) do
    payload = jsonpayload()
    
    # Obtener número de carros del payload, por defecto 1
    num_cars = get(payload, "num_cars", 1)

    model = initialize_model((25, 25), num_cars)
    id = string(uuid1())
    instances[id] = model

    # Recopilar datos de todos los agentes
    lights = []
    cars = []
    
    for agent in allagents(model)
        if agent isa TrafficLight
            light_data = Dict(
                "id" => agent.id,
                "pos" => agent.pos,
                "color" => string(agent.color),
                "orientation" => string(agent.orientation)
            )
            push!(lights, light_data)
        elseif agent isa Car
            car_data = Dict(
                "id" => agent.id,
                "pos" => agent.pos,
                "vel" => agent.vel
            )
            push!(cars, car_data)
        end
    end
    
    # Calcular velocidad promedio inicial
    avg_speed = length(cars) > 0 ? mean([c["vel"][1] for c in cars]) : 0.0
    
    response = Dict(
        "Location" => "/simulations/$id",
        "lights" => lights,
        "cars" => cars,
        "avg_speed" => avg_speed,
        "step" => 0
    )
    println("Sending response: ", response)
    json(response)
end

route("/simulations/:id") do
    id = payload(:id)
    
    model = instances[id]
    run!(model, 1)
    
    # Recopilar datos actualizados
    lights = []
    cars = []
    
    for agent in allagents(model)
        if agent isa TrafficLight
            light_data = Dict(
                "id" => agent.id,
                "pos" => agent.pos,
                "color" => string(agent.color),
                "orientation" => string(agent.orientation)
            )
            push!(lights, light_data)
        elseif agent isa Car
            car_data = Dict(
                "id" => agent.id,
                "pos" => agent.pos,
                "vel" => agent.vel
            )
            push!(cars, car_data)
        end
    end
    
    # Calcular velocidad promedio
    avg_speed = length(cars) > 0 ? mean([c["vel"][1] for c in cars]) : 0.0
    
    response = Dict(
        "lights" => lights,
        "cars" => cars,
        "avg_speed" => avg_speed,
        "step" => abmproperties(model)[:step]
    )
    json(response)
end

Genie.config.run_as_server = true
Genie.config.cors_headers["Access-Control-Allow-Origin"] = "*"
Genie.config.cors_headers["Access-Control-Allow-Headers"] = "Content-Type"
Genie.config.cors_headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS" 
Genie.config.cors_allowed_origins = ["*"]

up()