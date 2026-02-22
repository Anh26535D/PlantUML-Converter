# 📄 Aetheris Modeling Language (AML) Specification v1.0

AML is a plain-text domain-specific language designed for high-fidelity architectural modeling. It prioritizes human readability, ease of parsing, and decoupling structure from visual representation.

## 1. Core Structure

### 1.1 Namespaces (Packages)
Namespaces group related components. They can be nested.
```aml
namespace com.aetheris.core {
    // components go here
}
```

### 1.2 Component Types
AML supports four primary component types: `class`, `interface`, `enum`, and `annotation`.

```aml
[abstract] class User {
    id: UUID [-]
    email: String [+]
    
    login(password: String): boolean [+]
}

interface IRepository {
    save(entity: Any): void
}

enum Role {
    ADMIN, USER, GUEST
}
```

### 1.3 Members
Members are defined inside component blocks.
- **Fields**: `name: type [visibility] [static]`
- **Methods**: `name(params): returnType [visibility] [static]`
- **Visibility Tokens**: `[+]` (public), `[-]` (private), `[#]` (protected), `[~]` (package).

## 2. Relationships

Relationships are defined outside component blocks to maintain clarity.

| Syntax | Relationship Type | arrow |
| :--- | :--- | :--- |
| `A --|> B` | Inheritance (Extends) | Solid arrow, hollow head |
| `A ..|> B` | Realization (Implements) | Dashed arrow, hollow head |
| `A -> B` | Association | Solid line |
| `A o-- B` | Aggregation | Solid line, hollow diamond |
| `A *-- B` | Composition | Solid line, filled diamond |
| `A ..> B` | Dependency | Dashed line |

### 2.1 Metadata Attributes
Relationships can have optional attributes:
```aml
Order *-- Product [label: "contains", multiplicity: "1..*"]
```

## 3. Comments
Use `//` for single-line comments and `/* */` for multi-line comments.

## 4. Full Example
```aml
namespace app.domain {
    class Account {
        balance: Decimal [-]
        deposit(amount: Decimal): void [+]
    }
    
    interface IOwnable {
        getOwner(): User
    }
}

app.domain.Account --|> app.domain.BaseEntity
app.domain.Account ..|> app.domain.IOwnable
```
