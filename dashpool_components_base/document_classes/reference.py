class Reference:
    def __init__(self, url, markdown="", ref=None, img=None):
        self.url = url
        self.markdown = markdown
        self.ref = ref
        self.img = img

    def to_dict(self):
        return {
            "role": "reference",
            "ref": self.ref,
            "show": False,
            "data": {"url": self.url, "size": "", "markdown": self.markdown, "img": self.img},
        }
