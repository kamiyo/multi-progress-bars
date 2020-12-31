# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.7](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.6...v2.0.7) (2020-12-31)


### Bug Fixes

* **deps:** updated dependencies ([2039e48](https://github.com/kamiyo/multi-progress-bars/commit/2039e485d2a1a12fc3d899eeeeadad36a4c21195))

### [2.0.6](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.5...v2.0.6) (2020-12-31)


### Bug Fixes

* **core:** multi line logs were getting truncated because of faulty logic. Added some comments as well. ([7758974](https://github.com/kamiyo/multi-progress-bars/commit/77589749da18ef454fe435f090a49ba0c4dae752))
* **example:** Updated example to test for multiline and long console messages. ([a7b373f](https://github.com/kamiyo/multi-progress-bars/commit/a7b373f1f6806328d362919e26f1b1a6b58e458e))

### [2.0.5](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.4...v2.0.5) (2020-11-05)


### Bug Fixes

* **dep:** Updated dependencies ([3cdd05f](https://github.com/kamiyo/multi-progress-bars/commit/3cdd05f382ff3e7fd316558b17ba13fbca2f46c6))

### [2.0.4](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.3...v2.0.4) (2020-11-05)


### Bug Fixes

* **bug:** in some cases, after SIGINT, this.stream becomes undefined, so use null-chaining for stream writes. ([4035f52](https://github.com/kamiyo/multi-progress-bars/commit/4035f52bed9282450ee680d344e3bcbf51d377b9))

### [2.0.3](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.2...v2.0.3) (2020-09-25)


### Bug Fixes

* **bug:** Attach warn() and error() methods to the VirtualConsole. ([5f2c66c](https://github.com/kamiyo/multi-progress-bars/commit/5f2c66c0e045a22b94a721ea31cade6ab8b02a96))

### [2.0.2](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.1...v2.0.2) (2020-08-30)


### Bug Fixes

* **readme:** Updated readme. ([1813d01](https://github.com/kamiyo/multi-progress-bars/commit/1813d0149dd4ca142c3672baa193f5b3626a2602))

### [2.0.1](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.0...v2.0.1) (2020-08-30)


### Bug Fixes

* update demo gif ([81343fe](https://github.com/kamiyo/multi-progress-bars/commit/81343febc0b3c366584b6c0bacab1439814cbcf9))

## [2.0.0](https://github.com/kamiyo/multi-progress-bars/compare/v1.1.4...v2.0.0) (2020-08-30)


### ⚠ BREAKING CHANGES

* **behavior:** Overrides console so that console.logs can be preserved for scrollback. This requires a virtual-console class that manages fixed and dynamic rows. API technically hasn't changed, but marked as breaking since behavior is changed.

### Features

* **behavior:** Overrides console so that console.logs can be preserved for scrollback. This requires a virtual-console class that manages fixed and dynamic rows. API technically hasn't changed, but marked as breaking since behavior is changed. ([e045917](https://github.com/kamiyo/multi-progress-bars/commit/e0459174995cb17d8e0bb21d4ee09da53a089d00))

### [1.1.4](https://github.com/kamiyo/multi-progress-bars/compare/v1.1.3...v1.1.4) (2020-07-29)

### [1.1.3](https://github.com/kamiyo/multi-progress-bars/compare/v1.1.2...v1.1.3) (2020-07-26)


### Bug Fixes

* **readme:** Added language for markdown highlighting ([a35041a](https://github.com/kamiyo/multi-progress-bars/commit/a35041a909d3c07d6dadc2db21876d34d5c794a1))

### [1.1.2](https://github.com/kamiyo/multi-progress-bars/compare/v1.1.1...v1.1.2) (2020-07-26)


### Bug Fixes

* **readme:** Added some <> on the types under API entries. ([dae0174](https://github.com/kamiyo/multi-progress-bars/commit/dae0174123b9e0974a70713c0c73f64e8ff78da6))

### [1.1.1](https://github.com/kamiyo/multi-progress-bars/compare/v1.1.0...v1.1.1) (2020-07-26)


### Bug Fixes

* **readme:** Added badge and made a non-flux'd screencap ([a087dac](https://github.com/kamiyo/multi-progress-bars/commit/a087dacbf99cc03dc8e93560fdd56937f96819b7))

## 1.1.0 (2020-07-26)


### Features

* **workflow:** Using standard-version for version control. Updated package.json accordingly. ([999b55e](https://github.com/kamiyo/multi-progress-bars/commit/999b55e67ff7dcfff4a08cbaebd1dffb81c76861))
