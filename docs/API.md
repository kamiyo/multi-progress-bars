# API

## [< Back to Table of Contents](../README.md#documentation)
---
<br>

Note: `percentage` is represented as the decimal form, i.e. 0.23 = 23%
<br>
<br>
## `new MultiProgressBar(options)`
<br>

>Instantiates new MultiProgressBar class. Use the returned instance to add and manipulate tasks.

`options` (all optional):
| Key | Type | Required | Default | Comments |
|---|---|---|---|---|
|stream|`TTY.WriteStream`|N|`process.stdout`||
|anchor|`'top' \| 'bottom'`|N|`'top'`|Position of the progress bars.|
|spinnerFPS|`number`|N|`10`|FPS to update the spinner. Limits to 60|
|progressWidth|`number`|N|`40`|Width of the progress bars|
|numCrawlers|`number`|N|`4`|Number of crawlers for the indefinite spinner. If providing a custom spinner generator function, this will be ignored.|
|spinnerGenerator|`(t: number, width: number) => string`|N|`mpb.hilbertSpinner`|A function that takes the current timestamp and total width and returns a string.|
|initMessage|`string`|N|`'$ ' + process.argv.map((arg) => { return path.parse(arg).name; }).join(' ');`|Message to display in the header. It will only take the first line of a multi-line message, and clamp it to terminal width. You may override this with `header` option.
|border|`boolean \| string`|N|`false`|If set to true, will use `U+2500` as the character. If set to false, will not show border. If set to string, will use said string to form borders.|
|header|`Border \| string \| boolean`|N|`undefined`|Set the header. Pass a `Border` object, or a string, which will be displayed as input, or `true` for default `U+2500` border.|
|footer|`Border \| string \| boolean`|N|`undefined`|Set the footer. Pass a `Border` object, or a string, which will be displayed as input, or `true` for default `U+2500` border.|
|persist|`boolean`|N|`false`|When `true`, `mpb` will continue to intercept console functions even when all the tasks are completed; you must call `mpb.close()` to get back the original console (or else you might get wonky prompt placement afterwards). If `false`, once all tasks have completed, `mpb` will automatically restore the original console. However, if you restart a task, it will re-intercept. Use `true` if doing something like a webpack watch.|

<span name="border">`Border` object:</span>
| Key | Type | Required | Default | Comments |
|---|---|---|---|---|
|message|`string`|N|`undefined`|The message to print at the position specified below.|
|pattern|`string`|N|`\u2500`|The supplied string will be repeated until the line is filled.|
|left|`number`|N|`4`|The position from the left on the border to put the message.|
|right|`number`|N|`undefined`|The position from the right on the border to put the message. Preempts `left` if present.|

---
<br>
<br>

## `mpb.addTask(name: string, options): void`
<br>

>Not only does this method add a new Task, but if you pass in a name that already exists, it will restart the Task (sets the `percentage` back to `0` and `done` to be `false`). This makes coding reporter logic easier, instead of having to check if the task is done; you can just always call `addTask('Task Name')` at the start of, say, a `watch` function.


`name`:  Task name. All subsequent actions on the task must be called with this same name.

`options` object:
| Key | Type | Required | Default | Comments |
|---|---|---|---|---|
|type|`'percentage' \| 'indefinite'`|Y|||
|index|`number`|N|increments from previous \|\| 0
|percentage|`number`|N|`0`|The starting percentage if the type is `'percentage'`
|message|`string`|N|`''`|Message to print to the right of the bar.
|barTransformFn|`(s: string) => string`|N|`(s) => s`|A function that transforms the bar. Useful for coloring the bar with `chalk.js` or `colors.js`.
|nameTransformFn|`(s: string) => string`|N|`(s) => s`|A function that transforms the task name to display.|

---
<br>
<br>

## `mpb.incrementTask(name: string, options): void`

<br>

> Increments the task from its current percentage. Incrementing a task to above 1 will automatically call `done()` on it.

`name`: Task name.

`options` object:
| Key | Type | Required | Default | Comments |
|---|---|---|---|---|
|percentage|`number`|N|`0.01`|The percentage to increment by.
|message|`string`|N||Message to print to the right of the bar.
|barTransformFn|`(s: string) => string`|N||A function that transforms the bar. Useful for coloring the bar with `chalk.js` or `colors.js`.
|nameTransformFn|`(s: string) => string`|N||A function that transforms the task name to display.|

---

<br><br>

## `mpb.updateTask(name: string, options): void`
<br>

>Updates the task with the supplied options. Calling updateTask with a percentage over 1(00%) will automatically set it to done. Calling updateTask on an task with `done: true` will restart it.

`name`: Task name.

`options` object:
| Key | Type | Required | Default | Comments |
|---|---|---|---|---|
|percentage|`number`|N||The percentage to change the task to. Ignored if task's type is `'indefinite'`.
|message|`string`|N||Message to print to the right of the bar.
|barTransformFn|`(s: string) => string`|N||A function that transforms the bar. Useful for coloring the bar with `chalk.js` or `colors.js`.
|nameTransformFn|`(s: string) => string`|N||A function that transforms the task name to display.|

---
<br><br>

## `mpb.getIndex(name: string): number`
<br>

>Returns the index of the task given the task name, or `undefined` if not found.

`name`: Task name.

---
<br>
<br>

## `mpb.getName(index: number): string`
<br>

>Returns the name of the task given the index, or `undefined` if not found.

`index`: Task index.

---
<br>
<br>

## `mpb.done(name: string, options): void`
<br>

>Sets the `done` property of the task to `true`, which changes the rendering of the task by displaying a completed progress bar and `100%` for the percentage. If all tasks are done, then it will trigger different behaviors depending on if `persist` is true or false when `mpb` was constructed.

`name`: Task name.

`options` object:
| Key | Type | Required | Default | Comments |
|---|---|---|---|---|
|message|`string`|N|`chalk.green('Finished')`|Message to print to the right of the bar.
|barTransformFn|`(s: string) => string`|N||A function that transforms the bar. Useful for coloring the bar with `chalk.js` or `colors.js`.
|nameTransformFn|`(s: string) => string`|N||A function that transforms the task name to display.|

---
<br>
<br>

## `mpb.restartTask(name: string, options): void`
<br>

>Restart the task.

`name`: Task name.

`options` object:
| Key | Type | Required | Default | Comments |
|---|---|---|---|---|
|percentage|`number`|N||The percentage to start the task with. Ignored if task's type is `'indefinite'`.
|message|`string`|N||Message to print to the right of the bar.
|barTransformFn|`(s: string) => string`|N||A function that transforms the bar. Useful for coloring the bar with `chalk.js` or `colors.js`.
|nameTransformFn|`(s: string) => string`|N||A function that transforms the task name to display.|

---
<br>
<br>

## `mpb.close(): void`
<br>

>Stop all spinners, resolve the outstanding promise, and detach `console.log` interception. This will restore the original console to `console`, and move the cursor to expected position for the next console prompt. If you restart any task after mpb has closed, it will automatically re-intercept `console` again.

<br>

---
<br>
<br>

## `mpb.setHeader(options: Border | string | boolean): void`
## `mpb.setFooter(options: Border | string | boolean): void`
<br>

[Border object spec](#border)

>Allows you to set the header and footer. You can supply an options object, a string, or a boolean as arguments. If you supply a `string`, it will put that string as the border, repeating for the terminal width. If you supply `true`, it will render the default border. If you supply `false`, it removes the border (equivalently, you can call `removeHeader`/`removeFooter`). If you supply the `Border` object, it will set any options, and render the header/footer. If options were set previously, they are retained until overwritten. This includes the default setting `pattern: '\u2500'` for both header and footer, and `left: 4` for header. Thus, you can repeatedly call `setFooter({ message: 'Total Progress n/N' })` to have a pinned status bar.

<br>

---
<br>
<br>

## `mpb.removeHeader(): void`
## `mpb.removeFooter(): void`
<br>

>Remove the header or the footer. To keep the header or footer space but not render anything, call `setHeader(' ')`/`setFooter(' ')`.

<br>

---
<br>
<br>

## `mpb.promise: Promise<void>`
<br>

> A promise that will be resolved when all tasks are `done`. This allows you to defer rendering of any console output until afterwards, which prevents write race conditions that mess up the bar rendering. The promise will be reset if any tasks are restarted.

<br>

---
## [< Back to Table of Contents](../README.md#documentation)
