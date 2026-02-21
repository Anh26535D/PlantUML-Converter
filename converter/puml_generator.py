from .models import ClassModel

class PUMLGenerator:
    def generate(self, classes: list[ClassModel], title: str = None) -> str:
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

        def write_class(cls, lines):
            header = f"{cls.type} {cls.name}"
            if cls.is_abstract and cls.type == "class":
                header = f"abstract class {cls.name}"
            
            lines.append(f"  {header} {{")
            for f in cls.fields:
                prefix = "{static} " if f.static else ""
                lines.append(f"    {f.visibility}{prefix}{f.name} : {f.type}")
            for m in cls.methods:
                prefix = "{static} " if m.static else ""
                params = ", ".join(m.parameters)
                lines.append(f"    {m.visibility}{prefix}{m.name}({params}) : {m.return_type}")
            lines.append("  }")
            
            if cls.extends:
                lines.append(f"  {cls.extends} <|-- {cls.name}")
            for imp in cls.implements:
                lines.append(f"  {imp} <|.. {cls.name}")
            lines.append("")

        # Write classes in packages
        for pkg, pkg_classes in packages.items():
            lines.append(f"package \"{pkg}\" {{")
            for cls in pkg_classes:
                write_class(cls, lines)
            lines.append("}")
            lines.append("")

        # Write classes with no package
        for cls in no_package:
            write_class(cls, lines)

        lines.append("@enduml")
        return "\n".join(lines)
