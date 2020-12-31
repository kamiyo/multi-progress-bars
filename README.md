# multi-progress-bars
![npm shield](https://img.shields.io/npm/v/multi-progress-bars)

> :warning: v3 technically has **breaking changes** in behavior nuance, but should be backwards-compatible. The changes are the addition of anchor position, border, and persist. If you pass in `true` for persist, you should call `mpb.close()` when you are done, or on `SIGINT` for example. Multi-line init messages are now clamped to the first line.

A node library for displaying multiple progress bars, with an option for displaying indefinite tasks by using a spinner. Works well with gulp.js and/or webpack. This library has two display options: top and bottom anchor.

Anchoring the progress bars to the top will clear the screen non-destructively, and display the bars from the top; any subsequent calls to `console.log` will not affect the fixed progress rows, but overflow will push previous console messages above the fold. This is enabled by a simple virtual console. This way no console messages will be lost. See the below demo .gif.

![MultiProgressBar top demo](./assets/mpb_top.gif)

Anchoring to the bottom is a bit simpler, but is just as useful.

![MultiProgressBar bottom demo](./assets/mpb_bottom.gif)


## Install
`npm install multi-progress-bars`
or
`yarn add multi-progress-bars`

## Usage
Each bar is represented internally by a `Task`. First instantiate `MultiProgressBars` with options like `anchor` and `border`:
```node
import { MultiProgressBars } from 'multi-progress-bars';

const mpb = new MultiProgressBars(/* options object */);
```

Then you can add bars by adding tasks:
```node
const Task1 = 'Task 1'
mpb.addTask(Task1, { type: 'percentage', index: 0 });
```

Spice up the bars by passing in a string transform function:
```node
import * as chalk from 'chalk'; // or colors.js

const ColorBarTask = 'Task Color'
mpb.addTask(Task Color, { type: 'percentage', index: 1, barColorFn: chalk.green });
```

Create an indefinite spinner by:
```node
const Task2 = 'Task 2'
mpb.addTask(Task2, { type: 'indefinite', index: 2 });
```

Update the bars with either incrementTask or updateTask:
```node
mpb.updateTask(Task1, { percentage: 0.3 });
// or
mpb.incrementTask(Task1);
```

When task is done call done(). A percentage of 1(00%) does not imply done:
```node
mpb.done(Task1);
```

multi-progress-bars exposes a Promise that will be resolved when all tasks are done:
```node
await mpb.promise;
// Do stuff here when all tasks finish
// Promise will be reset when tasks are restarted or new tasks are added
```

Check out the example directory for a working example.

## API

Note: `percentage` is represented as the decimal form, i.e. 0.23 = 23%

### `new MultiProgressBar(options)`

`options` `<object>` (all optional):
 * `stream` `<TTY.WriteStream>` Can be `process.stdout` or `process.stderr`. default = `process.stdout`
 * `spinnerFPS` `<number>` The FPS to update the spinner. default = `10`
 * `progressWidth` `<number>` The width of the progress bars. This will be incremented if odd (it's just easier to deal with even width). default = `40`
 * `numCrawlers` `<number>` The number of crawlers for the infinite spinner. Omit if providing on spinner generator fn. This will be decremented until it is a factor of progressWidth. default = `4`
 * `spinnerGenerator` `<(t: number, width: number) => string>` A function that takes the current timestamp and total width and returns a string. default = `mpb.hilbertSpinner`
 * `initMessage` `<string>` A persistent message to display above the bars. If it is multi-line or longer than the console width, it will take the first line and/or clamp it. default = `'$ ' + process.argv.map((arg) => { return path.parse(arg).name; }).join(' ');`
 * `anchor` `<'top' | 'bottom'>` The position of the progress bars. default (to match with previous behavior) = `'top'`
 * `border` `<boolean | string>` If set to true, will use U+2500 as the character. If set to false, will not show border. If set to string, will use said string to form borders. Bottom-anchored progress section will only have a top border. Top-anchored section will have both top and bottom borders. default = `false`
 * `persist` `<boolean>` When true, mpb will continue to intercept console functions even when all the tasks are completed; you must call `mpb.close()` to get back the original console (or else you might get wonky prompt placement afterwards). If false, once all tasks have completed, mpb will automatically restore the original console. However, if you restart a task, it will re-intercept. Use true if doing something like a webpack watch. default = `false`

### `mpb.addTask(name, options)`

`name` `<string>` Task name. All subsequent actions on the task will be called with this same name.

`options` `<object>`:
 * `type` `<'percentage' | 'indefinite'>` required.
 * `index` `<number>` required. default = increment from previous || 0.
 * `percentage` `<number>` optional. The starting percentage (0 to 1). default = `0`
 * `message` `<string>` optional. A message to print to the right of the bar. default = `''`
 * `barColorFn` `<(s: string) => string>` optional. A function that transforms the bar. Useful for coloring the bar with `chalk.js` or `colors.js`. default = `(s) => s`;

Not only does this method add a new Task, but if you pass in a name that already exists, it will restart the Task (sets the `percentage` back to `0` and `done` to be `false`). This makes coding reporter logic easier, instead of having to check if the task is done; you can just always call `addTask('Task Name')` at the start of, say, a `watch` function.

### `mpb.incrementTask(name, options)`

`name` `<string>` Task name.

`options` `<object>` (unset properties will not affect change unless a default exists):
 * `message` `<string>` optional. A message to print to the right of the bar.
 * `percentage` `<number>` optional. The amount to increment by. default = `0.01`
 * `barColorFn` `<(s: string) => string>` optional. A function that transforms the bar.

 Incrementing a task to above 1(00%) will automatically call `done` on it.

### `mpb.updateTask(name, options)`

`name` `<string>` Task name.

`options` `<object>` (unset properties will not affect change):
 * `message` `<string>` optional. A message to print to the right of the bar.
 * `percentage` `<number>` optional. The amount to change the percentage to.
 * `barColorFn` `<(s: string) => string>` optional. A function that transforms the bar.

 Calling updateTask with a percentage over 1(00%) will automatically set it to done. Calling updateTask on an task with `done: true` will restart it

## `mpb.done(name, options)`

`name` `<string>` Task name.

`options` `<object>` (unset properties will not affect change):
 * `message` `<string>` optional. A message to print to the right of the bar. default = `chalk.green('Finished')`
 * `barColorFn` `<(s: string) => string>` optional. A function that transforms the bar.

### `mpb.restart(name, options)`

`name` `<string>` Task name.

`options` `<object>` (unset properties will not affect change):
 * `message` `<string>` optional. A message to print to the right of the bar.
 * `barColorFn` `<(s: string) => string>` optional. A function that transforms the bar.

### `mpb.close()`

This will restore the original console to `console`, and move the cursor to expected position for the next console prompt. If you restart tasks after mpb has closed, it will re-intercept console again.

### `mpb.promise`

`<Promise>` A promise that will be resolved when all tasks are `done`. This allows you to defer rendering of reporters until after, which prevents write race conditions that mess up the bar rendering. The promise will be reset if any tasks are restarted.

## Hilbert Spinner

Included in this library is a cool Hilbert Curve / Space-Filling Curve spinner. It uses the Braille dots to do a little snake that crawls throughout the bar. There is probably a more efficient way to code the crawling, as this uses sort of an 'implicit' approach, instead of an 'explicit', which might require less calculation.

## Using with Gulp and Webpack

You can print status for, say, a typescript compilation like this (this is in javascript, not typescript):

```node
const glob = require('glob');
const { Transform } = require('stream');
const ts = require('gulp-typescript');
const { MultiProgressBars } = require('multi-progress-bars');
const chalk = require('chalk');

const mpb = new MultiProgressBars();
const tsProject = ts.createProject('./tsconfig.json');

const compileTS = () => {
    const count = glob.sync('src/**/*.ts').length;
    mpb.addTask('Compile Typescript', {
        type: 'percentage',
        index: 0,
        barColorFn: chalk.blue
    });

    let counter = 0;
    const forEach = new Transform({
        writeableObjectMode: true,
        readableObjectMode: true,
        transform(chunk, _, callback) {
            counter++;
            mpb.updateTask('Compile Typescript', {
                percentage: counter / count,
                message: counter + '/' + count,
            });
            callback(null, chunk);
        }
    });

    mpb.promise.then(() => {
        console.log('All Tasks Finished!');
    });

    return tsProject.src()
        .pipe(forEach)
        .pipe(tsProject(
            ts.reporter.nullReporter()
        ))
        .js
        .pipe(gulp.dest('./build'))
        .on('end', () => {
            mpb.done('Compile Typescript');
        });
}

exports.compileTS = compileTS;

```

Pair that with a `watch`.
You can also add Webpack by passing in the mpb instance to your webpack config

```node
// webpack.dev.config.js

const config = (mpb) => {
    return {
        // ... other config
        plugins: [
            // ... other plugins
            new webpack.ProgressPlugin({
                handler: (percentage, message, ...args) => {
                    const msg = message
                    ? message +
                        ((args.length) ? ': ' + args[0] : '')
                    : '';
                    mpb.updateTask(
                        'Webpack',
                        {
                            percentage,
                            message: msg,
                        }
                    );
                }
            }),
        ],
    };
}

module.exports = config;

// gulpfile.js
const webpack = require('webpack');
const { MultiProgressBars } = require('multi-progress-bars');

const mpb = new MultiProgressBars({ persist: true });
const webpackConfig = require('./webpack.dev.config.js');

const webpackCompile = (done) => {
    mpb.addTask('Webpack', {
        type: 'percentage',
        index: 0,
    });
    webpack(webpackConfig(mpb)).run((err, stats) => {
        mpb.done('Webpack')

        mpb.promise.then(() => {
            console.log(stats.toString());
        });
        done();
    });
};

const watchWebpack = (done) => {
    gulp.watch(
        ['src/**/*'],
        { ignoreInitial: false },
        webpackCompile,
    );
    done();
};

exports.watch = watchWebpack;
```

N.B. Above code not 100% tested.

## TODO
* Decouple hilbertSpinner from the instance.
* Allow custom bar format
* Allow custom progress format
