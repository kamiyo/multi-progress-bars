import typescript from 'rollup-plugin-typescript2';
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
      ...Object.keys(pkg.dependencies || {}),
      'path',
    ],
    plugins: [
        typescript({
            typescript: require('typescript'),
            tsconfig: './src/tsconfig.json'
            // useTsconfigDeclarationDir: true,
        }),
    ],
}