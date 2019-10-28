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
/**
 * Sets the current browser query string to the given project name
 * @param {string} name 
 */
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

/**
 * 
 * @param {Array<{id: string}>} oldItems 
 * @param {Array<{id: string}>} newItems 
 * @returns {boolean}
 */
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

/**
 * 
 * @param {Project} project 
 * @param {boolean} updateDateModified 
 * @returns {ProjectSettings}
 */
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

/**
 * 
 * @param {Project} project 
 * @returns {boolean}
 */
export function projectNeedsUpgrade(project) {
    return semver.lt(project.appVersion, PROJECT_FORMAT_VER);
}

/**
 * Given a project, returns a copy of the project that is upgraded to the most recent app version
 * @param {Project} project 
 * @returns {Project}
 */
export function upgradeProject(project) {
    // Parse as a plain object first since it might not be in the appropriate Project format
    let finalProject = JSON.parse(JSON.stringify(project));

    if (semver.lt(finalProject.appVersion, '0.2.0')) {
        finalProject.appVersion = '0.2.0';
        finalProject.regions = [new Region()];
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
            return Section.fromObject(Object.assign({}, currentSection, {
                offsetType: 'first-row',
                offsetValue: 0
            }));
        });
    }
    if (semver.lt(finalProject.appVersion, '0.8.0')) {
        finalProject.appVersion = '0.8.0';
        finalProject.regions = finalProject.regions.map(currentRegion => {
            return Region.fromObject(Object.assign({}, currentRegion, {
                angle: 180
            }));
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

    return Project.fromObject(finalProject);
}

/* Project info and stats */
/**
 * 
 * @param {*} user 
 * @param {string} name 
 * @returns {Promise<string>}
 */
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

/**
 * 
 * @param {*} user 
 * @param {string} name 
 * @returns {Promise<Project|Error>}
 */
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
                        return Region.fromObject(data);
                    });
    
                    const unpackedSections = sections.map(current => {
                        const data = Object.assign({id: current}, sectionData[current]);
                        delete data.projectName;
                        return Section.fromObject(data);
                    });
    
                    const unpackedMembers = members.map(current => {
                        const data = Object.assign({id: current}, memberData[current]);
                        delete data.projectName;
                        return Member.fromObject(data);
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

/**
 * 
 * @param {*} user 
 * @returns {Object.<string, ProjectSettings>}
 */
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

export const DEFAULT_SECTION_ROW_LENGTH = 2;

/**
 * @typedef {Object} ProjectSettings
 * @property {boolean} downstageTop If true, orients the seating chart so the audience is at the top
 * @property {boolean} implicitSeatsVisible If true, seats that were generated automatically will always be shown, even if they don't have a member
 * @property {number} seatGap The space, in pixels, by which to separate seats from row to row
 * @property {number} seatLabelFontSize The label font size, in pixels
 * @property {('initials'|'full')} seatNameLabels Render seat name labels as initials or full names
 * @property {number} seatSize The seat size, in pixels
 */

/**
 * Class representing a project
 */
export class Project {
    constructor () {
        /**
         * @type {string}
         * The version of the app in which the project was created
         */
        this.appVersion = PROJECT_FORMAT_VER;

        /**
         * @type {number}
         * The date the project was created
         */
        this.created = Date.now();

        /**
         * @type {number}
         * The date the project was last modified
         */
        this.modified = this.created;

        /**
         * @type {Array<Region>}
         * An array of Regions in the project
         */
        this.regions = [];

        /**
         * @type {Array<Section>}
         * An array of Sections in the project
         */
        this.sections = [];

        /**
         * @type {Array<Member>}
         * An array of Members in the project
         */
        this.members = [];

        /**
         * @type {ProjectSettings}
         * Settings to configure project display and behavior
         */
        this.settings = {
            seatNameLabels: 'initials',
            downstageTop: false,
            implicitSeatsVisible: false,
            seatGap: 1.0,
            seatSize: 32,
            seatLabelFontSize: 16
        };
    }

    /**
     * @param {Project} project
     * @param {Project} project
     * @param {string} templateId 
     * @returns {boolean}
     */
    static isTemplate(project, templateId = 'blank') {
        const empty = Project.fromTemplate(templateId);
        const emptyRegion = JSON.parse(JSON.stringify(empty.regions[0]));
        const projectRegion = JSON.parse(JSON.stringify(project.regions[0]));

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
    
    /**
     * @param {Object} obj
     * @returns {Project}
     */
    static fromObject (obj) {
        const project = new Project();
        
        project.regions = obj.regions.map(region => (
            Region.fromObject(region)
        ));

        project.sections = obj.sections.map(section => (
            Section.fromObject(section)
        ));

        project.members = obj.members.map(member => (
            Member.fromObject(member)
        ));
        
        Object.assign(project.settings, obj.settings);
        
        return project;
    }

    /**
     * 
     * @param {string} templateId
     * @returns {Project}
     */
    static fromTemplate (templateId = 'blank') {
        return Project.clone(templates.find(template => template.id === templateId).data);
    }

    /**
     * @param {Project} oldProject
     * @returns {Project}
     */
    static clone (oldProject) {
        const project = Project.fromObject(oldProject);
        
        // Update regions
        for (let i=0; i<project.regions.length; i++) {
            const newId = uuid();

            project.sections.filter(section => section.region === project.regions[i].id).forEach(section => {
                section.region = newId;
            });

            project.regions[i] = Region.fromObject(Object.assign({}, project.regions[i], {id: newId}));
        }

        // Update sections
        for (let i=0; i<project.sections; i++) {
            const newId = uuid();

            project.members.filter(member => member.section === project.sections[i].id).forEach(member => {
                member.section = newId;
            });

            project.sections[i] = Section.fromObject(Object.assign({}, project.sections[i], {id: newId}));
        }

        // Update members
        for (let i=0; i<project.members.length; i++) {
            const newId = uuid();
            project.members[i] = Member.fromObject(Object.assign({}, project.members[i], {id: newId}));
        }

        // Update any other metadata
        project.appVersion = PROJECT_FORMAT_VER;
        project.created = Date.now();
        project.modified = project.created;
        
        return project;
    }
}

export class Region {
    constructor (name = 'Untitled region') {
        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {string}
         */
        this.id = uuid();

        /**
         * @type {boolean}
         */
        this.curvedLayout = true;

        /**
         * @type {number}
         */
        this.angle = 180;
    }

    /**
     * @returns {Region}
     */
    static fromObject (obj) {
        return Object.assign(new Region(), obj);
    }
}

export class Section {
    constructor (name = 'Untitled', regionId = null) {
        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {string}
         */
        this.color = randomColor({luminosity: 'light'});

        /**
         * @type {string}
         */
        this.id = uuid();

        /**
         * @type {string}
         */
        this.region = regionId;

        /**
         * @type {('first-row'|'custom-row'|'last-row')}
         */
        this.offsetType = 'first-row';

        /**
         * @type {number}
         */
        this.offsetValue = 0;

        /**
         * @type {Array<number>}
         */
        this.rowSettings = [2, 4, 4];
    }

    /**
     * @returns {Section}
     */
    static fromObject (obj) {
        return Object.assign(new Section(), obj);
    }
}

export class Member {
    constructor (name = 'New person', sectionId = null) {
        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {string}
         */
        this.id = uuid();

        /**
         * @type {string}
         */
        this.section = sectionId;

        /**
         * @type {string}
         */
        this.notes = '';
    }

    /**
     * @returns {Member}
     */
    static fromObject (obj) {
        return Object.assign(new Member(), obj);
    }
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

/**
 * Given a region ID and project, returns a new copy of the project with the region removed
 * @param {string} regionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function deleteRegion(regionId, project) {
    const regions = project.regions.filter(region => region.id !== regionId);
    const sections = project.sections.filter(section => section.region !== regionId);
    const members = project.members.filter(member => sections.some(section => section.id === member.section));

    return Project.fromObject(Object.assign({}, project, {regions, sections, members}));
}

/**
 * Given a section ID and project, returns a new copy of the project with the section removed
 * @param {string} sectionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function deleteSection(sectionId, project) {
    const sections = project.sections.filter(section => section.id !== sectionId);
    const members = project.members.filter(member => member.section !== sectionId);

    return Project.fromObject(Object.assign({}, project, {sections, members}));
}

/**
 * Given a member ID and project, returns a new copy of the project with the member removed
 * @param {string} memberId 
 * @param {Project} project 
 * @returns {Project}
 */
export function deleteMember(memberId, project) {
    const members = project.members.filter(member => member.id !== memberId);
    return Project.fromObject(Object.assign({}, project, {members}));
}

/**
 * Given a list of names, a section ID, and a project, returns a new copy of the project with the members added
 * @param {Array<string>} names 
 * @param {string} sectionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function batchAddMembers(names, sectionId, project) {
    const members = project.members.concat(names.map(name => new Member(name ? name : undefined, sectionId)));
    return Project.fromObject(Object.assign({}, project, { members }));
}

/**
 * Given a region ID, an array index, and a project, returns a new copy of the project with the region moved to the given index
 * @param {string} regionId 
 * @param {number} index 
 * @param {Project} project 
 * @returns {Project}
 */
export function moveRegionToIndex(regionId, index, project) {
    const regions = project.regions.slice();
    const indexOfRegion = regions.findIndex(current => current.id === regionId);

    const [removed] = regions.splice(indexOfRegion, 1);
    regions.splice(index, 0, removed);

    return Project.fromObject(Object.assign({}, project, {regions}));
}

/**
 * Given a section ID, a region ID, an array index, and a project, returns a new copy of the project with the section moved to the given index in the specified region
 * @param {string} sectionId 
 * @param {string} regionId 
 * @param {number} index 
 * @param {Project} project 
 * @returns {Project}
 */
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

    return Project.fromObject(Object.assign({}, project, {sections}));
}

/**
 * Given a member ID, a section ID, an array index, and a project, returns a new copy of the project with the member moved to the given index in the specified section
 * @param {string} memberId 
 * @param {string} sectionId 
 * @param {number} index 
 * @param {Project} project 
 */
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

    return Project.fromObject(Object.assign({}, project, {members}));
}

/**
 * Given a project, returns a copy of the project with a new blank region added to it
 * @param {Project} project 
 * @returns {Project}
 */
export function addNewRegion(project) {
    const regions = [new Region(), ...project.regions];
    return Project.fromObject(Object.assign({}, project, {regions}));
}

/**
 * Given a region ID and a project, returns a copy of the project with a new blank section added to the specified region
 * @param {string} regionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function addNewSection(regionId, project) {
    const sections = project.sections.slice();
    const regions = project.regions.slice();

    sections.push(new Section());

    // Assign the section to the given region; otherwise, assign it to the first region
    sections[sections.length - 1].region = regionId || regions[0].id;

    return Project.fromObject(Object.assign({}, project, {sections: sections, regions: regions}));
}

/**
 * Given a region ID, region data, and a project, returns a copy of the project with the data merged into the region with the given ID
 * @param {string} regionId 
 * @param {Region} data 
 * @param {Project} project 
 * @returns {Project}
 */
export function applyRegionEdits(regionId, data, project) {
    const regions = project.regions.slice();

    const originalData = regions.find(region => region.id === regionId);
    const updatedRegion = Object.assign(new Region(), originalData, data);
    const indexOfRegion = regions.indexOf(originalData);
    regions.splice(indexOfRegion, 1, updatedRegion);

    return Project.fromObject(Object.assign({}, project, {regions}));
}

/**
 * Given a section ID, section data, and a project, returns a copy of the project with the data merged into the section with the given ID
 * @param {string} sectionId 
 * @param {Section} data 
 * @param {Project} project 
 * @returns {Project}
 */
export function applySectionEdits(sectionId, data, project) {
    const sections = project.sections.slice();

    const originalData = sections.find(section => section.id === sectionId);
    const indexOfSection = sections.indexOf(originalData);
    const updatedSection = Object.assign(new Section(), originalData, data);
    sections.splice(indexOfSection, 1, updatedSection);

    return Project.fromObject(Object.assign({}, project, {sections}));
}

/**
 * Given a member ID, member data, and a project, returns a copy of the project with the data merged into the member with the given ID
 * @param {string} memberId 
 * @param {Member} data 
 * @param {Project} project 
 * @returns {Project}
 */
export function applyMemberEdits(memberId, data, project) {
    const members = project.members.slice();
        
    const originalData = members.find(member => member.id === memberId);
    const indexOfMember = members.indexOf(originalData);
    const updatedMember = Object.assign(new Member(), originalData, data);
    members.splice(indexOfMember, 1, updatedMember);

    return Project.fromObject(Object.assign({}, project, {members}));
}

/**
 * Given a section ID and a project, returns a copy of the project with the section's members shuffled into a new, randomized order
 * @param {string} sectionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function shuffleSection(sectionId, project) {
    const membersToShuffle = project.members.filter(member => member.section === sectionId);
    const existingMembers = project.members.filter(member => member.section !== sectionId);

    existingMembers.push(...knuthShuffle(membersToShuffle));

    return Project.fromObject(Object.assign({}, project, {members: existingMembers}));
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
