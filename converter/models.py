from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class FieldModel:
    name: str
    type: str
    visibility: str = "+"  # +, -, #, ~
    static: bool = False

@dataclass
class MethodModel:
    name: str
    return_type: str
    parameters: List[str] = field(default_factory=list)
    visibility: str = "+"
    static: bool = False

@dataclass
class ClassModel:
    name: str
    type: str  # class, interface, enum, annotation
    visibility: str = "+"
    fields: List[FieldModel] = field(default_factory=list)
    methods: List[MethodModel] = field(default_factory=list)
    extends: Optional[str] = None
    implements: List[str] = field(default_factory=list)
    is_abstract: bool = False
    package: Optional[str] = None
    associations: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    aggregations: List[str] = field(default_factory=list)
    compositions: List[str] = field(default_factory=list)
