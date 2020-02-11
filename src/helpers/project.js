import {v4 as uuid} from 'uuid';
import { knuthShuffle } from 'knuth-shuffle';
import { Project, Region, Section, Member } from '../types';

/** 
 * @param {[string,Region|Section|Member]} a 
 * @param {[string,Region|Section|Member]} b 
 * @returns {number}
 */
export function sortByOrder(a, b) {
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

export const DEFAULT_SECTION_ROW_LENGTH = 2;

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
    const regions = Object.entries(project.regions).sort(sortByOrder);
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

    const sectionEntries = Object.entries(project.sections).sort(sortByOrder);
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
    const oldMember = project.members[memberId];
    const newMember = Object.assign({}, oldMember, { section: sectionId, order: index, x: 0, y: 0 });
    const updatedMembers = JSON.parse(JSON.stringify(project.members));
    updatedMembers[memberId] = newMember;
    return Project.fromObject(Object.assign({}, project, { members: updatedMembers }));
}

/**
 * Given a member IDs, returns a new copy of the project with the member moved to the given absolute X and Y coordinates.
 * @param {string} memberId 
 * @param {number} x 
 * @param {number} y 
 * @param {Project} project 
 */
export function moveMemberToCoordinates(memberId, x, y, project) {
    const oldMember = project.members[memberId];
    const newMember = Object.assign({}, oldMember, {x, y, order: -1});
    const updatedMembers = JSON.parse(JSON.stringify(project.members));
    updatedMembers[memberId] = newMember;
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
