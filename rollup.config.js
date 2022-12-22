import typescript from 'rollup-plugin-ts';
import pkg from './package.json';
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
    //   ...Object.keys(pkg.dependencies || {}),
      'chalk',
      'string-width',
      'strip-ansi',
      'path',
      'util',
    ],
    plugins: [
        typescript({
            typescript: require('typescript'),
            tsconfig: './src/tsconfig.json'
            // useTsconfigDeclarationDir: true,
        }),
    ],
}