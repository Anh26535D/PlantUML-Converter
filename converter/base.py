from abc import ABC, abstractmethod
from typing import List
from .models import ClassModel

class BaseParser(ABC):
    """
    Abstract base class for all source code parsers.
    Any new language support must implement this interface.
    """

    @abstractmethod
    def parse(self, content: str) -> List[ClassModel]:
        """
        Parses the source code content and returns a list of ClassModel objects.
        
        Args:
            content: The raw source code string.
            
        Returns:
            A list of extracted ClassModel instances.
        """
        pass

    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """
        Returns a list of file extensions supported by this parser (e.g., ['.java']).
        """
        pass
