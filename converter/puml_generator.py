from .models import ClassModel

class PUMLGenerator:
    def generate(self, classes: list[ClassModel], title: str = None) -> str:
        # User reported syntax errors. Let's simplify the output for maximum compatibility.
        start_tag = f"@startuml {title}" if title else "@startuml"
        lines = [start_tag, ""]
        
        # --- Clean & Standard Aesthetics ---
        lines.append("skinparam shadowing false")
        lines.append("skinparam class {")
        lines.append("    BackgroundColor white")
        lines.append("    ArrowColor #263238")
        lines.append("    BorderColor #263238")
        lines.append("}")
        lines.append("skinparam packageStyle rectangle")
        
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

        # --- Auto Alignment & Layout Logic ---
        total_classes = len(classes)
        num_packages = len(packages)
        
        # Calculate link metrics
        class_link_counts = {cls.name: 0 for cls in classes}
        for cls in classes:
            node_rels = []
            self._collect_relationships_internal(cls, node_rels)
            class_link_counts[cls.name] += len(node_rels)
            # Count incoming links too (approximate)
            for rel in node_rels:
                for other in classes:
                    if other.name != cls.name and f" {other.name}" in rel:
                         class_link_counts[other.name] += 1

        avg_links = sum(class_link_counts.values()) / total_classes if total_classes > 0 else 0
        package_density = total_classes / (num_packages if num_packages > 0 else 1)
        
        # Determine orientation
        if num_packages >= 4 or package_density > 5:
            lines.append("left to right direction")
        else:
            lines.append("top to bottom direction")

        # Adjust spacing
        nodesep = 50
        ranksep = 60
        if total_classes > 15:
            nodesep += 30
            ranksep += 40
            
        lines.append(f"skinparam nodesep {nodesep}")
        lines.append(f"skinparam ranksep {ranksep}")
        
        # Linetype ortho can sometimes cause errors if dot is not updated or on Windows,
        # but polyline is very safe.
        lines.append("skinparam linetype polyline")
        lines.append("")

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

        final_rels = []

        # Write class definitions in packages
        for pkg, pkg_classes in packages.items():
            lines.append(f"  package \"{pkg}\" {{")
            # Sort by name for deterministic output
            sorted_pkg_classes = sorted(pkg_classes, key=lambda x: x.name)
            for cls in sorted_pkg_classes:
                write_class_definition(cls, lines)
                self._collect_relationships_internal(cls, final_rels)
            lines.append("  }")
            lines.append("")

        # Write classes with no package
        for cls in sorted(no_package, key=lambda x: x.name):
            write_class_definition(cls, lines)
            self._collect_relationships_internal(cls, final_rels)

        # Write all relationships at the end
        if final_rels:
            lines.append("")
            lines.append("' Relationships")
            # Deduplicate and sort for clean output
            for rel in sorted(list(set(final_rels))):
                lines.append(rel)

        lines.append("@enduml")
        return "\n".join(lines)

    def _collect_relationships_internal(self, cls, rel_lines):
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
        
        # Dependencies
        ignore_types = set(cls.associations) | set(cls.aggregations) | set(cls.compositions)
        for dep in set(cls.dependencies):
            if dep != cls.name and dep not in ignore_types:
                rel_lines.append(f"{cls.name} ..> {dep}")
