# 🛠️ Aetheris Development Rules

This document outlines the coding standards, repository practices, and general guidelines for the **Aetheris** project.

## 🐍 Coding Standards (Python)

All Python code should follow [PEP 8](https://peps.python.org/pep-0008/) style guidelines.

### Classes
- **Naming**: Use `PascalCase`.
- **Purpose**: Each class should have a single responsibility (SRP).
- **Initialization**: Use `dataclasses` for pure data containers.

---

## 🪵 Git Commit Guidelines

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

### Example
`feat(aml): implement basic class serialization to .aml`

---

## 🏗️ Project Structure

```text
aetheris/
├── converter/            # Core logic package
│   ├── base.py           # Abstract base class for all parsers
│   ├── factory.py        # Parser factory
│   ├── java_parser.py    # Java-specific logic
│   ├── kotlin_parser.py  # Kotlin-specific logic
│   ├── models.py         # Shared data models
│   ├── aml_generator.py  # Aetheris Modeling Language engine
│   └── puml_generator.py # Legacy PlantUML support
├── visualizer/           # Interactive Canvas (React/Vite)
├── examples/             # Sample code for testing
├── main.py               # CLI entry point
└── DEVELOPMENT.md        # Technical guidelines
```

## 📦 Module Descriptions

### `converter/models.py`
The source of truth for code structure. Contains the `ClassModel` and relationship definitions.

### `converter/aml_generator.py`
The core engine of Aetheris. It translates `ClassModel` objects into the `.aml` plain-text DSL.

### `visualizer/` (Upcoming)
The React-based frontend that consumes `.aml` and `.layout.json` files to provide a drag-and-drop architectural experience.

### `converter/puml_generator.py`
Maintained for backward compatibility with PlantUML environments.

---

## 🛠️ Workflow

### Dependency Management
Use `uv` for all dependency management.

## 🧪 Testing
- Always verify changes against the `examples/` directory.
- For new features, ensure both the AML output and the Visualizer state remain consistent.
