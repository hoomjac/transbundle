import { transformSync } from '@babel/core';
import { rollup, RollupOptions } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import virtual from '@rollup/plugin-virtual';
import { terser } from 'rollup-plugin-terser';

export const transbundle = compose(bundle, transform);

function transform(scriptText: string) {
  const transformed = transformSync(scriptText, {
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          useBuiltIns: 'usage',
          corejs: { version: '3.22.5', proposals: true },
          targets: {
            chrome: 49,
          },
        },
      ],
    ],
  });

  return transformed?.code ? transformed?.code : '';
}

async function bundle(scriptText: string) {
  const inputOptions: RollupOptions = {
    input: 'script',
    plugins: [
      commonjs(),
      nodeResolve(),
      virtual({
        script: scriptText,
      }),
      terser(),
    ],
  };

  const bundle = await rollup(inputOptions);
  const result = await bundle.generate({
    format: 'iife',
  });

  return result.output[0].code ? result.output[0].code : '';
}

function compose(...fns: ((...args: any[]) => any)[]) {
  const last = fns.pop();
  if (last == null || typeof last !== 'function') return () => {};

  return function composed(...args: any[]) {
    return fns.reduceRight(async (acc, fn) => {
      return await fn(acc);
    }, last.apply(null, args));
  };
}
