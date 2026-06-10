# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# Design Reference — getdesign.md

For UI/UX decisions and component styling, follow the methodology from **https://getdesign.md/design-md**.

- Analyze real, shipped websites (examples: Wope, Huly, Superlist, Devin, Letters, etc.).
- Use concrete DESIGN.md files extracted from those real products as the primary design reference.
- Prefer observed patterns, spacing, typography, color usage, component behavior, and interaction details from actual high-quality sites over invented universal rulebooks.
- When starting a new screen or component, pick one or more relevant analyses from getdesign.md and treat their DESIGN.md as the source of truth for that aesthetic and interaction model.

Do **not** apply rigid "Pro Max" checklists or made-up strict constraints (e.g. mandatory 4.5:1 everywhere, 44px touch targets as absolute law, blanket emoji bans, floating navbar mandates, specific glassmorphism recipes, or long pre-delivery checklists). Those are removed.

Instead:
- Copy or reference a real DESIGN.md from getdesign.md when you need a concrete style guide.
- Describe what you see in real products (tokens, layout tendencies, motion, hierarchy) rather than enforcing abstract rules.
- Keep the project's own `docs/DESIGN.md` focused on project-specific direction (color direction, hero/map-first pattern, etc.) without turning it into a compliance gate.
