

class File:
    def __init__(self, url, size):
        self.url = url
        self.size = size

    def to_dict(self):
        return {
            "role": "file",
            "data": {
                "url": self.url,
                "size": self.size if self.size else "File"
            }
        }

class Photo:
    def __init__(self, url, width, height):
        self.url = url
        self.width = width
        self.height = height

    def to_dict(self):
        return {
            "role": "photo",
            "data": {
                "uri": self.url,
                "width": self.width if self.width else 100,
                "height": self.height if self.height else 100
            }
        }
    
class DashpoolEvent:
    def __init__(self, id, data):
        self.id = id
        self.data = data

    def to_dict(self):
        return {
            "role": "dashpoolEvent",
            "id": self.id,
            "content": self.data
        }
    
class NodeChangeEvent:
    def __init__(self, id, data):
        self.id = id
        self.data = data

    def to_dict(self):
        return {
            "role": "nodeChangeEvent",
            "id": self.id,
            "content": self.data
        }    



class Response:
    def __init__(self, app):
        import dash

        if isinstance(app, dash.Dash):
            app = app.server

        self.app = app
        self.responses = []
        self.generators = []


    def __ensure_id(self, el):
        import uuid
        if 'id' not in el:
            el['id'] = str(uuid.uuid4())

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def add(self, response):

        if callable(response):
            self.generators.append(response)
        else:
            self.responses.append(response)

    def generate_response(self):
        import json
        import uuid

        def generator():
            yield "[\n"
            for response in self.responses:

                # first make a dict
                response_dict = response.to_dict() if isinstance(response, (File, Photo, DashpoolEvent, NodeChangeEvent)) else response

                # add the id
                self.__ensure_id(response_dict)

                # then dump it to json
                yield json.dumps(response_dict) + "\n,\n"

            for g in self.generators:
                id = str(uuid.uuid4())
                yield f'{{"role": "assistant", "id": "{id}" , "content": "'
                for item in g():
                    # we need to escape single quotes and newlines
                    item = item.replace("\n", "\\n").replace("'", "\\'").replace('"', '\\"')
                    yield item
                yield '"}\n'
            yield "]"



        return self.app.response_class(generator(), mimetype='application/json')