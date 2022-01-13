# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.2.2](https://github.com/kamiyo/multi-progress-bars/compare/v4.2.2-0...v4.2.2) (2022-01-13)

### [4.2.2-0](https://github.com/kamiyo/multi-progress-bars/compare/v4.2.1...v4.2.2-0) (2022-01-09)


### Bug Fixes

* **core:** Maybe fix ESM? ([cfab46e](https://github.com/kamiyo/multi-progress-bars/commit/cfab46e2033da2c64fa25b9c2c47c9336ea61f00))

### [4.2.1](https://github.com/kamiyo/multi-progress-bars/compare/v4.2.0...v4.2.1) (2022-01-09)


### Bug Fixes

* **core:** Fix empty string crashing border ([871633b](https://github.com/kamiyo/multi-progress-bars/commit/871633b265d6efddec0e8428a8f4fc78a36a5d34))
* **core:** Fix newlines and tabs breaking border message. Now splits at those characters and only displays the first item of the returned array. ([1e09301](https://github.com/kamiyo/multi-progress-bars/commit/1e093013483194654731d11c961b69a9f74f73f7))

## [4.2.0](https://github.com/kamiyo/multi-progress-bars/compare/v4.1.0...v4.2.0) (2021-11-09)


### Features

* **docs:** Added missing header/footer API methods. ([9f8f3e2](https://github.com/kamiyo/multi-progress-bars/commit/9f8f3e215ee1af0ee484db135aba459a84bb8c66))

## [4.1.0](https://github.com/kamiyo/multi-progress-bars/compare/v4.0.1...v4.1.0) (2021-11-09)


### Features

* **dev:** Update yarn to v2.4.2 ([f723ace](https://github.com/kamiyo/multi-progress-bars/commit/f723ace00659de995acc150fb57689cda2f0a223))


### Bug Fixes

* **core:** removeBottomBorder had outdated progressHeight calculations ([6b1332f](https://github.com/kamiyo/multi-progress-bars/commit/6b1332fd3c2213ef325498ca7321dcc23de53148))
* **package:** Change esm extension to mjs for automatic module detection ([6107343](https://github.com/kamiyo/multi-progress-bars/commit/61073430682c3f0622b830a4694242f0f11c19c0))

### [4.0.1](https://github.com/kamiyo/multi-progress-bars/compare/v4.0.0...v4.0.1) (2021-06-30)


### Bug Fixes

* **core:** resizing logic ([2b09ba5](https://github.com/kamiyo/multi-progress-bars/commit/2b09ba561e705a00c38542a87c04323628541c88))
* **core:** update typescript and yarn version ([9fc6147](https://github.com/kamiyo/multi-progress-bars/commit/9fc6147596f78776e2fff71cbfe44be6736579a0))
* **core:** upgrade yarn stuff ([79829cf](https://github.com/kamiyo/multi-progress-bars/commit/79829cf8bc0daee5bed1e12450d1af13880066ff))

## [4.0.0](https://github.com/kamiyo/multi-progress-bars/compare/v4.0.0-alpha.0...v4.0.0) (2021-06-23)

### Bug Fixes

* **dep:** Update node requirements ([92d95d5](https://github.com/kamiyo/multi-progress-bars/commit/92d95d5a329b354fdd4965ed6939102b78c22202))
* **dep:** Pin string-width and strip-ansi version to before they moved to es-modules

* **core:** promise resetting was broken
* **core:** bottom-anchored progress bars now has bottom border as well.

### Features

* **core:** barColorFn renamed to barTransformFn
* **core:** added nameTransformFn property
* **core:** added removeTask
* **core:** added extended border options
* **core:** crawler improvements
* **core:** properly handle vertically overflowed progresses
* **core:** dump entire progress buffer on close() or all-complete if there was overflow

* **docs:** Split readme up into docs, and add updated gifs.
* **docs:** Add LICENSE

* **example:** merged top and bottom examples, and added cli options for running them.

### Refactor

* **core:** rewrite virtual-console to allow for overflow and removing.
* **core:** clean-up constructor code.
* **utils:** I dunno why, but template strings for the escape codes.

## [4.0.0-alpha.0](https://github.com/kamiyo/multi-progress-bars/compare/v3.2.4...v4.0.0-alpha.0) (2021-05-18)


### ⚠ BREAKING CHANGES

* **core:** When number of bars overflow console height, only the last N are shown. Upon closing mpb, it will dump the entire progress buffer, so everything will be visible in scrollback.

### Features

* **core:** When number of bars overflow console height, only the last N are shown. Upon closing mpb, it will dump the entire progress buffer, so everything will be visible in scrollback. ([619132a](https://github.com/kamiyo/multi-progress-bars/commit/619132a6e553330b93087ae5d9dd615e7a8d806f))


### Bug Fixes

* **core:** Fix issue [#11](https://github.com/kamiyo/multi-progress-bars/issues/11) ([5cdac93](https://github.com/kamiyo/multi-progress-bars/commit/5cdac935f16be1249ed00c43255acf14693207d7))

### [3.2.4](https://github.com/kamiyo/multi-progress-bars/compare/v3.2.3...v3.2.4) (2021-04-16)


### Bug Fixes

* when stdout is not a TTY, updates to the UI cause scrolling ([2e74297](https://github.com/kamiyo/multi-progress-bars/commit/2e742971c182e9c92872dfab723afd268d04714a)), closes [#7](https://github.com/kamiyo/multi-progress-bars/issues/7)

### [3.2.3](https://github.com/kamiyo/multi-progress-bars/compare/v3.2.2...v3.2.3) (2021-03-14)


### Bug Fixes

* **core:** incorrectly forced percentage to 0 on new addTask. ([aab9414](https://github.com/kamiyo/multi-progress-bars/commit/aab9414885c6424ec3ab3406539f9a0fe5b6f41f))

### [3.2.2](https://github.com/kamiyo/multi-progress-bars/compare/v3.2.1...v3.2.2) (2021-03-08)


### Bug Fixes

* **examples:** main import fix ([8aae7ca](https://github.com/kamiyo/multi-progress-bars/commit/8aae7ca293f3b05635082c1e293036c02a812966))

### [3.2.1](https://github.com/kamiyo/multi-progress-bars/compare/v3.2.0...v3.2.1) (2021-03-08)


### Bug Fixes

* **core:** added process.exit() to cleanup code for correct SIGINT behavior ([2f9809b](https://github.com/kamiyo/multi-progress-bars/commit/2f9809be4e197601f0d5a524383e88902c17b3df))

## [3.2.0](https://github.com/kamiyo/multi-progress-bars/compare/v3.1.2...v3.2.0) (2021-02-28)

### [3.1.2](https://github.com/kamiyo/multi-progress-bars/compare/v3.1.1...v3.1.2) (2020-12-31)


### Bug Fixes

* **core:** fixed wrong order of assignin warn and error to virtual log. ([2c32749](https://github.com/kamiyo/multi-progress-bars/commit/2c32749cc3937764403e1181942e361a18c1906c))

### [3.1.1](https://github.com/kamiyo/multi-progress-bars/compare/v3.1.0...v3.1.1) (2020-12-31)


### Bug Fixes

* **README:** Updated webpack example and detail about percentage in addTask/updateTask. ([ea6183c](https://github.com/kamiyo/multi-progress-bars/commit/ea6183c15e924b963b9ea621ef72859a8b085d8b))

## [3.1.0](https://github.com/kamiyo/multi-progress-bars/compare/v3.0.0...v3.1.0) (2020-12-31)


### Features

* **borders:** Added border functionality. ([c6f49f6](https://github.com/kamiyo/multi-progress-bars/commit/c6f49f610d576e8edee9d28fb28b443d35603c31))


### Bug Fixes

* **README:** Updated README with v3 info. ([f6675fd](https://github.com/kamiyo/multi-progress-bars/commit/f6675fdafc903d628c5ba5546d3eef827338f081))

## [3.0.0](https://github.com/kamiyo/multi-progress-bars/compare/v2.0.7...v3.0.0) (2020-12-31)


### ⚠ BREAKING CHANGES

* Though not technically breaking (defaults behave as previously), added the option for bottom positioning of progress bars. As a result, the logic is easier. Pass 'bottom' to options.anchor in the constructor to switch. There is also now a options.persist setting. If set to false or left blank, the virtual console will reconnect the original console after all tasks are finished. However, if you call updateTask or similar, it will re-intercept console. If persist is true, it will not reconnect original; intended for use with a perpetual watcher.

### Features

* Option for bottom positioning of progress bars. ([d9379c4](https://github.com/kamiyo/multi-progress-bars/commit/d9379c4abbb15309809802027351a5db6dac3528))

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
