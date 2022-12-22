

import typescript from 'rollup-plugin-ts';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
        },
        {
            file: pkg.module,
            format: 'es',
        },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      'path',
      'util',
    ],
    plugins: [
        typescript({
            typescript: require('typescript'),
            tsconfig: './src/tsconfig.json'
        }),
    ],
}