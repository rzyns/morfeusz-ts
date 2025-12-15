import { CaseHandling } from "../../core/types.js";
import { CaseConverter } from "./CaseConverter.js";

export class CasePatternHelper {
  constructor(private readonly conv: CaseConverter) {}

  // For now, implement a simple check: verify orth matches desired case according to policy.
  checkOrthCaseMatches(orth: string, pattern: string, handling: CaseHandling): boolean {
    switch (handling) {
      case CaseHandling.IGNORE_CASE:
        return this.conv.toLower(orth) === this.conv.toLower(pattern);
      case CaseHandling.STRICTLY_CASE_SENSITIVE:
        return orth === pattern;
      case CaseHandling.CONDITIONALLY_CASE_SENSITIVE:
      default:
        return this.conv.toLower(orth) === this.conv.toLower(pattern);
    }
  }
}
