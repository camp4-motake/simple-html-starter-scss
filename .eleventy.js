const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const posthtml = require('posthtml');
const posthtmlUrls = require('posthtml-urls');
const { minify } = require('html-minifier-terser');
const prettier = require('prettier');

const INPUT_DIR = 'src/html';
const OUTPUT_DIR = 'dist';
const PATH_PREFIX = '/';

const inProduction = process.env.NODE_ENV === 'production';
const isRelative = false;
const isHtmlMinify = false;

/**
 * 11ty config
 * @see https://www.11ty.dev/docs/config/
 */
module.exports = function (eleventyConfig) {
  // @see https://browsersync.io/docs/options
  eleventyConfig.setBrowserSyncConfig({
    files: [`${OUTPUT_DIR}/**/*.css`, `${OUTPUT_DIR}/**/*.js`],
    injectChanges: true,
    ignore: ['node_modules'],
    notify: false,
    open: false,
    ui: false,
  });

  eleventyConfig.addPassthroughCopy({ 'src/static': '.' });

  if (inProduction) {
    eleventyConfig.ignores.add('**/_*.*');
  }

  eleventyConfig.addFilter('cacheBuster', function (url) {
    if (!inProduction) return url;
    const target = fs.readFileSync(path.join(OUTPUT_DIR, url));
    const hash = crypto.createHash('shake256', { outputLength: 4 });
    const [urlPart, paramPart] = url.split('?');
    const params = new URLSearchParams(paramPart || '');
    hash.update(target);
    params.set('id', hash.digest('hex'));
    return `${urlPart}?${params}`;
  });

  eleventyConfig.addFilter('join', function () {
    const args = Array.prototype.slice.call(arguments);
    let url = '';
    args.forEach((pathString) => (url = path.join(url, pathString)));
    return url;
  });

  eleventyConfig.addFilter('urlJoin', function (baseUrl, pathname) {
    return new URL(path.join(baseUrl, pathname)).toString();
  });

  eleventyConfig.addFilter('base64', function (string = '') {
    return Buffer.from(string).toString('base64');
  });

  eleventyConfig.addFilter('replaceText', function (string, from, to) {
    if (!string) return '';
    let str = string.split(from);
    return str.join(to);
  });

  // transform: posthtml
  eleventyConfig.addTransform('posthtml', async function (content, outputPath) {
    if (!outputPath.endsWith('.html')) return content;
    // @see https://github.com/posthtml/posthtml-urls
    const urlsOptions = {
      eachURL: (url, attr, tag) => {
        // 相対パス変換
        if (isRelative) {
          if (tag === 'a' && attr === 'href') return url;
          return relativePath(outputPath.replace(OUTPUT_DIR, ''), url);
        }
        return url;
      },
    };
    return await posthtml([
      ...(inProduction ? [posthtmlUrls(urlsOptions)] : []),
    ])
      .process(content)
      .then((result) => result.html)
      .catch((e) => {
        console.error(e);
        return e.message;
      });
  });

  // html minify
  if (inProduction) {
    if (isHtmlMinify) {
      eleventyConfig.addTransform(
        'htmlmin',
        async function (content, outputPath) {
          if (outputPath && outputPath.endsWith('.html')) {
            const minified = await minify(content, {
              collapseWhitespace: true,
              minifyCSS: true,
              minifyJS: true,
              removeComments: true,
              useShortDoctype: true,
            });
            return minified;
          }
          return content;
        }
      );
    } else {
      eleventyConfig.addTransform('prettier', (content, outputPath) => {
        if (outputPath.endsWith('.html')) {
          return prettier.format(content, { parser: 'html', printWidth: 160 });
        }
        return content;
      });
    }
  }

  return {
    templateFormats: ['md', 'njk', 'html'],
    pathPrefix: PATH_PREFIX,
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    passthroughFileCopy: true,
    dir: {
      input: INPUT_DIR,
      output: OUTPUT_DIR,
      // NOTE: These two paths are relative to dir.input
      // @see https://github.com/11ty/eleventy/issues/232
      includes: '_includes',
      data: '_data',
    },
  };
};

/**
 * サーバールートパス -> 相対パス変換
 *
 * @param {string} from 比較対象パス
 * @param {string} to 変換対象パス
 * @returns {string} 相対パス
 */
function relativePath(from, to) {
  if (!to.match(/^\//)) return to;
  if (to.match(/^\/\//)) return to;
  let url;
  url = path.relative(from, to);
  url = path.relative('..', url);
  url = !url.startsWith('.') ? `./${url}` : url;
  return url;
}
