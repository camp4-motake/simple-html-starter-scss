const conf = { minify: true };
const inProduction = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: {
    'postcss-sort-media-queries': {},
    'postcss-preset-env': {
      stage: 2,
      autoprefixer: { grid: 'autoplace' },
      features: { 'custom-properties': false },
      // importFrom: 'src/styles/custom-media.css',
    },
    ...(inProduction && conf.minify
      ? { cssnano: { preset: 'default' } }
      : null),
  },
};
