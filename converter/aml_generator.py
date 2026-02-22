from typing import List, Dict
from .models import ClassModel, FieldModel, MethodModel

class AMLGenerator:
    """
    Generates Aetheris Modeling Language (AML) from ClassModel objects.
    """
    
    def generate(self, classes: List[ClassModel]) -> str:
        lines = []
        
        # Group classes by namespace
        namespaces: Dict[str, List[ClassModel]] = {}
        no_namespace: List[ClassModel] = []
        
        for cls in classes:
            if cls.package:
                if cls.package not in namespaces:
                    namespaces[cls.package] = []
                namespaces[cls.package].append(cls)
            else:
                no_namespace.append(cls)
        
        # Render namespaced classes
        for ns, ns_classes in sorted(namespaces.items()):
            lines.append(f"namespace {ns} {{")
            for cls in sorted(ns_classes, key=lambda x: x.name):
                lines.extend(self._render_class(cls, indent="    "))
            lines.append("}\n")
            
        # Render classes without namespace
        for cls in sorted(no_namespace, key=lambda x: x.name):
            lines.extend(self._render_class(cls))
            lines.append("")

        # Render relationships
        lines.append("// Relationships")
        relationships = self._collect_relationships(classes)
        for rel in sorted(relationships):
            lines.append(rel)
            
        return "\n".join(lines)

    def _render_class(self, cls: ClassModel, indent: str = "") -> List[str]:
        lines = []
        modifiers = "abstract " if cls.is_abstract and cls.type == "class" else ""
        lines.append(f"{indent}{modifiers}{cls.type} {cls.name} {{")
        
        # Fields
        for f in cls.fields:
            static = " static" if f.static else ""
            vis = f" [{f.visibility}]" if f.visibility else " [+]"
            lines.append(f"{indent}    {f.name}: {f.type}{vis}{static}")
            
        # Methods
        for m in cls.methods:
            static = " static" if m.static else ""
            vis = f" [{m.visibility}]" if m.visibility else " [+]"
            params = ", ".join(m.parameters)
            lines.append(f"{indent}    {m.name}({params}): {m.return_type}{vis}{static}")
            
        lines.append(f"{indent}}}")
        return lines

    def _collect_relationships(self, classes: List[ClassModel]) -> List[str]:
        rel_lines = []
        for cls in classes:
            full_name = self._get_full_name(cls)
            
            if cls.extends:
                rel_lines.append(f"{full_name} --|> {cls.extends}")
            
            for imp in cls.implements:
                rel_lines.append(f"{full_name} ..|> {imp}")
                
            for assoc in set(cls.associations):
                if assoc != cls.name:
                    rel_lines.append(f"{full_name} -> {assoc} [type: association]")
                    
            for agg in set(cls.aggregations):
                if agg != cls.name:
                    rel_lines.append(f"{full_name} o-- {agg} [type: aggregation]")
                    
            for comp in set(cls.compositions):
                if comp != cls.name:
                    rel_lines.append(f"{full_name} *-- {comp} [type: composition]")
                    
            # Ignore types already covered by association/aggregation/composition for dependencies
            ignore_types = set(cls.associations) | set(cls.aggregations) | set(cls.compositions)
            for dep in set(cls.dependencies):
                if dep != cls.name and dep not in ignore_types:
                    rel_lines.append(f"{full_name} ..> {dep} [type: dependency]")
                    
        return rel_lines

    def _get_full_name(self, cls: ClassModel) -> str:
        # For relationships, we might want to use fully qualified names if in different namespaces.
        # For now, we'll use simple names as the model mostly contains simple names from the parser.
        return cls.name
