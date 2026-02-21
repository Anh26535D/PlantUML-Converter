import javalang
from .base import BaseParser
from .models import ClassModel, FieldModel, MethodModel

class JavaParser(BaseParser):
    @property
    def supported_extensions(self) -> list[str]:
        return [".java"]

    def parse(self, content: str) -> list[ClassModel]:
        tree = javalang.parse.parse(content)
        classes = []
        
        package_name = tree.package.name if tree.package else None
        
        for _, node in tree.filter(javalang.tree.ClassDeclaration):
            classes.append(self._parse_class_node(node, "class", package_name))
            
        for _, node in tree.filter(javalang.tree.InterfaceDeclaration):
            classes.append(self._parse_class_node(node, "interface", package_name))

        for _, node in tree.filter(javalang.tree.EnumDeclaration):
            classes.append(self._parse_class_node(node, "enum", package_name))
            
        return classes

    def _parse_class_node(self, node, class_type: str, package_name: str = None) -> ClassModel:
        visibility = self._get_visibility(node.modifiers)
        is_abstract = "abstract" in node.modifiers if hasattr(node, "modifiers") else False
        
        extends = None
        if hasattr(node, "extends") and node.extends:
            if isinstance(node.extends, list):
                extends = node.extends[0].name
            else:
                extends = node.extends.name
                
        implements = []
        if hasattr(node, "implements") and node.implements:
            implements = [i.name for i in node.implements]

        class_model = ClassModel(
            name=node.name,
            type=class_type,
            visibility=visibility,
            extends=extends,
            implements=implements,
            is_abstract=is_abstract,
            package=package_name
        )

        for field_node in node.fields:
            modifiers = field_node.modifiers
            vis = self._get_visibility(modifiers)
            static = "static" in modifiers
            
            raw_type = field_node.type.name
            is_collect = raw_type in ("List", "Set", "Collection", "Map", "ArrayList", "HashSet")
            field_type = self._extract_type_name(field_node.type)
            
            # Detect association vs aggregation
            if not self._is_primitive(field_type):
                if is_collect:
                    class_model.aggregations.append(field_type)
                else:
                    class_model.associations.append(field_type)
            
            for declarator in field_node.declarators:
                class_model.fields.append(FieldModel(
                    name=declarator.name,
                    type=field_type,
                    visibility=vis,
                    static=static
                ))

        for method_node in node.methods:
            modifiers = method_node.modifiers
            vis = self._get_visibility(modifiers)
            static = "static" in modifiers
            return_type = self._extract_type_name(method_node.return_type) if method_node.return_type else "void"
            params = [self._extract_type_name(p.type) for p in method_node.parameters]
            
            # Detect dependencies
            for t in [return_type] + params:
                if not self._is_primitive(t) and t != "void":
                    class_model.dependencies.append(t)
            
            class_model.methods.append(MethodModel(
                name=method_node.name,
                return_type=return_type,
                parameters=params,
                visibility=vis,
                static=static
            ))

        # Handle Enum constants
        if isinstance(node, javalang.tree.EnumDeclaration):
            for constant in node.body.constants:
                class_model.fields.append(FieldModel(
                    name=constant.name,
                    type="",
                    visibility="",
                    static=False
                ))

        return class_model

    def _extract_type_name(self, type_node) -> str:
        if not type_node: return "void"
        name = type_node.name
        # Handle generics like List<User>
        if hasattr(type_node, "arguments") and type_node.arguments:
            args = []
            for arg in type_node.arguments:
                if hasattr(arg, "type") and arg.type:
                    args.append(self._extract_type_name(arg.type))
            if args:
                # Return the inner type for relationship detection if it's a collection
                if name in ("List", "Set", "Collection", "Map", "ArrayList", "HashSet"):
                    return args[0] # Simplification
                return f"{name}<{', '.join(args)}>"
        return name

    def _is_primitive(self, type_name: str) -> bool:
        primitives = {"int", "long", "short", "byte", "float", "double", "boolean", "char", "String", "Object", "Integer", "Long", "Boolean", "Double", "Float"}
        return type_name in primitives

    def _get_visibility(self, modifiers) -> str:
        if "public" in modifiers: return "+"
        if "private" in modifiers: return "-"
        if "protected" in modifiers: return "#"
        return "~"
