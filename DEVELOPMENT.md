# Development Rules

This document outlines the coding standards, repository practices, and general guidelines for the PlantUML Converter project.

## 🐍 Coding Standards (Python)

All Python code should follow [PEP 8](https://peps.python.org/pep-0008/) style guidelines.

### Classes
- **Naming**: Use `PascalCase`.
- **Purpose**: Each class should have a single responsibility (SRP).
- **Initialization**: Use `dataclasses` where appropriate for pure data containers to reduce boilerplate.
- **Example**:
  ```python
  class SourceParser:
      """Base class for source code parsers."""
      def __init__(self, language: str):
          self.language = language
  ```

### Functions & Methods
- **Naming**: Use `snake_case`.
- **Typing**: Use Type Hints for all parameters and return values.
- **Modularity**: Keep functions small and focused. If a function exceeds 50 lines, consider refactoring.
- **Example**:
  ```python
  def parse_content(content: str) -> list[ClassModel]:
      """Parses string content and returns a list of ClassModels."""
      results = []
      # implementation
      return results
  ```

### Documentation
- Use triple-quoted docstrings for all public classes and functions.
- Follow the Google Style or reStructuredText format.

---

## 🪵 Git Commit Guidelines

We follow the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

### Format
`<type>(<scope>): <description>`

- **type**:
    - `feat`: A new feature.
    - `fix`: A bug fix.
    - `docs`: Documentation only changes.
    - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
    - `refactor`: A code change that neither fixes a bug nor adds a feature.
    - `perf`: A code change that improves performance.
    - `test`: Adding missing tests or correcting existing tests.
    - `chore`: Changes to the build process or auxiliary tools and libraries.
- **scope**: Optional. Refers to the module affected (e.g., `java`, `kotlin`, `puml`).
- **description**: Use imperative, present tense ("add" not "added", "change" not "changed").

### Example
`feat(kotlin): add support for inner classes`

---

## 🛠️ Workflow

### Dependency Management
Use `uv` for all dependency and environment management.
- Add dependency: `uv add <package>`
- Run script: `uv run <script.py>`

### Branching
- `main`: Production-ready code.
- `feature/<name>`: For new features.
- `bugfix/<name>`: For bug fixes.

## ➕ Adding a New Language
To add support for a new language (e.g., C++):

1.  **Create a Parser**: Create a new file in `converter/` (e.g., `cpp_parser.py`) that inherits from `BaseParser`.
2.  **Implement `parse`**: Extract class hierarchies and members using an appropriate library (like `tree-sitter`).
3.  **Define Extensions**: Implement the `supported_extensions` property (e.g., `[".cpp", ".hpp"]`).
4.  **Register Parser**: Add your new parser to the `ParserFactory` in `converter/factory.py`.

---

## 🧪 Testing
- Always add a sample file in `examples/` when adding support for new language constructs.
- Run the converter on the `examples/` directory to verify output consistency before committing.
