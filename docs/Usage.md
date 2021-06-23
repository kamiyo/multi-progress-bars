
# Usage

## [< Back to Table of Contents](../README.md#documentation)

---
## Creating tasks
Each bar is represented internally by a `Task`. First instantiate `MultiProgressBars` with options like `anchor` and `border`:
```node
import { MultiProgressBars } from 'multi-progress-bars';

const mpb = new MultiProgressBars(/* options object */);
```

Then you can add bars by adding tasks by name; I like to assign them to a const variable and use that:
```node
const Task1 = 'Task 1'
mpb.addTask(Task1, { type: 'percentage' });
```

If you want it placed a specific index from the top, pass an index, otherwise it auto-increments:
```node
mpb.addTask('Third Row', { type: 'percentage', index: 2 });
```

Spice up the bars and names by passing in a string transform function.:
```node
import chalk from 'chalk'; // or colors.js

const ColorBarTask = 'Task Color'
mpb.addTask(Task Color, { type: 'percentage', barTransformFn: chalk.green, nameTransformFn: chalk.bold });
```

Create an indefinite spinner by:
```node
const Task2 = 'Task 2'
mpb.addTask(Task2, { type: 'indefinite' });
```
---
## Modifying Tasks

Update the bars with either incrementTask or updateTask. updateTask sets the percentage; incrementTask adds the specified percentage to the current progress:
```node
mpb.updateTask(Task1, { percentage: 0.3 }); // Sets to 0.3
// or
mpb.incrementTask(Task1, { percentage: 0.3 }); // Sets to current + 0.3
```

When task is done call done(). A percentage of 1(00%) does not imply done, but going over 1 does set done:
```node
mpb.done(Task1, { message: 'Finished!' });
```

Restart a task with restartTask():
```node
mpb.restartTask(Task1, { message: 'Restarted!" });
```

If you want to remove a task, call removeTask():
```node
mpb.removeTask(Task2);
```
---
## Borders

You can set/modify borders with setHeader() and setFooter(), and even specify messages and placement. See [api](docs/API.md#borders) for full options. Pattern will repeat:
```node
mpb.setHeader({
    pattern: '.*',
    message: 'mpb',
    left: 8,
});
mpb.setFooter('-');
```
Remove with `removeHeader()` and `removeFooter()`.

---
## Utilities

If you made mpb instance with `persist: true`, then you'll need to run `close()` when you are done.

multi-progress-bars exposes a Promise that will be resolved when all tasks are done (or you called `close()`):
```node
await mpb.promise;
// Do stuff here when all tasks finish
// Promise will be reset when tasks are restarted or new tasks are added
```

Get task name given index, and vice-versa:
```node
const idx = getIndex(Task1);
const name = getName(idx);
// name === Task1
```

Query the doneness:
```node
const doneness = mpb.isDone(Task1);
```

Check out the example directory for a working example.

---

## [< Back to Table of Contents](../README.md#documentation)