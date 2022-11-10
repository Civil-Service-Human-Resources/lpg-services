var gulp = require('gulp');
var ts = require('gulp-typescript');
var sass = require('gulp-sass')(require('dart-sass'));

var tsProject = ts.createProject('tsconfig.json');

function typescript() {
    return tsProject.src()
    .pipe(tsProject()).js.pipe(gulp.dest("./dist/build")).pipe(gulp.dest('./dist/node_modules'))
}

function buildSass() {
    return gulp.src("./src/ui/assets/styles/**/*.*css")
        .pipe(sass().on("error", sass.logError))
        .pipe(gulp.dest("./dist/ui/assets/styles"))
}

function jasmine() {
    return gulp.src("./src/jasmine.js")
        .pipe(gulp.dest("./dist"))
}

function locale() {
    return gulp.src("./src/locale/**/*.*")
        .pipe(gulp.dest("./dist/locale"))
}

function images() {
    return gulp.src("./src/ui/assets/img/**/*.*")
        .pipe(gulp.dest("./dist/ui/assets/img"))
}

function pages() {
    return gulp.src("./src/ui/page/**/*.*")
    .pipe(gulp.dest("./dist/ui/page"))
}

function components() {
    return gulp.src("./src/ui/component/**/*.*")
    .pipe(gulp.dest("./dist/ui/component"))
}

function js() {
    return gulp.src("./src/ui/assets/js/**/*.*")
        .pipe(gulp.dest("./dist/ui/assets/js"))
}

function watchAssets() {
    gulp.watch("./src/ui/page/**/*.*", pages)
    gulp.watch("./src/ui/assets/styles/**/*.*css", buildSass)
    gulp.watch("./src/ui/component/**/*.*", components)
}

exports.typescript = typescript
exports.buildSass = buildSass
exports.jasmine = jasmine
exports.locale = locale
exports.images = images
exports.js = js
exports.pages = pages
exports.components = components


const setupDist = gulp.parallel(jasmine, locale, images, js, pages, components)
const compile = gulp.series(setupDist, gulp.parallel(buildSass, typescript))

exports.watchAssets = watchAssets
exports.setupDist = setupDist
exports.compile = compile