# multi-progress-bars
A node library for displaying multiple progress bars, with an option for displaying indefinite tasks by using a spinner. Works well with gulp.js and/or webpack.

## Install
`npm install multi-progress-bars`
or
`yarn add multi-progress-bars`

## Usage
Each bar is represented internally by a `Task`. First instantiate `MultiProgressBars`:
```
import { MultiProgressBars } from 'multi-progress-bars';

const mpb = new MultiProgressBars();
```

Then you can add bars by adding tasks:
```
const Task1 = 'Task 1'
mpb.addTask(Task1, { type: 'percentage', index: 0 });
```

Spice up the bars by passing in a string transform function:
```
import * as chalk from 'chalk'; // or colors.js

const ColorBarTask = 'Task Color'
mpb.addTask(Task Color, { type: 'percentage', index: 1, barColorFn: chalk.green });
```

Create an indefinite spinner by:
```
const Task2 = 'Task 2'
mpb.addTask(Task2, { type: 'indefinite', index: 2 });
```

Update the bars with either incrementTask or updateTask:
```
mpb.updateTask(Task1, { percentage: 0.3 });
// or
mpb.incrementTask(Task1);
```

When task is done call done(). A percentage of 1(00%) does not imply done:
```
mpb.done(Task1);
```

multi-progress-bars exposes a Promise that will be resolved when all tasks are done:
```
await mpb.promise;
// Do stuff here when all tasks finish
// Promise will be reset when tasks are restarted or new tasks are added
```

Check out the example directory for a working example.

## API

### `new MultiProgressBar(options)`

options object (all optional):
 * `stream` `<TTY.WriteStream>` Can be `process.stdout` or `process.stderr`. default = `process.stdout`
 * `spinnerFPS` `<number>` The FPS to update the spinner. default = `10`
 * `numCrawlers` `<number>` The number of crawlers for the infinite spinner. Omit if providing on spinner generator fn. default = `4`
 * `progressWidth` `<number>` The width of the progress bars. default = `40`
 * `spinnerGenerator` `<(t: number, width: number) => string>` A function that takes the current timestamp and total width and returns a string. default = `mpb.hilbertSpinner`
 * `initMessage` `<string>` A persistent message to display above the bars. default = `'$ ' + process.argv.map((arg) => { return path.parse(arg).name; }).join(' ');`

