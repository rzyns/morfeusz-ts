## [0.2.0](https://github.com/rzyns/morfeusz-ts/compare/v0.1.1...v0.2.0) (2025-11-30)


### Features

* **ci:** conventional commits, husky, semantic-release ([ea39f19](https://github.com/rzyns/morfeusz-ts/commit/ea39f19f2d5c7c0e8fb5da6b201ca2c94e833566))


### Bug Fixes

* **ci:** fix github actions ([140ca01](https://github.com/rzyns/morfeusz-ts/commit/140ca0118d91a9da408912c8c0197cca06317aed))
* **ci:** run semantic-release after ci ([fadb8ea](https://github.com/rzyns/morfeusz-ts/commit/fadb8ea651005546dad3baeaa7546e10528ed972))
* **ci:** stuff ([ec0da62](https://github.com/rzyns/morfeusz-ts/commit/ec0da626b5f77118b4a34e23d80bac25fd7ada1c))

# Changelog

All notable changes to this project will be documented in this file.

This file is generated in part by the release workflow using Conventional Changelog tooling. Only the most recent release section may be regenerated; earlier sections should not be manually edited except to fix formatting.

## [0.1.1] - 2025-11-29
### Added
- Initial automated release workflow (matrix build, artifacts)
- Publish workflow with pre-publish tests
- Dictionary setup and caching across workflows

### Changed
- Scoped package name to `@rzyns/morfeusz-ts`
- Cross-platform script execution via `tsx`

### Fixed
- Windows path handling for dictionary setup and checks
- PowerShell dictionary setup in release workflow

### Documentation
- Updated README with CI/Publish/Release badges and instructions
- Updated CONTRIBUTING with automated release process

## [0.1.0] - 2025-11-29
### Added
- Initial TypeScript bindings and native addon
- Basic CI build & test

### Notes
This was the initial public version before automation enhancements.

---
Future releases will append new sections above. Generated snippets for the current release may override the top section.
