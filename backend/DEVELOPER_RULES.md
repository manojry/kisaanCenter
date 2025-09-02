# KisaanCenter Backend Developer Rules

## Folder Structure
```
backend/
  src/
    models/
      enums.py        # All business enums (single source of truth)
      models.py       # SQLAlchemy models
      ...
    ...
```

## Enum Management Rules
1. **Single Source of Truth:**
   - All enums must be defined in `models/enums.py`. Never create or use duplicate enum files.

2. **File Creation:**
   - Always check if a file exists before creating a new one. Update or extend existing files as needed.

3. **Imports:**
   - Always import enums from `src.models.enums`.

4. **Refactoring:**
   - If you find enums elsewhere, move their contents to `models/enums.py` and delete the duplicate.

5. **Feature Folders:**
   - Use feature folders only for domain-specific API routes, validators, or business logic—not for shared models/enums.

## General File Management
- Before creating any file, always check the target folder for an existing file.
- Centralize shared logic (models, services, enums) in main folders.
- Keep feature folders clean and focused on their domain.
- Document any major changes in this file for team reference.

---

**Always refer to this file before creating or changing any backend file.**
