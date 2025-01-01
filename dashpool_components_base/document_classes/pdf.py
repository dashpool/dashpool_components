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
    def __init__(self, url, highlights=[], name=None, ref=None):
        self.url = url
        self.highlights = highlights
        self.name = name
        self.ref = ref
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
                "size": "",
                "name": self.name,
                "highlights": self.highlights_to_dict()
            }
        }
    