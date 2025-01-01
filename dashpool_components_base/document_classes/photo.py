class Photo:
    def __init__(self, url, width=None, height=None, ref=None):
        self.url = url
        self.width = width
        self.height = height
        self.ref = ref
        self.show = False


    def to_dict(self):
        return {
            "role": "photo",
            "ref": self.ref,
            "show": self.show,
            "data": {
                "uri": self.url,
                "size": "",
                "width": self.width,
                "height": self.height
            }
        }
    
