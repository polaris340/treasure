var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var ts = require('gulp-typescript');

var paths = {
  sass: ['./scss/**/*.scss'],
  css: ['./.tmp/css/**/*.css'],
  ts: ['./ts/**/*.ts']
};

gulp.task('default', ['sass', 'ts', 'concat-css']);

gulp.task('sass', function(done) {
  gulp.src(paths.sass)
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(gulp.dest('./.tmp/css/'))
    .on('end', done);
});

gulp.task('concat-css', function() {
  return gulp.src('./.tmp/css/**/*.css')
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('./www/css/'));
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.ts, ['ts']);
  gulp.watch(paths.css, ['concat-css']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('ts', function() {
  var tsResult = gulp.src(paths.ts)
    .pipe(ts({
      out: 'app.js',
      target: 'ES5'
    }));
  return tsResult.js.pipe(gulp.dest('www/js'));
});
