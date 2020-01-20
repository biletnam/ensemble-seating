import {v4 as uuid} from 'uuid';
import randomColor from 'randomcolor';
import { openDB } from 'idb';
import semver from 'semver/preload';
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
const PROJECT_FORMAT_VER = '0.16.0';

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

export function idbSetRosterScrollPosition (pos) {
    return currentDb.then(db => {
        const tx = db.transaction('env', 'readwrite');
        tx.objectStore('env').put(pos, 'rosterScrollPosition');
        return tx.complete;
    });
}

export function idbGetRosterScrollPosition () {
    return currentDb.then(db => {
        const tx = db.transaction('env', 'readonly');
        return tx.objectStore('env').get('rosterScrollPosition');
    })
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
 * @param {[string,Region|Section|Member]} a 
 * @param {[string,Region|Section|Member]} b 
 * @returns {number}
 */
export function byOrder(a, b) {
    if (a[1].order < b[1].order) {
        return -1;
    }
    else if (a[1].order > b[1].order) {
        return 1;
    }
    else {
        return 0;
    }
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


/**
 * 
 * @param {Section} oldSection 
 * @param {Section} newSection 
 * @returns {boolean}
 */
function sectionRowSettingsChanged(oldSection, newSection) {
    return JSON.stringify(oldSection.rowSettings) !== JSON.stringify(newSection.rowSettings);
}

/* Project edits */
/**
 * 
 * @param {*} user 
 * @param {Project} oldProject 
 * @param {Project} newProject 
 * @param {string} name 
 */
export function saveDiff(user, oldProject, newProject, name) {
    const promises = [];

    // 1. Regions
    const regionDiff = detailedDiff(oldProject.regions, newProject.regions);
    for (const [id, data] of Object.entries(regionDiff.added))
        promises.push(saveNewRegion(user, name, id, data));
    
    for (const region of Object.keys(regionDiff.deleted))
        promises.push(deleteRegionData(user, region));
    
    for (const [id, data] of Object.entries(regionDiff.updated))
        promises.push(saveRegionEdits(user, name, id, data));
    
    // 2. Sections
    // Check for any new sections and save them
    const oldSectionEntries = Object.entries(oldProject.sections || {});
    const newSectionEntries = Object.entries(newProject.sections || {});
    const addedSections = newSectionEntries.filter(
        ([newId, newData]) => !(oldSectionEntries.some(([oldId, oldData]) => newId === oldId))
    );
    for (const [id, data] of addedSections) {
        promises.push(saveNewSection(user, name, id, data));
    }

    // Section row settings cause some interesting issues when you do a deep diff.
    // For now, manually check section differences to see if an update is needed.
    for (const [id, data] of oldSectionEntries) {
        const updatedSection = newProject.sections[id];
        if (updatedSection) {
            if (sectionRowSettingsChanged(data, updatedSection)) {
                // Section row settings changed - do a full save, to avoid Firebase array corruption
                promises.push(saveNewSection(user, name, id, updatedSection));
            }
            else {
                if (JSON.stringify(data) !== JSON.stringify(updatedSection)) {
                    // Section changed - safe a diff
                    promises.push(saveSectionEdits(user, name, id, updatedSection));
                }
            }
        }
        else  {
            // Section was deleted
            promises.push(deleteSectionData(user, id));
        }
    }

    // 3. Members
    const memberDiff = detailedDiff(oldProject.members, newProject.members);
    for (const [id, data] of Object.entries(memberDiff.added))
        promises.push(saveNewMember(user, name, id, data));

    for (const member of Object.keys(memberDiff.deleted))
        promises.push(deleteMemberData(user, member));

    for (const [id, data] of Object.entries(memberDiff.updated))
        promises.push(saveMemberEdits(user, name, id, data));

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

function saveNewRegion(user, projectName, id, regionData) {
    return firebase.database().ref(`regionData/${user.uid}/${id}`).set(
        Object.assign({}, regionData, { projectName })
    );
}

function saveNewSection(user, projectName, id, sectionData) {
    return firebase.database().ref(`sectionData/${user.uid}/${id}`).set(
        Object.assign({}, sectionData, { projectName })
    );
}

function saveNewMember(user, projectName, id, memberData) {
    return firebase.database().ref(`memberData/${user.uid}/${id}`).set(
        Object.assign({}, memberData, { projectName })
    );
}

function saveRegionEdits(user, projectName, id, regionData) {
    return firebase.database().ref(`regionData/${user.uid}/${id}`).update(
        Object.assign({}, regionData, { projectName })
    );
}

function saveSectionEdits(user, projectName, id, sectionData) {
    return firebase.database().ref(`sectionData/${user.uid}/${id}`).update(
        Object.assign({}, sectionData, { projectName })
    );
}

function saveMemberEdits(user, projectName, id, memberData) {
    return firebase.database().ref(`memberData/${user.uid}/${id}`).update(
        Object.assign({}, memberData, { projectName })
    );
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
                    const projectToSave = Project.fromObject(existingProject);

                    
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
                db.ref(`regionData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value'),
                db.ref(`sectionData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value'),
                db.ref(`memberData/${user.uid}`).orderByChild('projectName').equalTo(name).once('value')
            ]).then(async result => {
                // New loading code
                const settings = result[0].val();

                if (settings) {
                    const appVersion = settings.appVersion;
                    const created = settings.created;
                    let modified = settings.modified;
                    delete settings.appVersion;
                    delete settings.created;
                    delete settings.modified;

                    const regionData = result[1].val() || {};
                    const sectionData = result[2].val() || {};
                    const memberData = result[3].val() || {};

                    let regions, sections, members;

                    if (semver.lt(appVersion, '0.16.0')) {
                        // Arrays of regions, sections, and members
                        const itemOrders = await Promise.all([
                            db.ref(`regions/${user.uid}/${name}`).once('value'),
                            db.ref(`sections/${user.uid}/${name}`).once('value'),
                            db.ref(`members/${user.uid}/${name}`).once('value'),
                        ]);

                        const regionOrder = itemOrders[0].val() || [];
                        const sectionOrder = itemOrders[1].val() || [];
                        const memberOrder = itemOrders[2].val() || [];
                        regions = [];
                        sections = [];
                        members = [];

                        for (let i=0; i<regionOrder.length; i++) {
                            const id = regionOrder[i];
                            regions.push(Object.assign({}, regionData[id], { id }));
                        }
                        for (let i=0; i<sectionOrder.length; i++) {
                            const id = sectionOrder[i];
                            sections.push(Object.assign({}, sectionData[id], { id }));
                        }
                        for (let i=0; i<memberOrder.length; i++) {
                            const id = memberOrder[i];
                            members.push(Object.assign({}, memberData[id], { id }));
                        }
                    }
                    else {
                        /**
                         * @type Array<Region>
                         */
                        regions = Object.entries(regionData).reduce((prev, [id, data]) => {
                            prev[id] = Region.fromObject(data);
                            return prev;
                        }, {});

                        /**
                         * @type Array<Section>
                         */
                        sections = Object.entries(sectionData).reduce((prev, [id, data]) => {
                            prev[id] = Section.fromObject(data);
                            return prev;
                        }, {});

                        /**
                         * @type Array<Member>
                         */
                        members = Object.entries(memberData).reduce((prev, [id, data]) => {
                            prev[id] = Member.fromObject(data);
                            return prev;
                        }, {});
                    }

                    // Upgrade project format if necessary
                    const upgradedProject = Project.upgrade({
                        settings,
                        regions,
                        sections,
                        members,
                        appVersion,
                        created,
                        modified
                    });

                    if (semver.lt(appVersion, upgradedProject.appVersion)) {
                        // If the project was upgraded, do a full save
                        upgradedProject.modified = await saveDiff(user, {}, upgradedProject, name);
                        cleanDbFromProjectUpgrade(user, name, upgradedProject.appVersion);
                    }                    
    
                    resolve(Project.fromObject(upgradedProject));
                }
                else
                    resolve(null);
            });
        }
        else
            reject(new Error('Unable to load project: user is not authenticated'));
    })
}

function cleanDbFromProjectUpgrade(user, name, version) {
    return new Promise((resolve, reject) => {
        if (semver.lte(version, '0.16.0')) {
            // Delete region, section, and member orders
            resolve(Promise.all([
                db.ref(`regions/${user.uid}/${name}`).remove(),
                db.ref(`sections/${user.uid}/${name}`).remove(),
                db.ref(`members/${user.uid}/${name}`).remove()
            ]));
        }
        else {
            resolve();
        }
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
            const db = firebase.database();
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
         * @type {Object<string, Region>}
         * An array of Regions in the project
         */
        this.regions = {};

        /**
         * @type {Object<string, Section>}
         * An array of Sections in the project
         */
        this.sections = {};

        /**
         * @type {Object<string, Member>}
         * An array of Members in the project
         */
        this.members = {};

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
        const template = Project.fromTemplate(templateId);
        const templateRegions = Object.values(template.regions);
        const templateSections = Object.values(template.sections);
        const templateMembers = Object.values(template.members);

        const projectRegions = Object.values(project.regions);
        const projectSections = Object.values(project.sections);
        const projectMembers = Object.values(project.members);

        return (
            template.appVersion === project.appVersion
            && JSON.stringify(templateRegions) === JSON.stringify(projectRegions)
            && JSON.stringify(templateSections) === JSON.stringify(projectSections)
            && JSON.stringify(templateMembers) === JSON.stringify(projectMembers)
            && JSON.stringify(template.settings) === JSON.stringify(project.settings)
        );
    }

    /**
     * Upgrades the given project object to the latest Project version.
     * @param {Object} project 
     * @returns {Project}
     */
    static upgrade (project) {
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
        if (semver.lt(finalProject.appVersion, '0.16.0')) {
            finalProject.appVersion = '0.16.0';
            finalProject.regions = finalProject.regions.reduce((regions, curr, index) => {
                const {id, ...rest} = curr;
                regions[id] = Region.fromObject({ ...rest, order: index });
                return regions;
            }, {});

            const sectionMappings = {};
            finalProject.sections = finalProject.sections.reduce((sections, curr) => {
                const {id, ...rest} = curr;
                sectionMappings[rest.region] = sectionMappings[rest.region] || 0;
                sections[id] = Section.fromObject({ ...rest, order: sectionMappings[rest.region] });
                sectionMappings[rest.region]++;
                return sections;
            }, {});

            const memberMappings = {};
            finalProject.members = finalProject.members.reduce((members, curr, index) => {
                const {id, ...rest} = curr;
                memberMappings[rest.section] = memberMappings[rest.section] || 0;
                members[id] = Member.fromObject({ ...rest, order: memberMappings[rest.section] });
                memberMappings[rest.section]++;
                return members;
            }, {});
        }
    
        return finalProject;
    }
    
    /**
     * Generates a Project object from the given JavaScript object, maintaining entity IDs in the process.
     * @param {Object} obj
     * @returns {Project}
     */
    static fromObject (source) {
        /** @type {Project} */
        const obj = JSON.parse(JSON.stringify(source));
        const project = new Project();
        
        project.regions = Object.entries(obj.regions).reduce((regions, [id, data]) => {
            regions[id] = Region.fromObject(data);
            return regions;
        }, {});
        
        project.sections = Object.entries(obj.sections).reduce((sections, [id, data]) => {
            sections[id] = Section.fromObject(data);
            return sections;
        }, {});

        project.members = Object.entries(obj.members).reduce((members, [id, data]) => {
            members[id] = Member.fromObject(data);
            return members;
        }, {});
        
        Object.assign(project.settings, obj.settings);
        project.created = source.created;
        project.modified = Date.now();
        
        return project;
    }

    /**
     * 
     * @param {string} templateId
     * @returns {Project}
     */
    static fromTemplate (templateId = 'blank') {
        const currentTime = Date.now();
        return Project.clone(
            Object.assign(
                {}, templates.find(template => template.id === templateId).data,
                {
                    appVersion: PROJECT_FORMAT_VER,
                    created: currentTime,
                    modified: currentTime
                }
            )
        );
    }

    /**
     * @param {Project} oldProject
     * @returns {Project}
     */
    static clone (oldProject) {
        const project = Project.fromObject(oldProject);
        
        // Update regions
        project.regions = Object.fromEntries(Object.entries(project.regions).map(([regionId, regionData]) => {
            const newId = uuid();
            Object.entries(project.sections).filter(([,section]) => section.region === regionId).forEach(([sectionId, sectionData]) => {
                project.sections[sectionId] = Section.fromObject(Object.assign(
                    {}, sectionData, { region: newId }
                ));
            });
            return [newId, regionData];
        }));

        // Update sections
        project.sections = Object.fromEntries(Object.entries(project.sections).map(([sectionId, sectionData]) => {
            const newId = uuid();
            Object.entries(project.members).filter(([,member]) => member.section === sectionId).forEach(([memberId, memberData]) => {
                project.members[memberId] = Member.fromObject(Object.assign(
                    {}, memberData, { section: newId }
                ));
            });
            return [newId, sectionData];
        }));

        // Update members
        project.members = Object.fromEntries(Object.entries(project.members).map(([,memberData]) => {
            return [uuid(), memberData];
        }));

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
         * @type {boolean}
         */
        this.curvedLayout = true;

        /**
         * @type {number}
         */
        this.angle = 180;

        /**
         * @type {number}
         */
        this.order = -1;
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

        /**
         * @type {number}
         */
        this.order = -1;
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
        this.section = sectionId;

        /**
         * @type {string}
         */
        this.notes = '';

        /**
         * @type {number}
         */
        this.order = -1;
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
    const regions = Object.fromEntries(
        Object.entries(project.regions).filter(region => region[0] !== regionId)
    );
    const sections = Object.fromEntries(
        Object.entries(project.sections).filter(section => section[1].region !== regionId)
    );
    const members = Object.fromEntries(
        Object.entries(project.members).filter(
            member => Object.keys(sections).some(sectionId => sectionId === member[1].section)
        )
    );

    return Project.fromObject(Object.assign({}, project, {regions, sections, members}));
}

/**
 * Given a section ID and project, returns a new copy of the project with the section removed
 * @param {string} sectionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function deleteSection(sectionId, project) {
    const sections = Object.fromEntries(
        Object.entries(project.sections).filter(section => section[0] !== sectionId)
    );
    const members = Object.fromEntries(
        Object.entries(project.members).filter(member => member[1].section !== sectionId)
    );

    return Project.fromObject(Object.assign({}, project, {sections, members}));
}

/**
 * Given a member ID and project, returns a new copy of the project with the member removed
 * @param {string} memberId 
 * @param {Project} project 
 * @returns {Project}
 */
export function deleteMember(memberId, project) {
    const members = Object.fromEntries(
        Object.entries(project.members).filter(member => member[0] !== memberId)
    );
    return Project.fromObject(Object.assign({}, project, {members}));
}

/**
 * 
 * @param {Object<string, Member>} members 
 * @param {number} startingIndex 
 * @returns {number}
 */
function findUnoccupiedIndex(members, startingIndex) {
    let result = startingIndex,
        found = false,
        occupied = Object.values(members).map(member => member.order);
    while (!found) {
        if (occupied.indexOf(result) === -1) {
            found = true;
        }
        else {
            result++;
        }
    }
    return result;
}

/**
 * Given a list of names, a section ID, and a project, returns a new copy of the project with the members added
 * @param {Array<string>} names 
 * @param {string} sectionId 
 * @param {number} startingIndex
 * @param {Project} project 
 * @returns {Project}
 */
export function batchAddMembers(names, sectionId, startingIndex, project) {
    const members = Object.assign({}, project.members);

    let currentIndex = startingIndex;
    for (let i=0; i<names.length; i++) {
        // Starting at startingIndex, find an unoccupied slot
        const membersInSection = Object.fromEntries(
            Object.entries(members)
                .filter(([memberId, memberData]) => memberData.section === sectionId)
        );
        currentIndex = findUnoccupiedIndex(membersInSection, currentIndex);
        members[uuid()] = Object.assign(
            new Member(names[i] ? names[i] : undefined, sectionId), { order: currentIndex }
        );
        currentIndex++;
    }
    
    // Make sure there are enough rows for the last seat in this section
    const lastMemberIndex = Math.max(...Object.values(members)
        .filter(member => member.section === sectionId)
        .map(member => member.order));

    /** @type {Object<string, Section>} */
    const newSections = JSON.parse(JSON.stringify(project.sections));
    const rowSettings = newSections[sectionId].rowSettings;
    const numberOfSeats = rowSettings.reduce((a, b) => a + b, 0);

    if (lastMemberIndex >= numberOfSeats) {
        const lastRowLength = rowSettings[rowSettings.length - 1] || DEFAULT_SECTION_ROW_LENGTH;
        const seatsNeeded = (lastMemberIndex + 1) - numberOfSeats;
        const rowsNeeded = Math.ceil(seatsNeeded / lastRowLength);

        for (let i=0; i<rowsNeeded; i++) {
            newSections[sectionId].rowSettings.push(lastRowLength);
        }
    }
    
    return Project.fromObject(Object.assign({}, project, { 
        members,
        sections: newSections
    }));
}

/**
 * Given a region ID, an array index, and a project, returns a new copy of the project with the region moved to the given index
 * @param {string} regionId 
 * @param {number} index 
 * @param {Project} project 
 * @returns {Project}
 */
export function moveRegionToIndex(regionId, index, project) {
    const regions = Object.entries(project.regions).sort(byOrder);
    const indexOfRegion = regions.findIndex(current => current[0] === regionId);

    const [removed] = regions.splice(indexOfRegion, 1);
    regions.splice(index, 0, removed);

    // Re-order regions
    for (let i=0; i<regions.length; i++) {
        regions[i][1] = Region.fromObject(
            Object.assign({}, regions[i][1], { order: i })
        );
    }

    return Project.fromObject(
        Object.assign({}, project, { regions: Object.fromEntries(regions) })
    );
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
    const startRegion = project.sections[sectionId].region;
    const startOrder = project.sections[sectionId].order;

    const sectionEntries = Object.entries(project.sections).sort(byOrder);
    const entriesInStartRegion = sectionEntries.filter(([id, data]) => data.region === startRegion);
    const entriesInDestinationRegion = sectionEntries.filter(([id, data]) => data.region === regionId);

    const [removed] = entriesInStartRegion.splice(startOrder, 1);

    if (startRegion === regionId) {
        // Moving within the same region
        entriesInStartRegion.splice(index, 0, removed);
        for (let i=0; i<entriesInStartRegion.length; i++) {
            entriesInStartRegion[i][1] = Section.fromObject(
                Object.assign({}, entriesInStartRegion[i][1], { order: i })
            );
        }
    }
    else {
        // Moving to a different region
        // Update sections in the same region
        entriesInDestinationRegion.splice(index, 0, removed);

        for (let i=0; i<entriesInStartRegion.length; i++) {
            entriesInStartRegion[i][1] = Section.fromObject(
                Object.assign({}, entriesInStartRegion[i][1], { order: i })
            );
        }
        for (let i=0; i<entriesInDestinationRegion.length; i++) {
            entriesInDestinationRegion[i][1] = Section.fromObject(
                Object.assign({}, entriesInDestinationRegion[i][1], { order: i, region: regionId })
            );
        }
    }

    const updatedSections = Object.assign(
        {},
        project.sections,
        Object.fromEntries(entriesInStartRegion),
        Object.fromEntries(entriesInDestinationRegion)
    );

    return Project.fromObject(
        Object.assign({}, project, { sections: updatedSections })
    );
}

/**
 * 
 * @param {Array<[string, Member]>} entries 
 */
function padSectionWithEmptySeats (acc, current) {
    acc[current[1].order] = current;
    return acc;
}

function removeEmpties (val) {
    return val != undefined;
}

/**
 * Given a member ID, a section ID, an array index, and a project, returns a new copy of the project with the member moved to the given index in the specified section
 * @param {string} memberId 
 * @param {string} sectionId 
 * @param {number} index 
 * @param {Project} project 
 */
export function moveMemberToSection(memberId, sectionId, index, project) {
    const startSection = project.members[memberId].section;
    const startOrder = project.members[memberId].order;

    const memberEntries = Object.entries(project.members).sort(byOrder);
    const entriesInStartSection = memberEntries.filter(([id, data]) => data.section === startSection)
        .reduce(padSectionWithEmptySeats, []);
    const entriesInDestinationSection = memberEntries.filter(([id, data]) => data.section === sectionId)
        .reduce(padSectionWithEmptySeats, []);

    const [removed] = entriesInStartSection.splice(startOrder, 1);

    if (startSection === sectionId) {
        // Moving within the same section
        entriesInStartSection.splice(index, 0, removed);
        for (let i=0; i<entriesInStartSection.length; i++) {
            if (entriesInStartSection[i] != undefined) {
                entriesInStartSection[i][1] = Member.fromObject(
                    Object.assign({}, entriesInStartSection[i][1], { 
                        order: entriesInStartSection[i][0] == memberId ? index : i
                    })
                );
            }
        }
    }
    else {
        entriesInDestinationSection.splice(index, 0, removed);

        for (let i=0; i<entriesInStartSection.length; i++) {
            if (entriesInStartSection[i] != undefined) {
                entriesInStartSection[i][1] = Member.fromObject(
                    Object.assign({}, entriesInStartSection[i][1], { 
                        order: entriesInStartSection[i][0] == memberId ? index : i
                    })
                );
            }
        }

        for (let i=0; i<entriesInDestinationSection.length; i++) {
            if (entriesInDestinationSection[i] != undefined) {
                entriesInDestinationSection[i][1] = Member.fromObject(
                    Object.assign({}, entriesInDestinationSection[i][1], { 
                        order: entriesInDestinationSection[i][0] == memberId ? index : i,
                        section: sectionId 
                    })
                );
            }
        }
    }

    const updatedMembers = Object.assign(
        {},
        project.members,
        Object.fromEntries(entriesInStartSection.filter(removeEmpties)),
        Object.fromEntries(entriesInDestinationSection.filter(removeEmpties))
    );

    return Project.fromObject(Object.assign({}, project, { members: updatedMembers }));
}

/**
 * Given a project, returns a copy of the project with a new blank region added to it
 * @param {Project} project 
 * @returns {Project}
 */
export function addNewRegion(project) {
    const regionEntries = Object.entries(project.regions);
    regionEntries.unshift([uuid(), new Region()]);
    for (let i=0; i<regionEntries.length; i++) {
        regionEntries[i][1] = Region.fromObject(
            Object.assign({}, regionEntries[i][1], { order: i })
        );
    }
    return Project.fromObject(
        Object.assign({}, project, { regions: Object.fromEntries(regionEntries) })
    );
}

/**
 * Given a region ID and a project, returns a copy of the project with a new blank section added to the specified region
 * @param {string} regionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function addNewSection(regionId, project) {
    const sectionEntries = Object.entries(project.sections);
    const sectionCount = sectionEntries.filter(([sectionId, section]) => section.region === regionId).length;
    sectionEntries.push([
        uuid(),
        Section.fromObject({ order: sectionCount, region: regionId })
    ]);
    return Project.fromObject(
        Object.assign({}, project, { sections: Object.fromEntries(sectionEntries) })
    );
}

/**
 * Given a region ID, region data, and a project, returns a copy of the project with the data merged into the region with the given ID
 * @param {string} regionId 
 * @param {Region} data 
 * @param {Project} project 
 * @returns {Project}
 */
export function applyRegionEdits(regionId, data, project) {
    const regions = Object.assign({}, project.regions);
    regions[regionId] = Region.fromObject(
        Object.assign({}, regions[regionId], data)
    );
    return Project.fromObject(Object.assign({}, project, { regions }));
}

/**
 * Given a section ID, section data, and a project, returns a copy of the project with the data merged into the section with the given ID
 * @param {string} sectionId 
 * @param {Section} data 
 * @param {Project} project 
 * @returns {Project}
 */
export function applySectionEdits(sectionId, data, project) {
    const sections = Object.assign({}, project.sections);
    sections[sectionId] = Section.fromObject(
        Object.assign({}, sections[sectionId], data)
    );
    return Project.fromObject(Object.assign({}, project, { sections }));
}

/**
 * Given a member ID, member data, and a project, returns a copy of the project with the data merged into the member with the given ID
 * @param {string} memberId 
 * @param {Member} data 
 * @param {Project} project 
 * @returns {Project}
 */
export function applyMemberEdits(memberId, data, project) {
    const members = Object.assign({}, project.members);
    members[memberId] = Member.fromObject(
        Object.assign({}, members[memberId], data)
    );
    return Project.fromObject(Object.assign({}, project, { members }));
}

/**
 * Given a section ID and a project, returns a copy of the project with the section's members shuffled into a new, randomized order
 * @param {string} sectionId 
 * @param {Project} project 
 * @returns {Project}
 */
export function shuffleSection(sectionId, project) {
    const membersToShuffle = Object.entries(project.members)
        .filter(([id, data]) => data.section === sectionId);

    const occupiedSlots = membersToShuffle.map(([id, data]) => data.order);
        
    /** @type {Array<[string, Member]>} */
    const shuffledMembers = knuthShuffle(membersToShuffle);

    const newMembers = Object.assign({}, project.members);
    for (let i=0; i<shuffledMembers.length; i++) {
        const [memberId, memberData] = shuffledMembers[i];
        newMembers[memberId] = Member.fromObject(
            Object.assign({}, memberData, { order: occupiedSlots[i] })
        );
    }

    return Project.fromObject(
        Object.assign({}, project, { members: newMembers })
    );
}

export async function exportProjectFile(projectName = 'Untitled project', projectForExport, options) {
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
