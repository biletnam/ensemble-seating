import {v4 as uuid} from 'uuid';
import randomColor from 'randomcolor';
import { openDB } from 'idb';
import semver from 'semver';
import firebase, { auth, provider } from './firebase-helpers.js';
import {templates} from '../templates/index.js';
import { knuthShuffle } from 'knuth-shuffle';
import { detailedDiff, updatedDiff, addedDiff } from 'deep-object-diff';
import { renderImage, renderSVG } from './stage-helpers.js';
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

function orderChanged(oldItems, newItems) {
    return JSON.stringify(oldItems.map(item => item.id)) !== JSON.stringify(newItems.map(item => item.id));
}

function reduceById(items) {
    return items.reduce((acc, current) => {
        const {id, ...rest} = current;
        acc[id] = rest;
        return acc;
    }, {});
}

function getSettings(project, updateDateModified) {
    return Object.assign({}, project.settings || {}, {
        appVersion: project.appVersion || undefined,
        created: project.created || undefined,
        modified: updateDateModified ? Date.now() : project.modified || undefined
    });
}

/* Project edits */
export function saveDiff(user, oldProject, newProject, name) {
    const promises = [];

    // 1. Regions
    const regionDiff = detailedDiff(reduceById(oldProject.regions || []), reduceById(newProject.regions));
    for (const region of Object.entries(regionDiff.added))
        promises.push(saveNewRegion(user, name, region[0], region[1]));
    
    for (const region of Object.keys(regionDiff.deleted))
        promises.push(deleteRegionData(user, region));
    
    for (const region of Object.entries(regionDiff.updated))
        promises.push(saveRegionEdits(user, name, region[0], region[1]));
    
    if (orderChanged(oldProject.regions || [], newProject.regions))
        promises.push(saveRegionOrder(user, name, newProject.regions.map(region => region.id)));

    // 2. Sections
    const sectionDiff = detailedDiff(reduceById(oldProject.sections || []), reduceById(newProject.sections));
    for (const section of Object.entries(sectionDiff.added))
        promises.push(saveNewSection(user, name, section[0], section[1]));
    
    for (const section of Object.keys(sectionDiff.deleted))
        promises.push(deleteSectionData(user, section));
    
    for (const section of Object.entries(sectionDiff.updated))
        promises.push(saveSectionEdits(user, name, section[0], section[1]));
    
    if (orderChanged(oldProject.sections || [], newProject.sections))
        promises.push(saveSectionOrder(user, name, newProject.sections.map(section => section.id)));

    // 3. Members
    const memberDiff = detailedDiff(reduceById(oldProject.members || []), reduceById(newProject.members));
    for (const member of Object.entries(memberDiff.added))
        promises.push(saveNewMember(user, name, member[0], member[1]));

    for (const member of Object.keys(memberDiff.deleted))
        promises.push(deleteMemberData(user, member));

    for (const member of Object.entries(memberDiff.updated))
        promises.push(saveMemberEdits(user, name, member[0], member[1]));

    if (orderChanged(oldProject.members || [], newProject.members))
        promises.push(saveMemberOrder(user, name, newProject.members.map(member => member.id)));

    // 4. Settings & metadata
    const oldSettings = getSettings(oldProject);
    const newSettings = getSettings(newProject, true);
    const settingsDiff = Object.assign({}, updatedDiff(oldSettings, newSettings), addedDiff(oldSettings, newSettings));
    promises.push(saveMetadata(user, name, settingsDiff));

    return promises.length > 0 ? Promise.all(promises).then(() => newSettings.modified) : Promise.resolve(newSettings.modified);
}

function saveMetadata(user, name, metadata) {
    return firebase.database().ref(`projects/${user.uid}/${name}`).update(metadata);
}

function saveRegionOrder(user, projectName, regions) {
    return firebase.database().ref(`regions/${user.uid}/${projectName}`).set(regions);
}

function saveSectionOrder(user, projectName, sections) {
    return firebase.database().ref(`sections/${user.uid}/${projectName}`).set(sections);
}

function saveMemberOrder(user, projectName, members) {
    return firebase.database().ref(`members/${user.uid}/${projectName}`).set(members);
}

function saveNewRegion(user, projectName, id, regionData) {
    regionData.projectName = projectName;
    return firebase.database().ref(`regionData/${user.uid}/${id}`).set(regionData);
}

function saveNewSection(user, projectName, id, sectionData) {
    sectionData.projectName = projectName;
    return firebase.database().ref(`sectionData/${user.uid}/${id}`).set(sectionData);
}

function saveNewMember(user, projectName, id, memberData) {
    memberData.projectName = projectName;
    return firebase.database().ref(`memberData/${user.uid}/${id}`).set(memberData);
}

function saveRegionEdits(user, projectName, id, regionData) {
    regionData.projectName = projectName;
    return firebase.database().ref(`regionData/${user.uid}/${id}`).update(regionData);
}

function saveSectionEdits(user, projectName, id, sectionData) {
    sectionData.projectName = projectName;
    return firebase.database().ref(`sectionData/${user.uid}/${id}`).update(sectionData);
}

function saveMemberEdits(user, projectName, id, memberData) {
    memberData.projectName = projectName;
    return firebase.database().ref(`memberData/${user.uid}/${id}`).update(memberData);
}

export function projectExists(user, projectName) {
    return new Promise((resolve, reject) => {
        const db = firebase.database();
        db.ref(`projects/${user.uid}/${projectName}`).once('value').then(snapshot => {
            resolve(snapshot.exists());
        }).catch(reject);
    });
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

                    
                    saveDiff(user, {}, projectToSave, newName).then(saveTime => {
                        deleteProject(user, oldName).then(() => {
                            resolve(saveTime);
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
                        if (!Array.isArray(data.rowSettings)) {
                            // Todo: clean up or remove this in a future refactoring when the project format is fixed
                            data.rowSettings = Object.values(data.rowSettings);
                        }
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

export function isRegion (obj) {
    return JSON.stringify(Object.keys(obj).sort()) == JSON.stringify(Object.keys(createRegion()).sort());
}

export function isSection (obj) {
    return JSON.stringify(Object.keys(obj).sort()) == JSON.stringify(Object.keys(createSection()).sort());
}

export function isMember (obj) {
    return JSON.stringify(Object.keys(obj).sort()) == JSON.stringify(Object.keys(createPerson()).sort());
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

// Given a region ID and project, returns a new copy of the project with the region removed
export function deleteRegion(regionId, project) {
    const regions = project.regions.filter(region => region.id !== regionId);
    const sections = project.sections.filter(section => section.region !== regionId);
    const members = project.members.filter(member => sections.some(section => section.id === member.section));

    return Object.assign({}, project, {regions, sections, members})
}

// Given a section ID and project, returns a new copy of the project with the section removed
export function deleteSection(sectionId, project) {
    const sections = project.sections.filter(section => section.id !== sectionId);
    const members = project.members.filter(member => member.section !== sectionId);

    return Object.assign({}, project, {sections, members})
}

// Given a member ID and project, returns a new copy of the project with the member removed
export function deleteMember(memberId, project) {
    const members = project.members.filter(member => member.id !== memberId);
    return Object.assign({}, project, {members});
}

// Given a list of names, a section ID, and a project, returns a new copy of the project with the members added
export function batchAddMembers(names, sectionId, project) {
    const members = project.members.concat(names.map(name => createPerson(name ? name : undefined, sectionId)));
    return Object.assign({}, project, { members });
}

export function moveRegionToIndex(regionId, index, project) {
    const regions = project.regions.slice();
    const indexOfRegion = regions.findIndex(current => current.id === regionId);

    const [removed] = regions.splice(indexOfRegion, 1);
    regions.splice(index, 0, removed);

    return Object.assign({}, project, {regions});
}

export function moveSectionToRegion(sectionId, regionId, index, project) {
    // Group sections by region
    const sectionsByRegion = project.regions.reduce((acc, region) => {
        acc[region.id] = project.sections.filter(section => section.region === region.id);
        return acc;
    }, {});

    const sourceRegion = project.sections.find(section => section.id === sectionId).region;

    // Find and remove the section
    const sourceIndex = sectionsByRegion[sourceRegion].findIndex(section => section.id === sectionId);
    const [removed] = sectionsByRegion[sourceRegion].splice(sourceIndex, 1);

    // Insert the section at the new position and set the state
    removed.region = regionId;
    sectionsByRegion[regionId].splice(index, 0, removed);
    const sections = Object.values(sectionsByRegion).reduce((acc, val) => acc.concat(val), []);

    return Object.assign({}, project, {sections});
}

export function moveMemberToSection(memberId, sectionId, index, project) {
    // Remove and clone the member who is moving
    const removed = Object.assign({}, project.members.find(member => member.id === memberId), {section: sectionId});

    // Remove all section members for the destination
    const destinationSectionMembers = project.members.filter(member => member.id !== memberId && member.section === sectionId);

    // Get remaining members
    const members = project.members.filter(member => member.id !== memberId && member.section !== sectionId);

    // Insert in the new location
    destinationSectionMembers.splice(index, 0, removed);

    // Reinsert the removed section and set the state
    members.push(...destinationSectionMembers);

    return Object.assign({}, project, {members});
}

export function addNewRegion(project) {
    const regions = [createRegion(), ...project.regions];
    return Object.assign({}, project, {regions});
}

export function addNewSection(regionId, project) {
    const sections = project.sections.slice();
    const regions = project.regions.slice();

    let newSection, newRegion;

    newSection = createSection();
    sections.push(newSection);
    if (regions.length === 0) {
        // There are no regions. Create one and assign the new section to it.
        newRegion = createRegion();
        regions.push(newRegion);
        sections[sections.length - 1].region = regions[regions.length - 1].id;
    }
    else {
        // Assign the section to the given region; otherwise, assign it to the first region
        sections[sections.length - 1].region = regionId || regions[0].id;
    }

    return Object.assign({}, project, {sections: sections, regions: regions});
}

export function applyRegionEdits(regionId, data, project) {
    const regions = project.regions.slice();

    const originalData = regions.find(region => region.id === regionId);
    const updatedRegion = Object.assign({}, originalData, data);
    const indexOfRegion = regions.indexOf(originalData);
    regions.splice(indexOfRegion, 1, updatedRegion);

    return Object.assign({}, project, {regions});
}

export function applySectionEdits(sectionId, data, project) {
    const sections = project.sections.slice();

    const originalData = sections.find(section => section.id === sectionId);
    const indexOfSection = sections.indexOf(originalData);
    const updatedSection = Object.assign({}, originalData, data);
    sections.splice(indexOfSection, 1, updatedSection);

    return Object.assign({}, project, {sections});
}

export function applyMemberEdits(memberId, data, project) {
    const members = project.members.slice();
        
    const originalData = members.find(member => member.id === memberId);
    const indexOfMember = members.indexOf(originalData);
    const updatedMember = Object.assign({}, originalData, data);
    members.splice(indexOfMember, 1, updatedMember);

    return Object.assign({}, project, {members});
}

export function shuffleSection(sectionId, project) {
    const membersToShuffle = project.members.filter(member => member.section === sectionId);
    const existingMembers = project.members.filter(member => member.section !== sectionId);

    existingMembers.push(...knuthShuffle(membersToShuffle));

    return Object.assign({}, project, {members: existingMembers});
}

export async function exportProjectFile(projectName, projectForExport, options) {
    const regions = projectForExport.regions;
    const sections = projectForExport.sections;
    const members = projectForExport.members;
    const settings = Object.assign({}, options, projectForExport.settings);

    let result = null,
        mime = null,
        extension = null;

    if (options.format == 'project') {
        result = JSON.stringify(projectForExport);
        mime = 'text/json';
        extension = 'json';
    }
    else {
        if (options.format == 'svg') {
            const svg = renderSVG(regions, sections, members, settings);
            result = svg.outerHTML;
            mime = 'image/svg+xml;charset=utf-8';
            extension = 'svg';
        }
        else {
            result = await renderImage(regions, sections, members, settings);
            if (options.format == 'jpeg') {
                mime = 'image/jpeg';
                extension = 'jpg';
            }
            else {
                mime = 'image/png';
                extension = 'png';
            }
        }
    }

    // Export the data
    const download = document.createElement('a');
    download.download = `${projectName}.${extension}`;

    if (options.format === 'svg' || options.format === 'project') {
        const blob = new Blob([result], {type: mime});
        download.href = URL.createObjectURL(blob);
    }
    else
        download.href = result instanceof Blob ? URL.createObjectURL(result) : result;

    document.body.appendChild(download);
    download.click();
    document.body.removeChild(download);

    if (options.format === 'svg' || options.format === 'project')
        URL.revokeObjectURL(download.href);
}
