import dash
import dash_lumino_components as dlc
import dash_express_components as dxc
from dash import html, dcc, Input, Output
from dash.exceptions import PreventUpdate
from flask import jsonify, Response
import json
import time
import uuid 

import dashpool_components
import json
import random

explorerNodes = json.loads(
    """
            [
                {
                    "id": "lnhgx688h8funexyfv5",
                    "email": null,
                    "label": "Test",
                    "parent": "lnhgzwtog5zsk3zk7ii",
                    "type": "f"
                },
                {
                    "id": "lnhgzwtog5zsk3zk7ii",
                    "email": null,
                    "label": "Viktor",
                    "parent": "h",
                    "type": "f"
                },
                {
                    "id": "lnhh6q2heapfci0uc0o",
                    "email": null,
                    "label": "A",
                    "parent": "lnhh6v1l1i0jp7r6vpei",
                    "type": "f"
                },
                {
                    "id": "lnhh6v1l1i0jp7r6vpei",
                    "email": null,
                    "label": "B",
                    "parent": "h",
                    "type": "f"
                },
                {
                    "id": "lnhgn6u7ytnrhipilto",
                    "app": "example",
                    "data": {
                        "url": "\u002fexample\u002f_dash-update-component",
                        "request": {
                            "output": "graph-content.figure",
                            "outputs": {
                                "id": "graph-content",
                                "property": "figure"
                            },
                            "inputs": [
                                {
                                    "id": "dropdown-selection",
                                    "property": "value",
                                    "value": "Canada"
                                }
                            ],
                            "changedPropIds": []
                        },
                        "output": "graph-content.figure"
                    },
                    "email": null,
                    "frame": "lnhehq2gn6qz766iupd",
                    "label": "Schnappi",
                    "parent": "lnhgx688h8funexyfv5",
                    "type": "p"
                },
                {
                    "id": "lnhgxw8qcfdqdmivu3q",
                    "app": "example",
                    "data": {
                        "shared_users" : ["User 0"],
                        "url": "\u002fexample\u002f_dash-update-component",
                        "request": {
                            "output": "graph-content.figure",
                            "outputs": {
                                "id": "graph-content",
                                "property": "figure"
                            },
                            "inputs": [
                                {
                                    "id": "dropdown-selection",
                                    "property": "value",
                                    "value": "Canada"
                                }
                            ],
                            "changedPropIds": []
                        },
                        "output": "graph-content.figure"
                    },
                    "email": null,
                    "frame": "lnhehq2gn6qz766iupd",
                    "label": "Super",
                    "parent": "lnhgx688h8funexyfv5",
                    "type": "p"
                }
            ]
"""
)


apps = [
    {
        "name": "test",
        "group": "Widgets",
        "icon": "fa fa-plus",
        "url": "https://localhost:443/example/",
    }
]
users = ["User " + str(el) for el in range(10)]
groups = [{"id": "141234-asdfs-234234", "name": "Test Group"}]
frames = [
    {
        "id": "d1",
        "name": "test (1)",
        "group": "Widgets",
        "icon": "fa fa-plus",
        "url": "https://localhost:443/example/",
    },
    {
        "id": "d2",
        "name": "test (2)",
        "group": "Widgets",
        "icon": "fa fa-plus",
        "url": "https://localhost:443/example/",
    },
    {
        "id": "dlA",
        "name": "loader 1",
        "group": "Widgets",
        "icon": "fa fa-plus",
        "url": "https://localhost:443/example/",
    },
    {
        "id": "dlB",
        "name": "loader 2",
        "group": "Widgets",
        "icon": "fa fa-plus",
        "url": "https://localhost:443/example/",
    },    
]

historyNodes = [
    {
        "id": "12311",
        "type": "p",
        "label": "Plot1",
        "parent": "1",
        "frame": "frame1",
        "data": {"url": "https://localhost:443/example/_dash-update-component"},
    },
    {
        "id": "12313",
        "type": "a",
        "label": "Appstate1",
        "parent": "2",
        "frame": "frame1123",
        "data": {"url": "https://localhost:443/example/_dash-update-component"},
    },
    {
        "id": "loh8qm7nwx3bmr28sdg",
        "frame": "frame1123",
        "label": "Plot2",
        "type": "p",
        "data": {
            "url": "https://localhost:443/example/plotApi",
        },
    },
]

menu = dlc.Menu(
    [
        dlc.Command(
            id={"type": "openapp", "url": "https://localhost:443/example/"},
            label="test",
            icon="fa fa-plus",
        ),
    ],
    id="openMenu",
    title="Widgets",
)


def layout():
    return dashpool_components.DashpoolProvider(
        [
            dcc.Interval(id="userupdate", interval=20000, n_intervals=0),
            dlc.MenuBar(menu, "menuBar"),
            dlc.BoxPanel(
                [
                    dlc.SplitPanel(
                        [
                            dlc.TabPanel(
                                [
                                    dlc.Panel(
                                        id="tab-a",
                                        children=[
                                            dashpool_components.Explorer(
                                                id="explorer", nodes=explorerNodes
                                            ),
                                        ],
                                        label="Explorer",
                                        icon="far fa-clone",
                                    ),
                                ],
                                id="tab-panel-left",
                                tabPlacement="left",
                                allowDeselect=True,
                            ),
                            dlc.DockPanel(
                                [
                                    dlc.Widget(
                                        [
                                            html.Button(
                                                "Clear Explorer",
                                                id="clear-exp-btn",
                                                n_clicks=0,
                                            ),
                                            html.Button(
                                                "Clear History",
                                                id="clear-hist-btn",
                                                n_clicks=0,
                                            ),
                                            html.Div("", id="state-json"),
                                        ],
                                        id="d0",
                                        title="Extra",
                                    ),
                                    dlc.Widget(
                                        [
                                            html.H1("Explorer"),
                                            html.Div(id="explorerChangeEvent"),
                                            html.Div(id="explorerDashpoolEvent"),
                                            html.Div(id="explorerRefreshed"),
                                            html.H1("History"),
                                            html.Div(id="historyDashpoolEvent"),
                                            html.Div(id="historyRefreshed"),
                                            html.H1("Loader"),
                                            html.Div(id="loaderArequest"),
                                            html.H1("Chat"),
                                            html.Div(id="chatExplorerChangeEvent"),                                            
                                            html.Div(id="chatDashpoolEvent"),                                            
                                        ],
                                        id="d1",
                                        title="Events",
                                    ),
                                    dlc.Widget(
                                        [
                                            dashpool_components.Loader(
                                                id="loaderA",
                                                url="https://localhost/example/plotApi",
                                                request={
                                                    "plot": {
                                                        "type": "box",
                                                        "params": {
                                                            "x": "continent",
                                                            "y": "lifeExp",
                                                        },
                                                    },
                                                    "filter": [],
                                                    "transform": [],
                                                    "parameterization": {
                                                        "parameters": [],
                                                        "computeAll": False,
                                                        "computeMatrix": [],
                                                    },
                                                },
                                                output="fig.defParams",
                                            )
                                        ],
                                        id="dlA",
                                        title="DXC Loader",
                                    ),
                                    dlc.Widget(
                                        [
                                            dashpool_components.Loader(
                                                id="loaderB",
                                                url="https://localhost/example/_dash-update-component",
                                                request={
                                                    "output": "graph-content.figure",
                                                    "outputs": {
                                                        "property": "figure",
                                                        "id": "graph-content",
                                                    },
                                                    "inputs": [
                                                        {
                                                            "id": "dropdown-selection",
                                                            "property": "value",
                                                            "value": "Canada",
                                                        }
                                                    ],
                                                    "changedPropIds": [],
                                                },
                                                output="graph-content.figure",
                                            )
                                        ],
                                        id="dlB",
                                        title="DCC Loader",
                                    ),
                                ],
                                id="dock-panel",
                            ),
                            dlc.TabPanel(
                                [
                                    dlc.Panel(
                                        id="tab-h",
                                        children=[
                                            dashpool_components.History(
                                                id="history", nodes=historyNodes
                                            )
                                        ],
                                        label="History",
                                        icon="fa fa-clock-rotate-left",
                                    ),
                                ],
                                id="tab-panel-right",
                                tabPlacement="right",
                                allowDeselect=True,
                            ),
                        ],
                        id="splitPanel",
                    )
                ],
                "boxPanel",
                addToDom=True,
            ),
            dashpool_components.Chat(id="chat", messages=[], url="/ai"),
        ],
        id="context",
    )


app = dash.Dash(__name__)

app.layout = layout


@app.callback(
    Output("chatExplorerChangeEvent", "children"), Input("chat", "nodeChangeEvent")
)
def print_output(input):
    return json.dumps(input)

@app.callback(
    Output("chatDashpoolEvent", "children"), Input("chat", "dashpoolEvent")
)
def print_output(input):
    return json.dumps(input)


@app.callback(
    Output("explorerChangeEvent", "children"), Input("explorer", "nodeChangeEvent")
)
def print_output(input):
    return json.dumps(input)


@app.callback(Output("explorerRefreshed", "children"), Input("explorer", "n_refreshed"))
def print_output(input):
    return f"Explorer n_refreshed: {input}"


@app.callback(
    Output("explorerDashpoolEvent", "children"), Input("explorer", "dashpoolEvent")
)
def print_output(input):
    return json.dumps(input)


@app.callback(
    Output("historyRefreshed", "children"),
    Input("history", "n_refreshed"),
    Input("history", "n_cleared"),
)
def print_output(n_refreshed, n_cleared):
    return f"History n_refreshed: {n_refreshed}  n_cleared: {n_cleared}"


@app.callback(
    Output("historyDashpoolEvent", "children"), Input("history", "dashpoolEvent")
)
def print_output(input):
    return json.dumps(input)


@app.callback(
    Output("history", "nodes"),
    Input("clear-hist-btn", "n_clicks"),
    prevent_initial_call=True,
)
def clear_hist(input):
    return []


@app.callback(
    Output("explorer", "nodes"),
    Input("clear-exp-btn", "n_clicks"),
    prevent_initial_call=True,
)
def clear_exp(input):
    return []


@app.callback(Output("state-json", "children"), Input("context", "sharedData"))
def clear_exp(input):
    return json.dumps(input)


@app.callback(Output("loaderArequest", "children"), Input("loaderA", "request"))
def clear_exp(input):
    return json.dumps(input)


@app.callback(Output("context", "initialData"), Input("userupdate", "n_intervals"))
def update_initial_data(input):
    if input > 2:
        raise PreventUpdate()
    return {"apps": apps, "frames": frames, "groups": groups, "users": users}


@app.callback(Output("context", "widgetEvent"), Input("dock-panel", "widgetEvent"))
def passWidgetEvent(input):
    return input


@app.server.route("/ai", methods=["POST"])
def ai():
    if random.random() < 0.5:  # 50% chance of sending a chunked response with larger text
        return send_chunked_response()
    else:
        message_id = str(uuid.uuid4()) 
        return jsonify([{"role": "assistant", "id": message_id, "content": "Hello"}])


def send_chunked_response():
    def generate_chunks():
        message_id = str(uuid.uuid4()) 
        yield f'[\n{{"role": "assistant", "id": "{message_id}",  "content": "'

        # Generating and sending chunks of larger text
        large_text = "aaa aaa aaa aaa aa aaa a aa a aaaa  aaa "*100
        chunk_size = 3  # You can adjust the chunk size based on your needs
        for i in range(0, len(large_text), chunk_size):
            time.sleep(0.05)
            yield large_text[i:i + chunk_size]

        message_id = str(uuid.uuid4()) 
        yield f'"}},\n{{"role": "dashpoolEvent",  "id": "{message_id}",  "content": {{"test": 1, "versuch": "super"}} }}'

        time.sleep(.2)
        message_id = str(uuid.uuid4()) 
        yield f',\n{{"role": "assistant", "id": "{message_id}",  "content": "'

        large_text = "bb bbbbb bbb bbbbb b b bbb bbbbbb b bbbb  "*30
        chunk_size = 3  # You can adjust the chunk size based on your needs
        for i in range(0, len(large_text), chunk_size):
            time.sleep(0.05)
            yield large_text[i:i + chunk_size]


        yield '"}\n]'

        
    return Response(generate_chunks(), content_type="application/json")




if __name__ == "__main__":
    app.run_server(debug=True)
