import {v4 as uuid} from 'uuid';
import randomColor from 'randomcolor';
import idb from 'idb';
import semver from 'semver';

const PROJECTS_KEY = 'projects';
const DEFAULT_NAME = 'Untitled';
const DB_NAME = 'ensemble-db';
const DB_VER = 1;
const APP_NAME = APP_INFO.NAME;
const PROJECT_FORMAT_VER = '0.3.0';

const currentDb = idb.open(DB_NAME, DB_VER, upgradeDB => {
    switch (upgradeDB.oldVersion) {
        case 0:
            // Brand new DB
            upgradeDB.createObjectStore(PROJECTS_KEY);
    }
});

/* DOM/window updates */
export function updateProjectQueryString(name) {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('project');
    searchParams.set('project', encodeURIComponent(name));
    const newParamString = `?${searchParams.toString()}`;

    if (location.search !== newParamString)
        history.replaceState(null, name, newParamString);
    document.title = `${name} | ${APP_NAME}`;
}

export function resetProjectQueryString() {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('project');

    const newParamString = searchParams.toString();
    history.replaceState(null, '', newParamString.length > 0 ? `?${searchParams.toString()}` : '/');
    document.title = APP_NAME;
}

/* Project edits */
export function saveProject(project, name) {
    return currentDb.then(db => {
        const tx = db.transaction(PROJECTS_KEY, 'readwrite');
        tx.objectStore(PROJECTS_KEY).put(project, name);
        return tx.complete;
    }).then(result => {
        updateProjectQueryString(name);
        return result;
    });
}

export function renameProject(oldName, newName) {
    return new Promise((resolve, reject) => {
        Promise.all([loadProject(oldName), loadProject(newName)])
            .then(result => {
                const [existingProject, newLocation] = result;
                if (existingProject && !newLocation) {
                    deleteProject(oldName).then(() => {
                        saveProject(existingProject, newName).then(() => {
                            updateProjectQueryString(newName);
                            resolve();
                        });
                    });
                }
                else
                    reject();
            });
    });
}

export function deleteProject(name) {
    return currentDb.then(db => {
        const tx = db.transaction(PROJECTS_KEY, 'readwrite');
        tx.objectStore(PROJECTS_KEY).delete(name);
        return tx.complete;
    });
}

export function projectNeedsUpgrade(project) {
    return semver.lt(project.appVersion, PROJECT_FORMAT_VER);
}

export function upgradeProject(project) {
    let finalProject = JSON.parse(JSON.stringify(project));

    if (semver.lt(finalProject.appVersion, '0.2.0')) {
        finalProject.appVersion = '0.2.0';
        finalProject.regions = [createRegion()];
        finalProject.regions[finalProject.regions.length - 1].curvedLayout = finalProject.settings.curvedLayout;
        for (let i=0; i<finalProject.sections.length; i++) {
            finalProject.sections[i].region = finalProject.regions[finalProject.regions.length -1].id;
        }

        delete finalProject.settings.curvedLayout;
        delete finalProject.settings.zoom;
    }
    if (semver.lt(finalProject.appVersion, '0.3.0')) {
        finalProject.appVersion = '0.3.0';
        finalProject.sections = finalProject.sections.map(currentSection => {
            return Object.assign({}, currentSection, {
                offsetType: 'first-row',
                offsetValue: 0
            });
        });
    }

    return finalProject;
}

/* Project info and stats */
export function getUnusedProjectName(name = DEFAULT_NAME) {
    return listProjects().then(projects => {
        let num = 1, found = false;
        if (projects) {
            while (!found) {
                if (projects.indexOf(`${name} ${num}`) !== -1)
                    num++;
                else
                    found = true;
            }
        }
        return `${name} ${num}`;
    });
}

export function loadProject(name) {
    return currentDb.then(db => {
        const tx = db.transaction(PROJECTS_KEY, 'readonly');
        return tx.objectStore(PROJECTS_KEY).get(name);
    });
}

export function listProjects() {
    return currentDb.then(db => {
        const tx = db.transaction(PROJECTS_KEY, 'readonly');
        return tx.objectStore(PROJECTS_KEY).getAllKeys();
    });
}

/* Create types */
export function createEmptyProject () {
    return {
        regions: [createRegion()],
        sections: new Array(),
        members: new Array(),
        settings: {
            seatNameLabels: 'initials',
            downstageTop: false,
            implicitSeatsVisible: false
        },
        appVersion: PROJECT_FORMAT_VER
    };
}


export function createSectionRow () {
    return {
        min: 2,
        max: 2
    }
}

export function createRegion (name = 'Untitled region') {
    return {
        name,
        id: uuid(),
        curvedLayout: true
    }
}

export function createSection (name = 'Untitled', regionId = null) {
    return {
        name,
        color: randomColor({luminosity: 'light'}),
        id: uuid(),
        region: regionId,
        offsetType: 'first-row',
        offsetValue: 0,
        rowSettings: [
            {
                min: 2,
                max: 2
            },
            {
                min: 4,
                max: 6
            },
            {
                min: 4,
                max: 8
            }]
    };
}

export function createPerson (name = 'New person', sectionId = null) {
    return {
        name: name,
        id: uuid(),
        section: sectionId,
        notes: ''
    }
}

/* Clone types */

export function cloneRegion (region) {
    return Object.assign({}, region);
}

export function cloneSection (section) {
    const newSection = Object.assign({}, section);
    newSection.rowSettings = section.rowSettings.map(current => {
        return Object.assign({}, current);
    });
    return newSection;
}

export function clonePerson (person) {
    return Object.assign({}, person);
}

export function validateProject(project) {
    let valid = true;

    if (!Array.isArray(project.regions))
        valid = false;
    if (!Array.isArray(project.sections))
        valid = false;
    if (!Array.isArray(project.members))
        valid = false;
    if (typeof project.settings !== 'object')
        valid = false;
    if (typeof project.appVersion !== 'string')
        valid = false;

    return valid;
}
