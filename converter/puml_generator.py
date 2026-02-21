from .models import ClassModel

class PUMLGenerator:
    def generate(self, classes: list[ClassModel], title: str = None) -> str:
        # User requested @startuml name. Quotes are generally safer.
        start_tag = f"@startuml \"{title}\"" if title else "@startuml"
        lines = [start_tag]
        
        # Group by package
        packages = {}
        no_package = []
        for cls in classes:
            if cls.package:
                if cls.package not in packages:
                    packages[cls.package] = []
                packages[cls.package].append(cls)
            else:
                no_package.append(cls)

        rel_lines = []

        def write_class_definition(cls, lines):
            header = f"{cls.type} {cls.name}"
            if cls.is_abstract and cls.type == "class":
                header = f"abstract class {cls.name}"
            
            lines.append(f"    {header} {{")
            for f in cls.fields:
                prefix = "{static} " if f.static else ""
                suffix = f" : {f.type}" if f.type else ""
                vis = f.visibility if f.visibility else ""
                lines.append(f"      {vis}{prefix}{f.name}{suffix}")
            for m in cls.methods:
                prefix = "{static} " if m.static else ""
                params = ", ".join(m.parameters)
                suffix = f" : {m.return_type}" if m.return_type else ""
                vis = m.visibility if m.visibility else ""
                lines.append(f"      {vis}{prefix}{m.name}({params}){suffix}")
            lines.append("    }")

        def collect_relationships(cls, rel_lines):
            # Relationships
            if cls.extends:
                rel_lines.append(f"{cls.extends} <|-- {cls.name}")
            for imp in cls.implements:
                rel_lines.append(f"{imp} <|.. {cls.name}")
            
            # Associations (Field types)
            for assoc in set(cls.associations):
                if assoc != cls.name:
                    rel_lines.append(f"{cls.name} --> {assoc}")
            
            # Aggregations (Collections)
            for agg in set(cls.aggregations):
                if agg != cls.name:
                    rel_lines.append(f"{cls.name} o-- {agg}")
            
            # Compositions
            for comp in set(cls.compositions):
                if comp != cls.name:
                    rel_lines.append(f"{cls.name} *-- {comp}")
            
            # Dependencies (Method params/returns)
            ignore_types = set(cls.associations) | set(cls.aggregations) | set(cls.compositions)
            for dep in set(cls.dependencies):
                if dep != cls.name and dep not in ignore_types:
                    rel_lines.append(f"{cls.name} ..> {dep}")

        # Write class definitions in packages
        for pkg, pkg_classes in packages.items():
            lines.append(f"  package \"{pkg}\" {{")
            for cls in pkg_classes:
                write_class_definition(cls, lines)
                collect_relationships(cls, rel_lines)
            lines.append("  }")
            lines.append("")

        # Write classes with no package
        for cls in no_package:
            write_class_definition(cls, lines)
            collect_relationships(cls, rel_lines)

        # Write all relationships at the end, outside of package blocks
        # This prevents ghost classes from being created in the wrong package
        if rel_lines:
            lines.append("")
            lines.append("' Relationships")
            # Deduplicate relationship lines
            for rel in sorted(list(set(rel_lines))):
                lines.append(rel)

        lines.append("@enduml")
        return "\n".join(lines)
