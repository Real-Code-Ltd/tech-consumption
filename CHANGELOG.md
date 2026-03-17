# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-03-17

### Changed
- Removed unused MySQL dependency from `package.json` to streamline the project

## [1.0.4] - 2026-03-16

### Fixed
- Explicit permissions added to the GitHub Actions release workflow

## [1.0.3] - 2026-03-16

### Fixed
- Release no longer created as a draft — now published immediately

## [1.0.2] - 2026-03-16

### Fixed
- Resolved missing Npcap SDK in GitHub Actions build

## [1.0.1] - 2026-03-16

### Fixed
- Fixed broken markdown image link in documentation by using a relative path

## [1.0.0] - 2026-03-16

### Added
- Initial release of **Tech Energy Usage** — AI Environmental Tracker
- Desktop widget that tracks active application usage and AI service network calls
- Real-time carbon footprint (gCO₂) and energy usage (Wh) estimation
- Colour-coded environmental impact grading (Green → Red)
- Customisable category multipliers via a local `categories.json` file
- Built with Tauri 2, React 19, TypeScript, and Tailwind CSS
- Windows installer (`.msi`) distributed via GitHub Releases
