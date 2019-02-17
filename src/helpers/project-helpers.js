import {v4 as uuid} from 'uuid';
import randomColor from 'randomcolor';
import idb from 'idb';
import semver from 'semver';
import firebase, { auth, provider } from './firebase-helpers.js';

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
export function saveProject(user, project, name) {
    return new Promise((resolve, reject) => {
        if (user) {
            const promises = [];

            // Needs:
            // 1.) Project metadata & settings
            const settings = project.settings;
            settings.appVersion = project.appVersion;          

            // 2.) regions/$user/$project: ordered list of region IDs in this project
            // 2a.) regionData/$user/$regionId: for each region ID, an object containing its data
            const regions = [];
            for (let i=0; i<project.regions.length; i++) {
                const {id, ...rest} = project.regions[i];
                regions.push(id);

                const result = firebase.database().ref(`regionData/${user.uid}/${id}`).set(Object.assign({projectName: name}, rest));
                promises.push(result);
            }

            // 3.) sections/$user/$project: ordered list of section IDs in this project
            // 3a.) sectionData/$user/$sectionId: for each section ID, an object containing its data
            const sections = [];
            for (let i=0; i<project.sections.length; i++) {
                const {id, ...rest} = project.sections[i];
                sections.push(id);

                const result = firebase.database().ref(`sectionData/${user.uid}/${id}`).set(Object.assign({projectName: name}, rest));
                promises.push(result);
            }

            // 4.) members/$user/$project: ordered list of member IDs in this project
            // 4a.) memberData/$user/$memberId: for each member ID, an object containing its data
            const members = [];
            for (let i=0; i<project.members.length; i++) {
                const {id, ...rest} = project.members[i];
                members.push(id);

                const result = firebase.database().ref(`memberData/${user.uid}/${id}`).set(Object.assign({projectName: name}, rest));
                promises.push(result);
            }

            promises.push(
                firebase.database().ref(`projects/${user.uid}/${name}`).set(settings),
                firebase.database().ref(`regions/${user.uid}/${name}`).set(regions),
                firebase.database().ref(`sections/${user.uid}/${name}`).set(sections),
                firebase.database().ref(`members/${user.uid}/${name}`).set(members)
            );

            // Now, wait for all operations to complete and resolve the promise
            resolve(
                Promise.all(promises).then(() => {
                    updateProjectQueryString(name, user);
                    return;
                })
            );
        }
        else
            reject(new Error('Unable to save project: user is not authenticated'));
    });
}

export function saveMetadata(user, name, metadata) {
    return firebase.database().ref(`projects/${user.uid}/${name}`).set(metadata);
}

export function saveRegionOrder(user, projectName, regions) {
    return firebase.database().ref(`regions/${user.uid}/${projectName}`).set(regions);
}

export function saveSectionOrder(user, projectName, sections) {
    return firebase.database().ref(`sections/${user.uid}/${projectName}`).set(sections);
}

export function saveMemberOrder(user, projectName, members) {
    return firebase.database().ref(`members/${user.uid}/${projectName}`).set(members);
}

export function saveNewRegion(user, projectName, region) {
    const {id, ...regionData} = region;
    regionData.projectName = projectName;
    return firebase.database().ref(`regionData/${user.uid}/${id}`).set(regionData);
}

export function saveNewSection(user, projectName, section) {
    const {id, ...sectionData} = section;
    sectionData.projectName = projectName;
    return firebase.database().ref(`sectionData/${user.uid}/${id}`).set(sectionData);
}

export function saveNewMember(user, projectName, member) {
    const {id, ...memberData} = member;
    memberData.projectName = projectName;
    return firebase.database().ref(`memberData/${user.uid}/${id}`).set(memberData);
}

export function saveRegionEdits(user, projectName, region) {
    const {id, ...regionData} = region;
    regionData.projectName = projectName;
    return firebase.database().ref(`regionData/${user.uid}/${id}`).update(regionData);
}

export function saveSectionEdits(user, projectName, section) {
    const {id, ...sectionData} = section;
    sectionData.projectName = projectName;
    return firebase.database().ref(`sectionData/${user.uid}/${id}`).update(sectionData);
}

export function saveMemberEdits(user, projectName, member) {
    const {id, ...memberData} = member;
    memberData.projectName = projectName;
    return firebase.database().ref(`memberData/${user.uid}/${id}`).update(memberData);
}

export function renameProject(user, oldName, newName) {
    return new Promise((resolve, reject) => {
        Promise.all([loadProject(user, oldName), loadProject(user, newName)])
            .then(result => {
                const [existingProject, newLocation] = result;
                if (existingProject && !newLocation) {
                    deleteProject(user, oldName).then(() => {
                        saveProject(user, existingProject, newName).then(() => {
                            updateProjectQueryString(newName, user);
                            resolve();
                        });
                    });
                }
                else
                    reject(new Error('Unable to rename project: user is not authenticated'));
            });
    });
}

function deleteAllChildrenHelper(snapshot) {
    const promises = [];
    snapshot.forEach(child => {
        promises.push(child.ref.remove());
    });
    return Promise.all(promises);
}

export function deleteProject(user, name) {
    return new Promise((resolve, reject) => {
        if (user) {
            const db = firebase.database();
            resolve(Promise.all([
                db.ref(`projects/${user.uid}/${name}`).remove(),
                db.ref(`regions/${user.uid}/${name}`).remove(),
                db.ref(`sections/${user.uid}/${name}`).remove(),
                db.ref(`members/${user.uid}/${name}`).remove(),
                db.ref(`regionData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value').then(deleteAllChildrenHelper),
                db.ref(`sectionData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value').then(deleteAllChildrenHelper),
                db.ref(`memberData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value').then(deleteAllChildrenHelper)
            ]));
        }
        else
            reject(new Error('Unable to delete project: user is not authenticated'));
    });
}

export function deleteRegionData(user, id) {
    return new Promise((resolve, reject) => {
        if (user) {
            resolve(firebase.database().ref(`regionData/${user.uid}/${id}`).remove());
        }
        else
            reject(new Error('Unable to delete region data: user is not authenticated'));
    })
}

export function deleteSectionData(user, id) {
    return new Promise((resolve, reject) => {
        if (user) {
            resolve(firebase.database().ref(`sectionData/${user.uid}/${id}`).remove());
        }
        else
            reject(new Error('Unable to delete section data: user is not authenticated'));
    })
}

export function deleteMemberData(user, id) {
    return new Promise((resolve, reject) => {
        if (user) {
            resolve(firebase.database().ref(`memberData/${user.uid}/${id}`).remove());
        }
        else
            reject(new Error('Unable to delete member data: user is not authenticated'));
    })
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
export function getUnusedProjectName(user, name = DEFAULT_NAME) {
    return listProjects(user).then(projects => {
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

export function loadProject(user, name) {
    return new Promise((resolve, reject) => {
        if (user) {
            const db = firebase.database();
            Promise.all([
                db.ref(`projects/${user.uid}/${name}`).once('value'),
                db.ref(`regions/${user.uid}/${name}`).once('value'),
                db.ref(`sections/${user.uid}/${name}`).once('value'),
                db.ref(`members/${user.uid}/${name}`).once('value'),
                db.ref(`regionData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value'),
                db.ref(`sectionData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value'),
                db.ref(`memberData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value')
            ]).then(result => {
                const settings = result[0].val();
                if (settings) {
                    const appVersion = settings.appVersion;
                    delete settings.appVersion;
    
                    const regions = result[1].val() || [];
                    const sections = result[2].val() || [];
                    const members = result[3].val() || [];
                    const regionData = result[4].val() || {};
                    const sectionData = result[5].val() || {};
                    const memberData = result[6].val() || {};
    
                    // Unpack data for the rest of the app
                    const unpackedRegions = regions.map(current => {
                        const data = Object.assign({id: current}, regionData[current]);
                        delete data.projectName;
                        return data;
                    });
    
                    const unpackedSections = sections.map(current => {
                        const data = Object.assign({id: current}, sectionData[current]);
                        delete data.projectName;
                        return data;
                    });
    
                    const unpackedMembers = members.map(current => {
                        const data = Object.assign({id: current}, memberData[current]);
                        delete data.projectName;
                        return data;
                    });
    
                    resolve({
                        settings,
                        regions: unpackedRegions,
                        sections: unpackedSections,
                        members: unpackedMembers,
                        appVersion
                    });
                }
                else
                    resolve(null);
            });
        }
        else
            reject(new Error('Unable to load project: user is not authenticated'));
    })
}

export function listProjects(user) {
    return new Promise((resolve, reject) => {
        if (user) {
            firebase.database().ref(`projects/${user.uid}`).once('value').then(snapshot => {
                resolve(Object.keys(snapshot.val() || {}));
            });
        }
        else
            reject(new Error('Unable to list projects: user is not authenticated'));
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
