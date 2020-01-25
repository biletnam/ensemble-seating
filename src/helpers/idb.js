import { openDB } from 'idb';

const PROJECTS_KEY = 'projects';
const DB_NAME = 'ensemble-db';
const DB_VER = 2;

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
