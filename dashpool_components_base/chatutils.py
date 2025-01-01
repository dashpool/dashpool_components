from . document_classes import *

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

            doc_counter = 0

            yield "[\n"
            for response in self.responses:

                # check if reference of doc class is set
                if isinstance(response, document_classes):
                    if response.ref is None:
                        response.ref = "doc" + str(doc_counter)
                        doc_counter = doc_counter + 1
                

                # first make a dict
                response_dict = response.to_dict() if isinstance(response, document_classes) else response

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