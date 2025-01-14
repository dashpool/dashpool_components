import dataclasses


@dataclasses.dataclass
class PdfHighlightContent:
    text: str = None
    image: str = None

@dataclasses.dataclass
class PdfHighlightPositionRect:
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float
    pageNumber: int = None

@dataclasses.dataclass
class PdfHighlightPosition:
    boundingRect: PdfHighlightPositionRect
    rects: list[PdfHighlightPositionRect]
    pageNumber: int

@dataclasses.dataclass
class PdfHighlightComment:
    text: str = None
    emoji: str = None

@dataclasses.dataclass
class PdfHighlight:
    content: PdfHighlightContent=None
    position: PdfHighlightPosition=None
    comment: PdfHighlightComment=None
    id: str=None
    file_id: str = None
    file_mode: str = None




class PDF:
    def __init__(self, url="", highlights=[], name=None, ref=None, size=450):
        self.url = url
        self.highlights = highlights
        self.name = name
        self.ref = ref
        self.size = size
        self.show = False

        # assert all(isinstance(h, PdfHighlight) for h in highlights)
        for h in highlights:
            assert isinstance(h, PdfHighlight)


    def highlights_to_dict(self):
        return [
            {
                "content": {
                    "text": h.content.text,
                    "image": h.content.image
                },
                "position": {
                    "boundingRect": {
                        "x1": h.position.boundingRect.x1,
                        "y1": h.position.boundingRect.y1,
                        "x2": h.position.boundingRect.x2,
                        "y2": h.position.boundingRect.y2,
                        "width": h.position.boundingRect.width,
                        "height": h.position.boundingRect.height,
                        "pageNumber": h.position.boundingRect.pageNumber
                    },
                    "rects": [
                        {
                            "x1": rect.x1,
                            "y1": rect.y1,
                            "x2": rect.x2,
                            "y2": rect.y2,
                            "width": rect.width,
                            "height": rect.height,
                            "pageNumber": rect.pageNumber
                        }
                        for rect in h.position.rects
                    ],
                    "pageNumber": h.position.pageNumber
                },
                "comment": {
                    "text": h.comment.text,
                    "emoji": h.comment.emoji
                },
                "id": h.id,
                "file_id": h.file_id,
                "file_mode": h.file_mode
            }
            for h in self.highlights
        ]

    def to_dict(self):
        return {
            "role": "pdf",
            "ref": self.ref,
            "show": self.show,
            "data": {
                "url": self.url,
                "size": self.size,
                "name": self.name,
                "highlights": self.highlights_to_dict()
            }
        }
    @staticmethod
    def from_dict(data, ref=None):
        url = data["file_id"] if "file_id" in data else None
        name = data["name"] if "name" in data else url
        
        highlights = [
            PdfHighlight(
                content=PdfHighlightContent(
                    text=data["content"]["text"] if "text" in data["content"] else None,
                    image=data["content"]["image"] if "image" in data["content"] else None
                ),
                position=PdfHighlightPosition(
                    boundingRect=PdfHighlightPositionRect(
                        x1=data["position"]["boundingRect"]["x1"],
                        y1=data["position"]["boundingRect"]["y1"],
                        x2=data["position"]["boundingRect"]["x2"],
                        y2=data["position"]["boundingRect"]["y2"],
                        width=data["position"]["boundingRect"]["width"],
                        height=data["position"]["boundingRect"]["height"],
                    ),
                    rects=[
                        PdfHighlightPositionRect(
                            x1=rect["x1"],
                            y1=rect["y1"],
                            x2=rect["x2"],
                            y2=rect["y2"],
                            width=rect["width"],
                            height=rect["height"],
                            pageNumber=rect["pageNumber"]
                        )
                        for rect in data["position"]["rects"]
                    ],
                    pageNumber=data["position"]["pageNumber"]
                ),
                comment=PdfHighlightComment(
                    text=data["comment"]["text"] if "text" in data["comment"] else "",
                    emoji=data["comment"]["emoji"] if "emoji" in data["comment"] else ""
                ) if "comment" in data else PdfHighlightComment(text="", emoji=""),
                id=data["id"] if "id" in data else None,
                file_id=data["file_id"] if "file_id" in data else None,
                file_mode=data["file_mode"] if "file_mode" in data else None,
            )
        ]
        return PDF(
            url=url,
            highlights=highlights,
            name=name,
            ref=ref
            )