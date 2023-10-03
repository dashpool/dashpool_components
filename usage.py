import dash
import dash_lumino_components as dlc
from dash import html, dcc, Input, Output

import dashpool_components
import json
import random

explorerNodes = [
    {"id": "1", "type": "f", "label": "Folder1", "parent": "h"},
    {"id": "2", "type": "f", "label": "Folder2"},
    {"id": "11", "type": "p", "label": "Plot1", "parent": "1", "app": "egal", "data": {"immergut": 1}},
    {"id": "12", "type": "r", "label": "Report1", "parent": "2"},
    {"id": "13", "type": "a", "label": "Appstate1", "parent": "2"},
    {"id": "useridvk", "type": "s", "label": "viktor@krueckl.de"},
    {"id": "50", "type": "p", "label": "PlotVK", "parent": "useridvk"},
    {"id": "101", "type": "f", "label": "FolderVK", "parent": "useridvk"},
    {"id": "51", "type": "r", "label": "ReportVK", "parent": "101"},
    {"id": "234", "type": "s", "label": "MK"},
    {"id": "lnafs85tqp8627eptjo", "type": "a", "label": "AppstateNew", "parent": "h", "app": "tango", "frame": "Frame1"}
]

historyNodes = [
    {"id": "12311", "type": "p", "label": "Plot1", "parent": "1", "app": "tango", "frame": "Frame1", "data": {"super": 1}},
    {"id": "12313", "type": "a", "label": "Appstate1", "parent": "2", "app": "tango", "frame": "Frame1"}
]


random.shuffle(explorerNodes)

menu = dlc.Menu([
            dlc.Command(id={"type": "openapp", "url": "https://localhost:443/example/"},
                        label="test", icon="fa fa-plus"),
        ], id="openMenu", title="Widgets")

layout = lambda: dashpool_components.DashpoolProvider([
    dcc.Interval(id='userupdate', interval=20000, n_intervals=0),
    dlc.MenuBar(menu, 'menuBar'),
    dlc.BoxPanel([
        dlc.SplitPanel([
            dlc.TabPanel(
                 [
                    dlc.Panel(id="tab-a", children=[
                        dashpool_components.Explorer(id='explorer', nodes=explorerNodes),
                         
                    ],
                    label="Explorer", icon="far fa-clone"),

                 ],
                 id='tab-panel-left',
                 tabPlacement="left",
                 allowDeselect=True),

            dlc.DockPanel([
                dlc.Widget([
                    html.H1("Explorer"),
                    html.Div(id="explorerChangeEvent"),
                    html.Div(id="explorerDashpoolEvent"),
                    html.Div(id="explorerRefreshed"),

                    html.H1("History"),
                    html.Div(id="historyDashpoolEvent"),
                    html.Div(id="historyRefreshed"),


                    ], id="d1", title="Events"),
            ], id="dock-panel"),

            dlc.TabPanel(
                [
                    dlc.Panel(id="tab-h", children=[
                        dashpool_components.History(id="history", nodes=historyNodes)
                    ], label="History", icon="fa fa-clock-rotate-left"),

                ],
                id='tab-panel-right',
                tabPlacement="right",
                allowDeselect=True)

        ], id="splitPanel")
    ], "boxPanel", addToDom=True)
])


app = dash.Dash(__name__)

app.layout = layout


@app.callback(
    Output("explorerChangeEvent", "children"),
    Input("explorer", "nodeChangeEvent")
)
def print_output(input):
    return json.dumps(input)


@app.callback(
    Output("explorerRefreshed", "children"),
    Input("explorer", "n_refreshed")
)
def print_output(input):
    return f"Explorer n_refreshed: {input}"


@app.callback(
    Output("explorerDashpoolEvent", "children"),
    Input("explorer", "dashpoolEvent")
)
def print_output(input):
    return json.dumps(input)



@app.callback(
    Output("historyRefreshed", "children"),
    Input("history", "n_refreshed")
)
def print_output(input):
    return f"History n_refreshed: {input}"


@app.callback(
    Output("historyDashpoolEvent", "children"),
    Input("history", "dashpoolEvent")
)
def print_output(input):
    return json.dumps(input)



if __name__ == '__main__':
    app.run_server(debug=True)



