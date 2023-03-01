
const azure = require('azure-storage');
const fs = require('fs');
const mime = require('mime-types');
const parse = require('csv-parse/lib/sync');
const path = require('path');
const slugid = require('slugid');
const xml2js = require('xml2js');
const unzip = require('unzip');

const { Writable } = require('stream');

const coursesFile = process.argv[2];
const modulesFile = process.argv[3];
const eventsFile = process.argv[4];
const scormIdsFile = process.argv[5];
const scormLocation = process.argv[6];

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

const blob = azure.createBlobService();

const filesToSubstitute = [];

async function uploadScormIds(file) {
  const rawData = fs.readFileSync(file);
  const lines = parse(rawData.toString());

  for (const line of lines) {
      const id = line[1];
      const location = line[2];
      await uploadScorm(id, location);
  }
}

async function parseCourses(file) {
    const rawData = fs.readFileSync(file);
    const lines = parse(rawData.toString());

    lines.shift();

    let courses = [];
    let currentCourse;
    let courseAudience;

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
            currentCourse.shortDescription = line[9];
            currentCourse.description = line[10];
            currentCourse.learningOutcomes = line[11];

            let areaOfWork = tag(line[12]);
            let departments = !!line[16] ? line[16].toLowerCase().split('\n') : null;
            let grades = !!line[17] ? line[17].split('\n') : null;

            courseAudience = createAudience(departments, false, grades, false, null, !!areaOfWork ? [areaOfWork] : null);
        } else if (currentCourse) {
            // Module of course
            let module = {
                id: slugid.nice(),
                audiences: [],
                title: line[5],
                type: getType(line[2])
            };

            module.duration = Number(line[7]);
            module.price = (line[13] === 'Free' || !line[13]) ? 0 : Number(line[12].replace('£', ''));

            const location = line[6];
            if (location) {
                switch (module.type) {
                    case 'elearning':
                        module.startPage = await uploadScorm(`${currentCourse.id}/${module.id}`, location);
                        break;
                    case 'video':
                    case 'link':
                        module.location = location;
                        break;
                }
            }

            if (courseAudience) {
                module.audiences.push(courseAudience);
            }

            if (line[19] === 'Yes') {
                module.audiences.push(createAudience(['co'], line[19], line[20], line[21], line[22]));
            }
            if (line[23] === 'Yes') {
                module.audiences.push(createAudience(['dh'], line[23], line[24], line[25], line[26]));
            }
            if (line[27] === 'Yes') {
                module.audiences.push(createAudience(['hmrc'], line[27], line[28], line[29], line[30]));
            }

            currentCourse.modules.push(module);
        }
    }

    if (currentCourse) {
        courses.push(currentCourse);
    }
    return courses;
}

function getType(type) {
    switch (type.toLowerCase()) {
        case 'online':
            return 'elearning';
        case 'classroom':
            return 'face-to-face';
        case 'pdf':
        case 'link':
            return 'link';
        case 'video':
            return 'video';
    }
}

function parseEvents(file) {

    const rawData = fs.readFileSync(file);
    const lines = parse(rawData.toString());

    lines.shift();

    let events = {};

    for (const line of lines) {
        if (!Date.parse(line[1])) {
            continue;
        }
        let event = {
            id: slugid.nice(),
            location: line[2],
            date: new Date(Date.parse(line[1] + ' UTC'))
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

    let courses = [];

    for (const line of lines) {
        // Has title, new course
        let course = {
            _class: 'uk.gov.cslearning.catalogue.domain.Course',
            id: slugid.nice(),
            modules: []
        };

        course.title = line[1];
        course.shortDescription = line[6];
        course.description = line[7];
        course.learningOutcomes = line[8];

        // Module of course
        let module = {
            id: slugid.nice(),
            productCode: line[11],
            audiences: []
        };

        module.duration = Number(line[4]) * 60;
        module.price = line[12] === 'Free' ? 0 : Number(line[12].replace('£', ''));
        module.type = getType(line[2]);

        if (module.type === 'video' || module.type === 'link') {
            module.location = line[3];
            if (!module.location) {
                continue;
            }
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

    if (!departments && !grades && !areasOfWork) {
        return null;
    }

    let audience = {
        mandatory: required === 'Yes'
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
        for (let i = 0; i < grades.length; i++) {
            let grade = grades[i];
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

async function run() {
    // let courses = await parseCourses(coursesFile);
    // courses = courses.concat(parseModules(modulesFile, eventsFile));
    // fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(courses));

    // let courses = parseModules(modulesFile, eventsFile);
    // fs.writeFileSync(path.join(__dirname, 'modules.json'), JSON.stringify(courses));

  await uploadScormIds(scormIdsFile);
}

run()
    .then(() => console.log('Done'))
    .catch(e => console.log(e));

async function uploadScorm(id, location) {

    console.log(`Uploading ${location} for ${id}`);

    const filePath = path.join(scormLocation, location);

    const doUpload = async () => await new Promise((resolve, reject) => {
        const promises = [];
        fs.createReadStream(filePath)
            .pipe(unzip.Parse())
            .on('entry', entry => {
                if (entry.type.toLowerCase() === 'directory') {
                    entry.autodrain();
                } else {
                    promises.push(upload(id, entry))
                }
            })
            .on('close', () => {
                Promise.all(promises)
                    .then(resolve)
                    .catch(reject)
            })
            .on('error', reject)
    });

    while (true) {
        try {
            const results = await doUpload();
            const metadata = results.find(result => !!result);
            return metadata.launchPage;
        } catch (e) {
            console.log('Error uploading, retrying.', e);
        }
    }
}

async function upload(id, entry) {

    let metadata = null;

    const filename = entry.path.substring(entry.path.lastIndexOf('/') + 1)
    const storagePath = `${id}/${entry.path}`

    try {
        if (filesToSubstitute.indexOf(filename) > -1) {
            entry.autodrain();
            const fileData = await getFile(filename);
            await doUpload(storagePath, fileData);
        } else {
            if (entry.path.endsWith('imsmanifest.xml')) {
                metadata = await parseMetadata(entry)
            }
            await doUpload(storagePath, entry);
        }
    } catch (e) {
        console.log(`Error uploading ${entry.path}`, e);
        throw e;
    }
    return metadata;
}

async function getFile(filename) {
    const filePath = path.join(
        __dirname,
        '..',
        'ui',
        'assets',
        'js',
        filename
    );
    return fs.createReadStream(filePath);
}

async function doUpload(storagePath, entry) {
    await new Promise((resolve, reject) => {
        entry.pipe(
            blob.createWriteStreamToBlockBlob(
                'lpgdevcontent',
                storagePath,
                { contentSettings: { contentType: mime.lookup(entry.path) || 'application/octet-stream' } },
                (err, blobData) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(blobData)
                    }
                }
            )
        ).on('error', e => {
            reject(e);
        });
    });
}

async function parseMetadata(entry) {
	const content = await new Promise(resolve => {
		let content = '';
		entry.pipe(
			new Writable({
				final: () => {
					resolve(content)
				},
				write: (chunk, encoding, next) => {
					content += chunk.toString()
					next()
				},
			})
		)
	});

	const data = await new Promise((resolve, reject) => {
        xml2js.parseString(content, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    });

    if (data.manifest) {
        let identifier;
        let title;
        let launchPage;
        if (data.manifest.organizations) {
            for (const wrapper of data.manifest.organizations) {
                const organization = wrapper.organization;
                if (organization.length) {
                    identifier = organization[0].$.identifier;
                    if (organization[0].title && organization[0].title.length) {
                        title = organization[0].title[0];
                    }
                    break;
                }
            }
        }
        if (data.manifest.resources) {
            for (const wrapper of data.manifest.resources) {
                const resource = wrapper.resource;
                if (resource.length) {
                    const type = resource[0].$['adlcp:scormtype'];
                    const href = resource[0].$.href;
                    if (type === 'sco') {
                        launchPage = href;
                        break;
                    }
                }
            }
        }
        return {
            identifier,
            launchPage,
            title,
        }
    }
    return {};
}
