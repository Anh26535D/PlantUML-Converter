import javalang
from .models import ClassModel, FieldModel, MethodModel

class JavaParser:
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
            field_type = field_node.type.name
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
            return_type = method_node.return_type.name if method_node.return_type else "void"
            params = [p.type.name for p in method_node.parameters]
            
            class_model.methods.append(MethodModel(
                name=method_node.name,
                return_type=return_type,
                parameters=params,
                visibility=vis,
                static=static
            ))

        return class_model

    def _get_visibility(self, modifiers) -> str:
        if "public" in modifiers: return "+"
        if "private" in modifiers: return "-"
        if "protected" in modifiers: return "#"
        return "~"
