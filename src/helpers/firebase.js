import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import semver from 'semver/preload';
import { detailedDiff, updatedDiff, addedDiff } from 'deep-object-diff';

import { Project, Region, Section, Member } from  '../types';

// Initialize Firebase
const config = {
    apiKey: "AIzaSyAUCAYvc1OmnSYWXsnSzEnZetjQINrkHO8",
    authDomain: "ensemble-seating.firebaseapp.com",
    databaseURL: "https://ensemble-seating.firebaseio.com",
    projectId: "ensemble-seating",
    storageBucket: "ensemble-seating.appspot.com",
    messagingSenderId: "30759784773"
};
firebase.initializeApp(config);

const DEFAULT_NAME = 'Untitled';

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();

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
