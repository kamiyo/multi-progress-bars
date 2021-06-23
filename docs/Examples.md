# Examples
## [< Back to Table of Contents](../README.md#documentation)

---
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
        border: true,
        index: 0,
        barTransformFn: chalk.blue,
        nameTrasnformFn: chalk.bold,
    });

    let counter = 0;

    // Create a new transform for gulp.pipe()
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
<br>

Pair that with a `watch`.
You can also add mpb to your Webpack config by passing in the mpb instance to a function that returns the config:

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
```
```
// gulpfile.js
const webpack = require('webpack');
const { MultiProgressBars } = require('multi-progress-bars');

const mpb = new MultiProgressBars({ persist: true });
const webpackConfig = require('./webpack.dev.config.js');

const webpackWatch = (done) => {
    mpb.addTask('Webpack', {
        type: 'percentage',
        index: 0,
    });
    const compiler = webpack(webpackConfig(mpb));

    // Create a hook to reset the task to 0%.
    compiler.hooks.beforeRun.tapAsync('Reset Progress', (p) => {
        mpb.updateTask('Webpack', {
            percentage: 0,
        });
    });

    compiler.watch({ ignore: /node_modules/ }, (err, stats) => {
        mpb.done('Webpack');

        // Log the stats after mpb.promise resolves
        mpb.promise.then(() => {
            console.log(stats.toString());
        });
    });

    done();
};

exports.watch = webpackWatch;
```

## N.B. Above code not 100% tested.
---
## [< Back to Table of Contents](../README.md#documentation)
