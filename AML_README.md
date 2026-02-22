# 🌌 Aetheris Modeling Language (AML)

**AML** is the backbone of the Aetheris ecosystem. It is a clean, modern alternative to legacy diagramming languages like PlantUML or Mermaid, specifically optimized for **interactive rendering** and **architectural persistence**.

## Why AML?

1.  **Visual Decoupling**: AML defines *what* your system is. A separate `.layout.json` defines *where* things are. This means you can move a class on the canvas without the underlying code definition changing.
2.  **Strict Typing**: Unlike looser formats, AML is designed to map 1:1 with Java/Kotlin Abstract Syntax Trees (ASTs).
3.  **Human-First**: The syntax is inspired by modern programming languages, making it instantly familiar to developers.

## Basic Syntax at a Glance

```aml
namespace com.app {
    class Service {
        + execute()
    }
}

com.app.Service -> com.app.Repository [label: "accesses"]
```

## Integration with Aetheris

When you run Aetheris on your source code:
1.  **Extraction**: The Aetheris Engine parses your Java/Kotlin files.
2.  **Generation**: It produces an `.aml` file representing your code.
3.  **Visualization**: The Aetheris Canvas reads the `.aml` and renders a draggable, zoomable diagram.

## Roadmap for AML

- [ ] **LSP Support**: Syntax highlighting and autocomplete for VS Code.
- [ ] **Bidirectional Sync**: Changes in AML text reflect on the canvas, and vice versa.
- [ ] **Compiler**: Convert AML to PlantUML, Mermaid, or SVG.

---
*Refer to [AML_SPEC.md](./AML_SPEC.md) for the full technical specification.*
