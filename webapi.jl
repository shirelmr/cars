include("traffic_simulation.jl")
using Genie, Genie.Renderer.Json, Genie.Requests, HTTP
using UUIDs

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
    
    response = Dict(
        "Location" => "/simulations/$id",
        "lights" => lights,
        "cars" => cars
    )
    println("Sending response: ", response)
    json(response)
end

route("/simulations/:id") do
    id = payload(:id)
    println("Received GET request for simulation: ", id)
    
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
    
    response = Dict(
        "lights" => lights,
        "cars" => cars
    )
    json(response)
end

Genie.config.run_as_server = true
Genie.config.cors_headers["Access-Control-Allow-Origin"] = "*"
Genie.config.cors_headers["Access-Control-Allow-Headers"] = "Content-Type"
Genie.config.cors_headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS" 
Genie.config.cors_allowed_origins = ["*"]

up()