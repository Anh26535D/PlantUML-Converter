from tree_sitter import Language, Parser
import tree_sitter_kotlin
from .models import ClassModel, FieldModel, MethodModel

class KotlinParser:
    def __init__(self):
        self.language = Language(tree_sitter_kotlin.language())
        self.parser = Parser(self.language)

    def parse(self, content: str) -> list[ClassModel]:
        tree = self.parser.parse(bytes(content, "utf8"))
        classes = []
        
        package_name = None
        package_header = self._find_child(tree.root_node, "package_header")
        if package_header:
            pkg_id = self._find_child(package_header, "qualified_identifier") or \
                     self._find_child(package_header, "identifier")
            if pkg_id:
                package_name = self._get_text(pkg_id)
        
        self._traverse(tree.root_node, classes, package_name)
        return classes

    def _traverse(self, node, classes, package_name: str = None):
        if node.type in ("class_declaration", "object_declaration", "interface_declaration"):
            classes.append(self._parse_class(node, package_name))
        
        for child in node.children:
            self._traverse(child, classes, package_name)

    def _parse_class(self, node, package_name: str = None) -> ClassModel:
        name = ""
        class_type = "class"
        if node.type == "interface_declaration":
             class_type = "interface"
        elif node.type == "object_declaration":
             class_type = "object"

        # Find name
        for child in node.children:
            if child.type in ("identifier", "type_identifier", "simple_identifier"):
                name = child.text.decode("utf8")
                break
        
        model = ClassModel(name=name, type=class_type, package=package_name)
        
        # Inheritance
        delegation = self._find_child(node, "delegation_specifiers")
        if delegation:
            for spec in delegation.children:
                if spec.type == "delegation_specifier":
                    # Check for class or interface
                    user_type = self._find_child(spec, "user_type")
                    if not user_type:
                        # Might be in constructor_invocation
                        cons_inv = self._find_child(spec, "constructor_invocation")
                        if cons_inv:
                            user_type = self._find_child(cons_inv, "user_type")
                    
                    if user_type:
                        parent_name = self._get_text(user_type)
                        # In Kotlin it's hard to distinguish extends vs implements without context
                        # We'll just put it in extends for now, or check if it looks like a class call ()
                        if self._find_child(spec, "constructor_invocation"):
                            model.extends = parent_name
                        else:
                            model.implements.append(parent_name)

        # Primary constructor parameters as fields
        primary_cons = self._find_child(node, "primary_constructor")
        if primary_cons:
            params = self._find_child(primary_cons, "class_parameters")
            if params:
                for param in params.children:
                    if param.type == "class_parameter":
                        field = self._parse_class_parameter(param)
                        if field: model.fields.append(field)

        # Body
        body = self._find_child(node, "class_body")
        if body:
            for child in body.children:
                if child.type == "property_declaration":
                    field = self._parse_property(child)
                    if field: model.fields.append(field)
                elif child.type == "function_declaration":
                    method = self._parse_function(child)
                    if method: model.methods.append(method)

        return model

    def _parse_class_parameter(self, node) -> FieldModel:
        # Check if it's a val/var
        if not (self._find_child(node, "val") or self._find_child(node, "var")):
            return None
            
        name = self._get_text(self._find_child(node, "identifier"))
        type_node = self._find_child(node, "user_type") or self._find_child(node, "type")
        prop_type = self._get_text(type_node) if type_node else "Any"
        
        return FieldModel(name=name, type=prop_type)

    def _parse_property(self, node) -> FieldModel:
        # Simplified: property_declaration -> variable_declaration -> identifier
        var_decl = self._find_child(node, "variable_declaration")
        if not var_decl: return None
        
        name = self._get_text(self._find_child(var_decl, "identifier"))
        type_node = self._find_child(var_decl, "user_type") or self._find_child(var_decl, "type")
        prop_type = self._get_text(type_node) if type_node else "Any"
        
        return FieldModel(name=name, type=prop_type)

    def _parse_function(self, node) -> MethodModel:
        name = self._get_text(self._find_child(node, "identifier"))
        ret_type = "Unit"
        params = []
        
        type_node = self._find_child(node, "user_type") or self._find_child(node, "type")
        if type_node: ret_type = self._get_text(type_node)
        
        val_params = self._find_child(node, "function_value_parameters")
        if val_params:
            for p in val_params.children:
                if p.type == "parameter":
                    p_type_node = self._find_child(p, "type") or self._find_child(p, "user_type")
                    if p_type_node: params.append(self._get_text(p_type_node))
                    else: params.append("Any")
        
        return MethodModel(name=name, return_type=ret_type, parameters=params)

    def _find_child(self, node, node_type):
        for child in node.children:
            if child.type == node_type:
                return child
        return None

    def _get_text(self, node):
        return node.text.decode("utf8") if node else ""
