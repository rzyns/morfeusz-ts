# Morfeusz-TS (Scaffold)

Early scaffolding for a TypeScript port of Morfeusz2.

## Quick Try

```ts
import { MorfeuszImpl, MorfeuszUsage } from "morfeusz-ts";

const m = new MorfeuszImpl("default", MorfeuszUsage.BOTH_ANALYSE_AND_GENERATE);
const it = m.analyse("Ala ma kota\n\t i psa");
while (it.hasNext()) console.log(it.next());

console.log(m.generate("kot"));
```

## Status

- Basic types/enums and minimal `MorfeuszImpl` with whitespace/ign handling.
- No dictionary/FSA/tagset yet. See `docs/PORTING_PLAN.md` for the roadmap.
