import { CaseHandling } from "../../core/types.js";

export class CaseConverter {
  toLower(s: string): string { return s.toLocaleLowerCase("pl-PL"); }
  toUpper(s: string): string { return s.toLocaleUpperCase("pl-PL"); }
  equals(a: string, b: string, handling: CaseHandling): boolean {
    switch (handling) {
      case CaseHandling.IGNORE_CASE:
        return this.toLower(a) === this.toLower(b);
      case CaseHandling.STRICTLY_CASE_SENSITIVE:
        return a === b;
      case CaseHandling.CONDITIONALLY_CASE_SENSITIVE:
      default:
        // Placeholder: treat as case-insensitive match preference
        return this.toLower(a) === this.toLower(b) || a === b;
    }
  }
}
