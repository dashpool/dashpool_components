from . document_classes import *
import datetime


def get_promtflow_inputs(content):
    """Extract the query, history and shared data from the content
    
    Arguments:
        content {list} -- The content list from the request
        
        Returns:
        dict -- The extracted inputs
        
    """

    query = ""
    # get the user query
    for el in content:
        if "role" in el and el["role"] == "user" and "content" in el:
            query = el["content"]

    # get the history
    history_user = [
        el for el in content if "role" in el and el["role"] == "user"]
    history_assistant = [
        el for el in content if "role" in el and el["role"] == "assistant"]
    # skip the last user message
    history_user = history_user[:-1]
    # combine the user and assistant messages
    history = [
        {"inputs": {"query": el_user["content"]},
         "outputs": {"reply": el_assistant["content"]}}
        for el_user, el_assistant in zip(history_user, history_assistant)]

    # get the shared data
    userData = [el for el in content if "role" in el and el["role"] == "sharedData"][0]

    return  {
        "query": query,
        "history": history,
        "userData": userData
    }



class Response:
    """ A context manager for creating a streaming response object

    Arguments:
        app {Flask} -- The Flask app object
        logger_collection {MongoCollection} -- The collection to log the response
        inputs {dict} -- The inputs to the flow

    """
    def __init__(self, app, logger_collection=None, inputs=None):
        import dash

        if isinstance(app, dash.Dash):
            app = app.server

        self.app = app
        self.callables = []
        self.generators = []
        self.responses = []
        self.logger_collection = logger_collection

        if logger_collection is not None:
            # TODO 
            self.logger_collection.create_index("end_timestamp", expireAfterSeconds=86400 * 5)

        self.logger_doc = {
            "start_timestamp": datetime.datetime.now(),
            "documents": []
        }

        if inputs is not None:
            self.logger_doc.update(inputs)
            if "query" in inputs and "input" not in self.logger_doc:
                self.logger_doc["input"] = inputs["query"]



    def __ensure_id(self, el):
        import uuid
        if 'id' not in el:
            el['id'] = str(uuid.uuid4())

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def add(self, response):
        import types

        if callable(response):
            self.callables.append(response)
        elif isinstance(response, types.GeneratorType):
            self.generators.append(response)
        else:
            self.responses.append(response)

        if self.logger_collection is not None:
            if isinstance(response, document_classes):
                el = response.to_dict()
                self.logger_doc["documents"].append(el)

    def log(self, ref, data):
        self.logger_doc[ref] = data


    def sanitize_string(self, input: str) -> str:
        """Sanitize a string by removing invalid escape sequences, non-printable characters,
        and ensuring valid Unicode encoding."""
        import re
        import string
        import json

        # Remove non-printable characters (e.g., control characters)
        input = ''.join(filter(lambda x: x in string.printable, input))

        input = json.dumps(input)[1:-1]

        def inner_sanitize_string(item: str) -> str:
            found = False

            # Iteratively remove invalid Unicode sequences (\uXXX with incorrect length)
            while re.search(r'\\u(?![0-9a-fA-F]{4})[0-9a-fA-F]*', item):
                item = re.sub(r'\\u(?![0-9a-fA-F]{4})[0-9a-fA-F]*', '', item)
                found = True

            # Iteratively remove invalid escape sequences (like \y, \g, etc.)
            while re.search(r'\\([^nrtbf\"\\/])', item):
                item = re.sub(r'\\([^nrtbf\"\\/])', r'\1', item)
                found = True

            # Iteratively remove backslash escapes for numbers (\4, \5)
            while re.search(r'\\[0-9]', item):
                item = re.sub(r'\\([0-9])', r'\1', item)
                found = True
            
            return item, found
        

        # Iteratively remove invalid escape sequences
        found = True
        while found:
            input, found = inner_sanitize_string(input)

        return input

    def generate_response(self):
        import json
        import uuid
        import time
        import string

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

            output_str = ""

            first = True

            for g in self.callables:
                if not first:
                    yield ",\n"
                first = False
                id = str(uuid.uuid4())
                yield f'{{"role": "assistant", "id": "{id}" , "content": "'
                for item in g():
                    # we need to escape single quotes and newlines
                    item = item.replace("\n", "\\n").replace("'", "\\'").replace('"', '\\"')
                    output_str += item
                    yield item
                yield '"}\n'

            for g in self.generators:
                if not first:
                    yield ",\n"
                first = False
                id = str(uuid.uuid4())
                yield f'{{"role": "assistant", "id": "{id}" , "content": "'
                for item in g:
                    # we need to escape single quotes and newlines
                    item = self.sanitize_string(item)

                    output_str += item
                    yield item
                yield '"}\n'


            yield "]"

            if self.logger_collection is not None:
                self.logger_doc["output"] = output_str
                self.logger_doc["end_timestamp"] = datetime.datetime.now()
                self.logger_collection.insert_one(self.logger_doc)


        return self.app.response_class(generator(), mimetype='application/json')


