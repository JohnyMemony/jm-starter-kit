const {src, dest, parallel, watch, series} = require('gulp');
const pug = require('gulp-pug');
const cssnano = require('cssnano');
const del = require("del");
const autoprefixer = require('autoprefixer');
const postcss = require("gulp-postcss");
const browsersync = require("browser-sync").create();
const sass = require('gulp-sass');
const tildeImporter = require('node-sass-tilde-importer');
const rigger = require('gulp-rigger');
const gulpBabel = require('gulp-babel');
const spritesvg = require('gulp-svg-sprite');
const rename = require("gulp-rename");
const uglify = require("gulp-uglify");
const gulpIf = require('gulp-if');

const PRODUCTION = true;
const PATH = {
  build: {
    js: 'build/js/',
    styles: 'build/css/',
    images: 'build/images/',
    fonts: 'build/fonts/',
    root: 'build/',
    relRoot: './build'
  },
  src: {
    html: './src/pug/*.pug',
    js: './src/js/*.js',
    styles: './src/styles/main.scss',
    stylesVendor: './src/styles/vendor.scss',
    images: ['./src/images/**/*.*', './src/images/**/*.svg', '!./src/images/sprite/**/*.*'],
    spriteSvg: './src/images/svg/*.svg',
    fonts: './src/fonts/**/*.*',
  },
  watch: {
    html: './src/pug/**/*.*',
    js: './src/js/**/*.js',
    styles: './src/styles/**/*.scss',
    images: ['./src/images/**/*.*', './src/images/**/*.svg', '!./src/images/sprite/**/*.*'],
    fonts: './src/fonts/**/*.*',
    spriteSvg: './src/images/svg/*.svg',
  },
  clean: 'build/'
};

const isProduction = function (file) {
  return PRODUCTION;
};

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: PATH.build.relRoot
    },
    port: 3000
  });

  done();
}

function html() {
  return src(PATH.src.html)
    .pipe(pug())
    .pipe(dest(PATH.build.root))
    .pipe(browsersync.stream());
}

function css() {
  return src([PATH.src.styles, PATH.src.stylesVendor])
    .pipe(sass({
      includePaths: ['node_modules'],
      importer: tildeImporter,
    })
      .on('error', sass.logError))
    .pipe(gulpIf(isProduction, postcss([autoprefixer('last 6 versions'), cssnano()])))
    .pipe(rename({suffix: ".min"}))
    .pipe(dest(PATH.build.styles))
    .pipe(browsersync.stream());
}

function js() {
  return src(PATH.src.js, {sourcemaps: true})
    .pipe(rigger())
    .pipe(gulpBabel({
      presets: ["@babel/preset-env"],
    }))
    .pipe(
      gulpIf(isProduction,
        uglify({
          mangle: false
        }),
      )
    )
    .pipe(dest(PATH.build.js, {sourcemaps: true}))
    .pipe(browsersync.stream());
}

function fonts() {
  return src(PATH.src.fonts)
    .pipe(dest(PATH.build.fonts))
    .pipe(browsersync.stream());
}

function images() {
  return src(PATH.src.images)
    .pipe(dest(PATH.build.images))
    .pipe(browsersync.stream());
}

function svg() {
  return src(PATH.src.spriteSvg)
    .pipe(spritesvg({
      'mode': {
        'symbol': {
          'dimentions': true,
          'dest': 'images',
          'sprite': '../images/sprite-inline.svg',
          'bust': false,
          example: true
        }
      }
    }))
    .pipe(dest(PATH.build.root))
    .pipe(browsersync.stream());
}

function clean() {
  return del([PATH.build.relRoot]);
}

function watchFiles() {
  watch([PATH.watch.html], html);

  watch([PATH.watch.styles], css);

  watch([PATH.watch.js], js);

  watch(PATH.watch.images, images);

  watch([PATH.watch.fonts], fonts);

  watch([PATH.watch.spriteSvg], svg);
}

const buildTask = series(clean, parallel(html, css, js, fonts, images, svg));
const watchTask = parallel(watchFiles, browserSync);

exports.js = js;
exports.html = html;
exports.css = css;
exports.fonts = fonts;
exports.images = images;
exports.svg = svg;
exports.clean = clean;
exports.build = buildTask;
exports.watch = watchTask;
exports.default = parallel(html, css, js, fonts, images, svg);
