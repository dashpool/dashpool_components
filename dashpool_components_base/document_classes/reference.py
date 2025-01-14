class Reference:
    def __init__(self, url="", markdown="", ref=None, img=None, size=450):
        self.url = url
        self.markdown = markdown
        self.ref = ref
        self.img = img
        self.size = size

    def to_dict(self):
        return {
            "role": "reference",
            "ref": self.ref,
            "show": False,
            "data": {"url": self.url, "size": self.size, "markdown": self.markdown, "img": self.img},
        }
