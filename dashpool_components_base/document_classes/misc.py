class DashpoolEvent:
    def __init__(self, id, data, ref=None):
        self.id = id
        self.data = data
        self.ref = ref

    def to_dict(self):
        return {
            "role": "dashpoolEvent",
            "ref": self.ref,
            "id": self.id,
            "content": self.data
        }
    

class NodeChangeEvent:
    def __init__(self, id, data, ref=None):
        self.id = id
        self.data = data
        self.ref = ref

    def to_dict(self):
        return {
            "role": "nodeChangeEvent",
            "ref": self.ref,
            "id": self.id,
            "content": self.data
        }    