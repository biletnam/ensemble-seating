import {v4 as uuid} from 'uuid';
import randomColor from 'randomcolor';
import { openDB } from 'idb';
import semver from 'semver';
import firebase, { auth, provider } from './firebase-helpers.js';
import {templates} from '../templates/index.js';
const PROJECTS_KEY = 'projects';
const DEFAULT_NAME = 'Untitled';
const DB_NAME = 'ensemble-db';
const DB_VER = 2;
const APP_NAME = APP_INFO.NAME;
const PROJECT_FORMAT_VER = '0.13.0';

const currentDb = openDB(DB_NAME, DB_VER, {
    upgrade(db, oldVersion, newVersion, transaction) {
        switch (oldVersion) {
            case 0:
                // Brand new DB
                db.createObjectStore(PROJECTS_KEY);
            case 1:
                db.createObjectStore('env');
        }
    }
});

export function idbSetLastAppVersion (ver) {
    return currentDb.then(db => {
        const tx = db.transaction('env', 'readwrite');
        tx.objectStore('env').put(ver, 'lastVersionUsed');
        return tx.complete;
    });
}

export function idbGetLastAppVersion () {
    return currentDb.then(db => {
        const tx = db.transaction('env', 'readonly');
        return tx.objectStore('env').get('lastVersionUsed');
    });
}

export function idbSaveTemporaryProject (project) {
    return currentDb.then(db => {
        const tx = db.transaction(PROJECTS_KEY, 'readwrite');
        return tx.objectStore(PROJECTS_KEY).put(project, 'temp-project');
    });
}

export function idbLoadTemporaryProject () {
    return currentDb.then(db => {
        const tx = db.transaction(PROJECTS_KEY, 'readonly');
        return tx.objectStore(PROJECTS_KEY).get('temp-project');
    });
}

export function idbDeleteTemporaryProject () {
    return currentDb.then(db => {
        const tx = db.transaction(PROJECTS_KEY, 'readwrite');
        return tx.objectStore(PROJECTS_KEY).delete('temp-project');
    });
}

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
            settings.created = project.created;
            settings.modified = Date.now();

            // 2.) regions/$user/$project: ordered list of region IDs in this project
            // 2a.) regionData/$user/$regionId: for each region ID, an object containing its data
            const regions = [];
            for (const region of project.regions) {
                regions.push(region.id);
                promises.push(saveRegionEdits(user, name, region));
            }

            // 3.) sections/$user/$project: ordered list of section IDs in this project
            // 3a.) sectionData/$user/$sectionId: for each section ID, an object containing its data
            const sections = [];
            for (const section of project.sections) {
                sections.push(section.id);
                promises.push(saveSectionEdits(user, name, section));
            }

            // 4.) members/$user/$project: ordered list of member IDs in this project
            // 4a.) memberData/$user/$memberId: for each member ID, an object containing its data
            const members = [];
            for (const member of project.members) {
                members.push(member.id);
                promises.push(saveMemberEdits(user, project, member));
            }

            promises.push(
                saveMetadata(user, name, settings),
                saveRegionOrder(user, name, regions),
                saveSectionOrder(user, name, sections),
                saveMemberOrder(user, name, members)
            );

            // Now, wait for all operations to complete and resolve the promise
            resolve(Promise.all(promises));
        }
        else
            reject(new Error('Unable to save project: user is not authenticated'));
    });
}

export function saveMetadata(user, name, metadata) {
    return firebase.database().ref(`projects/${user.uid}/${name}`).update(metadata);
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
                    let projectToSave = existingProject;
                    if (projectNeedsUpgrade(projectToSave))
                        projectToSave = upgradeProject(projectToSave);

                    saveProject(user, projectToSave, newName).then(() => {
                        deleteProject(user, oldName).then(() => {
                            resolve();
                        });
                        
                    });
                }
                else {
                    const errorObj = new Error();
                    if (!user) {
                        errorObj.name = 'NotAuthenticatedError';
                        errorObj.message = 'Unable to rename project: user is not authenticated';
                    }
                    else if (!existingProject) {
                        errorObj.name = 'NotFoundError';
                        errorObj.message = `Unable to rename project: original project "${oldName}" does not exist`;
                    }
                    else if (newLocation) {
                        errorObj.name = 'NameCollisionError';
                        errorObj.message = `Unable to rename project: a project by the name of "${newName}" already exists.`;
                    }

                    reject(errorObj);
                }
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
    if (semver.lt(finalProject.appVersion, '0.8.0')) {
        finalProject.appVersion = '0.8.0';
        finalProject.regions = finalProject.regions.map(currentRegion => {
            return Object.assign({}, currentRegion, {
                angle: 180
            });
        });
    }
    if (semver.lt(finalProject.appVersion, '0.10.0')) {
        finalProject.appVersion = '0.10.0';
        finalProject.settings.seatGap = 1.0;
        finalProject.settings.seatSize = 32;
    }
    if (semver.lt(finalProject.appVersion, '0.11.0')) {
        finalProject.appVersion = '0.11.0';
        finalProject.created = 0;
        finalProject.modified = Date.now();
    }
    if (semver.lt(finalProject.appVersion, '0.13.0')) {
        finalProject.appVersion = '0.13.0';
        for (const section of finalProject.sections) {
            section.rowSettings = section.rowSettings.map(row => row.min);
        }
    }

    return finalProject;
}

/* Project info and stats */
export function getUnusedProjectName(user, name = DEFAULT_NAME) {
    return listProjects(user).then(projects => {
        let num = 1, found = false;
        if (projects) {
            while (!found) {
                if (Object.keys(projects).indexOf(`${name} ${num}`) !== -1)
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
                    const created = settings.created;
                    const modified = settings.modified;
                    delete settings.appVersion;
                    delete settings.created;
                    delete settings.modified;
    
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
                        appVersion,
                        created,
                        modified
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
                resolve(snapshot.val() || {});
            });
        }
        else
            reject(new Error('Unable to list projects: user is not authenticated'));
    });
}

/* Create types */
export function createProjectFromTemplate (templateId = 'blank') {
    // Get project from templates
    const project = templates.find(template => template.id === templateId).data;
    return duplicateProject(project);
}

export function isBlankProject(project) {
    const empty = createProjectFromTemplate();
    const emptyRegion = empty.regions.length > 0 ? JSON.parse(JSON.stringify(empty.regions[0])) : '';
    const projectRegion = project.regions.length > 0 ? JSON.parse(JSON.stringify(project.regions[0])) : '';

    delete emptyRegion.id;
    delete projectRegion.id;
    return  (
        project.appVersion === empty.appVersion &&
        JSON.stringify(emptyRegion) === JSON.stringify(projectRegion) && project.regions.length === 1 && empty.regions.length === 1 &&
        JSON.stringify(project.sections) === JSON.stringify(empty.sections) &&
        JSON.stringify(project.members) === JSON.stringify(empty.members) &&
        JSON.stringify(project.settings) === JSON.stringify(empty.settings)
    )
}

export function duplicateProject(oldProject) {
    const project = JSON.parse(JSON.stringify(oldProject));

    // Update regions
    for (const region of project.regions) {
        const newId = uuid();

        project.sections.filter(section => section.region === region.id).forEach(section => {
            section.region = newId;
        });
        region.id = newId;
    }

    // Update sections
    for (const section of project.sections) {
        const newId = uuid();

        project.members.filter(member => member.section === section.id).forEach(member => {
            member.section = newId;
        });
        section.id = newId;
    }

    // Update members
    for (const member of project.members) {
        const newId = uuid();
        member.id = newId;
    }

    // Update any other metadata
    const currentTime = Date.now();
    project.appVersion = PROJECT_FORMAT_VER;
    project.created = currentTime;
    project.modified = currentTime;
    
    return project;
}

export const DEFAULT_SECTION_ROW_LENGTH = 2;

export function createRegion (name = 'Untitled region') {
    return {
        name,
        id: uuid(),
        curvedLayout: true,
        angle: 180
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
        rowSettings: [2, 4, 4]
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
    newSection.rowSettings = section.rowSettings.slice();
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
    if (typeof project.created !== 'number')
        valid = false;
    if (typeof project.modified !== 'number')
        valid = false;

    return valid;
}

export function browseForFile () {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', inputEvent => {
            if (inputEvent.target.files.length > 0) {
                const reader = new FileReader();
                reader.addEventListener('load', fileReaderEvent => {
                    let parsedProject, projectName;
                    try {
                        parsedProject = JSON.parse(fileReaderEvent.target.result);
                        projectName = fileReaderEvent.target.file.name.split('.');
                        if (projectName.length > 1)
                            projectName = projectName.slice(0, projectName.length - 1);
                        projectName = projectName.join('.');
            
                        resolve({project: parsedProject, projectName});
                    }
                    catch(e) {
                        console.error('Unable to load project - file is corrupt.');
                        reject();
                    }
                });
                reader.file = inputEvent.target.files[0];
                reader.readAsText(inputEvent.target.files[0]);
            }
        });
        input.click();
    });
}
