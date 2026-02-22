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
│   └── piml_generator.py # Package Infrastructure Modeling Language
├── visualizer/           # Interactive Canvas (React/Vite)
│   ├── src/components/   # Custom React Flow nodes (Class, Package, EditableEdge)
│   └── src/assets/       # Persistent layout.json and model.json
├── examples/             # Sample code for testing
├── main.py               # CLI entry point for model extraction
├── service.py            # FastAPI persistence service
└── DEVELOPMENT.md        # Technical guidelines
```

## 📦 Module Descriptions

### `converter/models.py`
The source of truth for code structure. Contains the `ClassModel` and relationship definitions.

### `converter/aml_generator.py`
The core engine of Aetheris. It translates `ClassModel` objects into the `.aml` plain-text DSL.

### `visualizer/`
A high-performance React application built on **React Flow**. It provides:
- **PackageNode**: Nested, resizable containers for grouped classes.
- **EditableEdge**: Custom SVG routing with draggable waypoints.
- **Persistence**: Real-time sync with `service.py` to save spatial arrangements.

### `service.py`
A lightweight FastAPI server that acts as the bridge between the browser and the filesystem. It handles auto-saving of `layout.json` to ensure your design work is never lost.

---

## 🛠️ Workflow

### Dependency Management
- **Python**: Use `uv` (Fastest).
- **Frontend**: Use `npm`.

## 🧪 Testing
- Always verify changes against the `examples/` directory.
- For new features, ensure:
    1. `main.py` correctly extracts the structure.
    2. `service.py` accurately persists new metadata (like colors or waypoints).
    3. The `visualizer` remains responsive with large diagrams.
