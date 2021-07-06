var gulp = require('gulp');
var ts = require('gulp-typescript');
var sass = require('gulp-sass')(require('dart-sass'));

var tsProject = ts.createProject('tsconfig.json');

function typescript() {
    return tsProject.src()
    .pipe(tsProject()).js.pipe(gulp.dest("dist"))
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

function js() {
    return gulp.src("./src/ui/assets/js/**/*.*")
        .pipe(gulp.dest("./dist/ui/assets/js"))
}

exports.typescript = typescript
exports.buildSass = buildSass
exports.jasmine = jasmine
exports.locale = locale
exports.images = images
exports.js = js

const setupDist = gulp.parallel(jasmine, locale, images, js)
const compile = gulp.series(setupDist, gulp.parallel(buildSass, typescript))

exports.setupDist = setupDist
exports.compile = compile