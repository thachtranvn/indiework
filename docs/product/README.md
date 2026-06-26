# Product docs

How IndieWork's product documentation is organized. This covers *what* the product is and
*in what order* it's built; for *how the code is structured* (layers, surfaces, data seams)
see [../technical/README.md](../technical/README.md).

- `scope.md` : product-wide functional spec (source of truth for *what* the product is).
- `roadmap.md` : cross-feature build sequencing (*in what order*).
- `features/` : **functional requirements**, one bundle per feature.
- `non-functional/` : **non-functional requirements** that cut across features
  (perceived performance, security, accessibility, ...).

## The bundle convention

Every feature *and* every non-functional requirement is a **bundle** folder. Same shape for
both; the only difference is functional bundles live under `features/`, non-functional ones
under `non-functional/`. A bundle contains:

| File | Role |
|------|------|
| `spec.md` | The requirement specification (the bar / source of truth). Stable. |
| `plan.md` | Implementation plan + checklist + status (living; unmet items stay unchecked todos). |
| `testing.md` | How the requirement is verified. |
| `ui.md` | UI notes, when the item has a UI surface. |

A bundle starts with just `spec.md` and grows the other files as work begins. `spec.md` is the
source of truth; `plan.md` is where solutions are tracked against it.
