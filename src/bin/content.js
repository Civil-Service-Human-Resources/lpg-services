
const fs = require('fs')
const path = require('path')
const slugid = require('slugid')
const parse= require('csv-parse/lib/sync')

const coursesFile = process.argv[2]
const modulesFile = process.argv[3]
const eventsFile = process.argv[4]

const ALL_GRADES = [
    "AA",
    "AO",
    "EO",
    "HEO",
    "SEO",
    "G6",
    "G7",
    "SCS"
];

function parseCourses(file) {
    const rawData = fs.readFileSync(file);
    const lines = parse(rawData.toString());

    lines.shift();

    var courses = [];
    var currentCourse;
    var areaOfWork;

    for (const line of lines) {
        if (line[1]) {
            // Has title, new course
            if (currentCourse) {
                courses.push(currentCourse);
            }
            currentCourse = {
                _class: 'uk.gov.cslearning.catalogue.domain.Course',
                id: slugid.nice(),
                modules: []
            };
            currentCourse.title = line[1];
            currentCourse.duration = Number(line[6]) * 60;
            currentCourse.shortDescription = line[8];
            currentCourse.description = line[9];
            currentCourse.learningOutcomes = line[10];
            currentCourse.price = line[12] === 'Free' ? 0 : Number(line[12].replace('£', ''));

            areaOfWork = tag(line[11]);
        } else if (currentCourse) {
            // Module of course
            var module = {
                id: slugid.nice(),
                audiences: [],
                title: line[5],
                type: 'elearning',
                startPage: 'fixme.html'
            };

            if (areaOfWork) {
                module.audiences.push({ areasOfWork: [areaOfWork] });
            }

            var audience = createAudience(['co'], line[13], line[14], line[15], line[16]);
            if (audience) {
                module.audiences.push(audience);
            }

            audience = createAudience(['dh'], line[17], line[18], line[19], line[20]);
            if (audience) {
                module.audiences.push(audience);
            }

            audience = createAudience(['hmrc'], line[21], line[22], line[23], line[24]);
            if (audience) {
                module.audiences.push(audience);
            }

            currentCourse.modules.push(module);
        }
    }

    if (currentCourse) {
        courses.push(currentCourse);
    }
    return courses;
}

function parseEvents(file) {

    const rawData = fs.readFileSync(file);
    const lines = parse(rawData.toString());

    lines.shift();

    var events = {};

    for (const line of lines) {
        if (!Date.parse(line[2])) {
            continue;
        }
        var event = {
            id: slugid.nice(),
            location: line[3],
            date: new Date(Date.parse(line[2] + ' UTC'))
        };
        if (!events[line[0]]) {
            events[line[0]] = [];
        }
        events[line[0]].push(event);
    }
    return events;
}

function parseModules(file, eventsFile) {

    const events = parseEvents(eventsFile);

    const rawData = fs.readFileSync(file);
    const lines = parse(rawData.toString());

    lines.shift();

    var courses = [];

    for (const line of lines) {
        // Has title, new course
        var course = {
            _class: 'uk.gov.cslearning.catalogue.domain.Course',
            id: slugid.nice(),
            modules: []
        };

        course.title = line[1];
        course.duration = Number(line[4]) * 60;
        course.shortDescription = line[6];
        course.description = line[7];
        course.learningOutcomes = line[8];
        course.price = line[12] === 'Free' ? 0 : Number(line[12].replace('£', ''));

        // Module of course
        var module = {
            id: slugid.nice(),
            productCode: line[11],
            audiences: []
        };

        if (line[2].indexOf('Classroom') > -1) {
            module.type = 'face-to-face';
        } else if (line[2].indexOf('video') > -1) {
            module.type = 'video';
            module.location = line[3];
        }

        module.audiences.push(createAudience(null, false, line[9].split(/\n/), null, null, line[10].split(/\n/).map(tag)));

        if (events[course.title]) {
            module.events = events[course.title];
        }

        course.modules.push(module);
        courses.push(course);
    }

    return courses;
}

function createAudience(departments, required, grades, repeat, requiredBy, areasOfWork) {

    var mandatory = required === 'Yes';

    if (departments && !mandatory) {
        return null;
    }

    var audience = {
        mandatory: mandatory
    };

    if (departments) {
        audience.departments = departments;
    }

    if (areasOfWork) {
        audience.areasOfWork = areasOfWork;
    }
    if (grades === 'All') {
        audience.grades = ALL_GRADES;
    } else if (grades) {
        audience.grades = [];
        for (var i = 0; i < grades.length; i++) {
            var grade = grades[i];
            if (grade.indexOf('Administrative') > -1) {
                audience.grades.push('AA');
                audience.grades.push('AO');
            } else if (grade.indexOf('First line') > -1) {
                audience.grades.push('EO');
            } else if (grade.indexOf('Middle') > -1) {
                audience.grades.push('HEO');
                audience.grades.push('SEO');
            } else if (grade.indexOf('Senior') > -1) {
                audience.grades.push('G6');
                audience.grades.push('G7');
            } else if (grade.indexOf('Director') > -1) {
                audience.grades.push('SCS');
            }
        }
    }
    if (repeat === 'Annually') {
        audience.frequency = 'YEARLY';
    }
    if (Date.parse(requiredBy)) {
        audience.requiredBy = new Date(Date.parse(requiredBy + ' UTC'));
    }
    return audience;
}

function tag(val) {
    return val.toLowerCase().replace(/\s/g, '-');
}

var courses = parseCourses(coursesFile);
courses = courses.concat(parseModules(modulesFile, eventsFile));

fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(courses));
