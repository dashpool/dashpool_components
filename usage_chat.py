import dash
import dash_lumino_components as dlc
import dash_express_components as dxc
from dash import html, dcc, Input, Output
from dash.exceptions import PreventUpdate
from flask import jsonify, Response, request, abort, redirect, url_for
import random

import dashpool_components

import json


app = dash.Dash(__name__)

app.layout = html.Div(
    [
        dashpool_components.DashpoolProvider(
            [
                dashpool_components.Chat(
                    id="chat",
                    messages=[],
                    url="/ai",
                    title=None,
                    showClearButton=True,
                    showReportButton=True,
                ),
            ],
            id="context",
            requireLogin=True,
            defaultReload=False,
        )
    ],
    style={"width": "100%", "height": "100vh"},
)

@app.server.route("/ai", methods=["POST", "GET"])
def ai():
    from dashpool_components import chatutils
    import random
    import string

    try:
        content = request.get_json()
    except Exception as e:
        content = [{"role":"sharedData"},{"role":"user","content":"test"}]



    with chatutils.Response(app) as resp:

        resp.add(
            chatutils.Photo(
                "https://raw.githubusercontent.com/dashpool/.github/main/media/logo.svg",
                100,
                100,
                ref="ref1",
            )
        )


        response_text = "This is a response from the AI service. [ref1]"
        def generator():
            for el in response_text:
                yield el
        resp.add(generator)

        return resp.generate_response()
    
    


@app.server.route("/oauth2/userinfo")
def userinfo():
    # Check if 'my_cookie' is set, return 401 if not
    if not request.cookies.get("my_cookie"):
        return Response(status=401)
    return jsonify({"email": "test@test.de"})

@app.server.route("/oauth2/start")
def start():
    return redirect("/dummy")


@app.server.route("/dummy")
def dummy():
    import time
    from flask import make_response, redirect
    time.sleep(1)
    resp = make_response(redirect("/"))
    resp.set_cookie("my_cookie", "cookie_value", max_age=3600, httponly=True)
    return resp


if __name__ == "__main__":
    app.run_server(debug=True)
