import {v4 as uuid} from 'uuid';
import semver from 'semver/preload';
import * as templates from '../templates';
import { Region, Section, Member } from '.';

const PROJECT_FORMAT_VER = '0.16.0';

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
            // Previous versions of the app ordered regions from back to front;
            // starting at v0.16.0, they are ordered front to back
            finalProject.regions = finalProject.regions.slice().reverse().reduce((regions, curr, index) => {
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
                {}, templates[templateId].data,
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
