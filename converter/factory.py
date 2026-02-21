from typing import Dict, Type, List
from .base import BaseParser
from .java_parser import JavaParser
from .kotlin_parser import KotlinParser

class ParserFactory:
    """
    Factory for creating and managing different language parsers.
    """
    def __init__(self):
        self._parsers: Dict[str, BaseParser] = {}
        # Auto-register existing parsers
        self.register_parser(JavaParser())
        self.register_parser(KotlinParser())

    def register_parser(self, parser: BaseParser):
        """Registers a parser instance for its supported extensions."""
        for ext in parser.supported_extensions:
            self._parsers[ext.lower()] = parser

    def get_parser_for_extension(self, extension: str) -> BaseParser:
        """Returns the appropriate parser for a given file extension."""
        return self._parsers.get(extension.lower())

    def get_supported_extensions(self) -> List[str]:
        """Returns all extensions that have a registered parser."""
        return list(self._parsers.keys())
