
module DashpoolComponents
using Dash

const resources_path = realpath(joinpath( @__DIR__, "..", "deps"))
const version = "0.0.58"

include("jl/chat.jl")
include("jl/dashpoolprovider.jl")
include("jl/explorer.jl")
include("jl/history.jl")
include("jl/loader.jl")

function __init__()
    DashBase.register_package(
        DashBase.ResourcePkg(
            "dashpool_components",
            resources_path,
            version = version,
            [
                DashBase.Resource(
    relative_package_path = "dashpool_components.js",
    external_url = "https://unpkg.com/dashpool_components@0.0.58/dashpool_components/dashpool_components.js",
    dynamic = nothing,
    async = nothing,
    type = :js
),
DashBase.Resource(
    relative_package_path = "dashpool_components.js.map",
    external_url = "https://unpkg.com/dashpool_components@0.0.58/dashpool_components/dashpool_components.js.map",
    dynamic = true,
    async = nothing,
    type = :js
)
            ]
        )

    )
end
end
