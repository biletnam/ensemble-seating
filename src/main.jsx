import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Workbox } from 'workbox-window';

import SeatingRenderer from './components/render-seating.jsx';
import MenuDrawer from './components/menu-drawer.jsx';
import MainToolbar from './components/toolbar.jsx';
import SectionsList from './components/sections-list.jsx';
import NewProjectDialog from './components/new-project-dialog.jsx';
import EditDialog from './components/edit-dialog.jsx';
import RegionEditor from './components/edit-region.jsx';
import SectionEditor from './components/edit-section.jsx';
import MemberEditor from './components/edit-member.jsx';
import BatchAddMembersDialog from './components/batch-add-members.jsx';
import ProjectSettingsDialog from './components/project-settings-dialog.jsx';
import firebase, { auth, provider } from './helpers/firebase-helpers.js';

import { SimpleDialog } from '@rmwc/dialog';
import { Snackbar, SnackbarAction } from '@rmwc/snackbar';

import '@material/dialog/dist/mdc.dialog.css';
import '@material/snackbar/dist/mdc.snackbar.css';

import {
    saveProject,
    saveMetadata,
    saveRegionOrder,
    saveSectionOrder,
    saveMemberOrder,
    saveNewRegion,
    saveNewSection,
    saveNewMember,
    saveRegionEdits,
    saveSectionEdits,
    saveMemberEdits,
    loadProject,
    deleteProject,
    deleteRegionData,
    deleteSectionData,
    deleteMemberData,
    projectNeedsUpgrade,
    upgradeProject,
    updateProjectQueryString,
    resetProjectQueryString,
    getUnusedProjectName,
    createRegion,
    createSection,
    createPerson,
    createEmptyProject,
    renameProject,
    validateProject,
    listProjects,
    cloneRegion,
    cloneSection,
    clonePerson
} from './helpers/project-helpers.js';

import './main.css';

function createFreshState(user) {
    return {
        deleteRegionId: null,
        deleteRegionName: null,
        deleteRegionAffectedSections: [],
        deleteRegionDialogOpen: false,
        deleteSectionId: null,
        deleteSectionName: null,
        deleteSectionDialogOpen: false,
        deleteMemberId: null,
        deleteMemberName: null,
        deleteMemberDialogOpen: false,
        batchAddSectionId: null,
        batchAddSectionName: null,
        batchAddDialogOpen: false,
        editRegionDialogOpen: false,
        editSectionDialogOpen: false,
        editMemberDialogOpen: false,
        projectOptionsDialogOpen: false,
        newProjectDialogOpen: false,
        drawerOpen: false,
        rosterOpen: true,
        editorId: null,
        project: null,
        needFullSave: false,
        initProject: false,
        projectName: null,
        message: null,
        updateAvailable: false,
        user
    }
}

function hideLoadingScreen() {
    document.querySelector("#loading-cover").setAttribute("hidden", "hidden");
}

class App extends Component {
    constructor(props) {
        super(props);

        this.worker = null;
        this.firstLaunch = true;

        this.state = createFreshState();
        this.state.project = createEmptyProject();

        this.handleUserTriggeredUpdate = this.handleUserTriggeredUpdate.bind(this);
        this.saveSession = this.saveSession.bind(this);
        this.fullSaveIfNeeded = this.fullSaveIfNeeded.bind(this);
        this.deleteSection = this.deleteSection.bind(this);
        this.deleteMember = this.deleteMember.bind(this);
        this.batchAddMembers = this.batchAddMembers.bind(this);
        this.deleteProject = this.deleteProject.bind(this);
        this.handleClickedToolbarButton = this.handleClickedToolbarButton.bind(this);
        this.handleClickedNewSectionButton = this.handleClickedNewSectionButton.bind(this);
        this.handleRequestedNewPerson = this.handleRequestedNewPerson.bind(this);
        this.handleRequestedDeleteRegion = this.handleRequestedDeleteRegion.bind(this);
        this.handleRequestedDeleteSection = this.handleRequestedDeleteSection.bind(this);
        this.handleRequestedDeleteMember = this.handleRequestedDeleteMember.bind(this);
        this.handleRequestedMoveRegion = this.handleRequestedMoveRegion.bind(this);
        this.handleRequestedEditRegion = this.handleRequestedEditRegion.bind(this);
        this.handleRequestedEditSection = this.handleRequestedEditSection.bind(this);
        this.handleRequestedSelectMember = this.handleRequestedSelectMember.bind(this);
        this.handleRequestedEditMember = this.handleRequestedEditMember.bind(this);
        this.handleRequestedBatchAddMembers = this.handleRequestedBatchAddMembers.bind(this);
        this.handleAcceptedBatchAdd = this.handleAcceptedBatchAdd.bind(this);
        this.handleChangeProjectSetting = this.handleChangeProjectSetting.bind(this);
        this.handleSectionsListDragEnd = this.handleSectionsListDragEnd.bind(this);
        
        this.handleRequestPrint = this.handleRequestPrint.bind(this);
        this.handleRequestNewProject = this.handleRequestNewProject.bind(this);
        this.handleRequestImportProject = this.handleRequestImportProject.bind(this);
        this.handleRequestExportProject = this.handleRequestExportProject.bind(this);
        this.handleRequestOpenProject = this.handleRequestOpenProject.bind(this);
        this.handleAcceptRenameProject = this.handleAcceptRenameProject.bind(this);
        this.handleAcceptDeleteProject = this.handleAcceptDeleteProject.bind(this);

        this.handleToggleRoster = this.handleToggleRoster.bind(this);

        // Dialogs
        this.handleNewProjectDialogClosed = this.handleNewProjectDialogClosed.bind(this);
        this.handleSelectNewProjectTemplate = this.handleSelectNewProjectTemplate.bind(this);
        this.handleDeleteRegionDialogClosed = this.handleDeleteRegionDialogClosed.bind(this);
        this.handleDeleteSectionDialogClosed = this.handleDeleteSectionDialogClosed.bind(this);
        this.handleDeleteMemberDialogClosed = this.handleDeleteMemberDialogClosed.bind(this);
        this.handleAcceptRegionEdits = this.handleAcceptRegionEdits.bind(this);
        this.handleAcceptSectionEdits = this.handleAcceptSectionEdits.bind(this);
        this.handleAcceptMemberEdits = this.handleAcceptMemberEdits.bind(this);

        // Dialog close event listeners
        this.handleRequestCloseMenuDrawer = this.handleRequestCloseMenuDrawer.bind(this);
        this.handleRequestCancelRegionEditDialog = this.handleRequestCancelRegionEditDialog.bind(this);
        this.handleRequestCancelSectionEditDialog = this.handleRequestCancelSectionEditDialog.bind(this);
        this.handleRequestCancelMemberEditDialog = this.handleRequestCancelMemberEditDialog.bind(this);
        this.handleRequestCancelBatchAddDialog = this.handleRequestCancelBatchAddDialog.bind(this);
        this.handleRequestCloseProjectSettingsDialog = this.handleRequestCloseProjectSettingsDialog.bind(this);

        // Auth
        this.handleRequestLogin = this.handleRequestLogin.bind(this);
        this.handleRequestLogout = this.handleRequestLogout.bind(this);
        this.handleAuthStateChanged = this.handleAuthStateChanged.bind(this);

        // Check to see if the user is logged in before trying to load projects
        auth.onAuthStateChanged(this.handleAuthStateChanged);
    }

    componentDidMount() {
        // Register service worker and listen for updates
        if ('serviceWorker' in navigator) {
            this.worker = new Workbox('/service-worker.js');
        
            this.worker.addEventListener('waiting', event => {
                this.setState({updateAvailable: true});
            });
        
            this.worker.register();
        }
    }

    handleUserTriggeredUpdate() {
        this.worker.addEventListener('controlling', event => {
            window.location.reload();
        });

        this.worker.messageSW({ type: 'SKIP_WAITING' });
    }

    initFirstLaunch(user) {
        // Todo: if the user is already logged in, restore settings and open project (if there is one in the query string)

        const urlParams = new URLSearchParams(location.search);
        const nameParam = urlParams.get('project');

        let initProject;
        if (nameParam)
           initProject = decodeURIComponent(nameParam);

        if (user) {
            listProjects(user).then(projects => {
                // If project exists, open it
                if (projects.indexOf(initProject) !== -1) {
                    loadProject(user, initProject).then(project => {
                        if (project) {
                            const newState = {
                                project: Object.assign({}, project),
                                projectName: initProject,
                                user
                            }
                            if (projectNeedsUpgrade(project))
                            newState.project = upgradeProject(project);
                            this.setState(newState, () => {
                                updateProjectQueryString(newState.projectName, user);
                                hideLoadingScreen();
                            });
                        }
                    });
                }

                // Otherwise, create fresh project and schedule save for next interaction
                else {
                    getUnusedProjectName(user).then(projectName => {
                        this.setState({
                            projectName,
                            user,
                            needFullSave: true
                        }, () => {
                            resetProjectQueryString();
                            hideLoadingScreen();
                        });
                    });
                }
            });
        }
        else {
            // Not logged in. Create fresh project (app launches with fresh project)
            resetProjectQueryString();
            hideLoadingScreen();
        }
    }

    handleAuthStateChanged(user) {
        console.log(`User is logged ${user ? 'in' : 'out'}.`);

        if (this.firstLaunch) {
            this.firstLaunch = false;
            this.initFirstLaunch(user);
        }
        else {
            // App is already running. User logged in or out.
            this.setState({user}, () => {
                if (user) {
                    // User logs in; has a "fresh" (unmodified, just started) project
                    if (JSON.stringify(this.state.project) === JSON.stringify(createEmptyProject())) {
                        listProjects(user).then(cloudProjects => {
                            // Load project if it already exists
                            if (cloudProjects.indexOf(this.state.projectName) !== -1) {
                                this.handleRequestOpenProject(this.state.projectName);
                            }
                            
                            // Schedule save for the next interaction
                            else {
                                this.setState({needFullSave: true});
                            }
                        });
                    }

                    else {
                        // Project is not fresh. Generate fresh name and immediately save
                        getUnusedProjectName(user).then(name => {
                            this.setState(Object.assign({},
                                createFreshState(this.state.user),
                                {
                                    project: this.state.project,
                                    projectName: name
                                }
                            ), this.saveSession);
                        });
                    }
                }
                else {
                    // User has logged out
                    this.handleSelectNewProjectTemplate();
                }
            });
            
        }
    }

    saveSession() {
        if (this.state.user)
            saveProject(this.state.user, this.state.project, this.state.projectName)
    }

    fullSaveIfNeeded() {
        if (this.state.user && this.state.needFullSave) {
            this.setState({needFullSave: false}, () =>{
                this.saveSession();
            });
        }
    }

    deleteRegion() {
        const regionId = this.state.deleteRegionId;
        
        const regions = this.state.project.regions.filter(current => current.id !== regionId);
        const sections = this.state.project.sections.filter(current => current.region !== regionId);
        const sectionsToRemove = this.state.project.sections.filter(current => current.region === regionId);
        const members = this.state.project.members.filter(current => sections.some(currentSection => currentSection.id === current.section));
        const membersToRemove = this.state.project.members.filter(current => sectionsToRemove.some(currentSection => currentSection.id === current.section));
        this.setState({
            project: Object.assign({}, this.state.project, {regions, sections, members}),
            editorId: null,
            deleteRegionName: null,
            deleteRegionId: null,
            deleteRegionAffectedSections: [],
            deleteRegionDialogOpen: false
        }, () => {
            if (this.state.user) {
                saveRegionOrder(this.state.user, this.state.projectName, regions.map(current => current.id));
                saveSectionOrder(this.state.user, this.state.projectName, sections.map(current => current.id));
                saveMemberOrder(this.state.user, this.state.projectName, members.map(current => current.id));
    
                deleteRegionData(this.state.user, regionId);
                for (let i=0; i<sectionsToRemove.length; i++) {
                    deleteSectionData(this.state.user, sectionsToRemove[i].id);
                }
                for (let i=0; i<membersToRemove.length; i++) {
                    deleteMemberData(this.state.user, membersToRemove[i].id);
                }

                this.fullSaveIfNeeded();
            }
        });
    }

    deleteSection() {
        const sectionId = this.state.deleteSectionId;
        const sections = this.state.project.sections.filter(currentSection => currentSection.id !== sectionId);
        const members = this.state.project.members.filter(currentMember => currentMember.section !== sectionId);
        const membersToRemove = this.state.project.members.filter(currentMember => currentMember.section === sectionId);
        this.setState({
            project: Object.assign({}, this.state.project, {sections, members}),
            editorId: null,
            deleteSectionName: null,
            deleteSectionId: null,
            deleteSectionDialogOpen: false
        }, () => {
            if (this.state.user) {
                saveSectionOrder(this.state.user, this.state.projectName, sections.map(current => current.id));
                saveMemberOrder(this.state.user, this.state.projectName, members.map(current => current.id));
    
                deleteSectionData(this.state.user, sectionId);
                for (let i=0; i<membersToRemove.length; i++) {
                    deleteMemberData(this.state.user, membersToRemove[i].id);
                }

                this.fullSaveIfNeeded()
            }
        });
    }

    deleteMember() {
        const memberId = this.state.deleteMemberId;
        const members = this.state.project.members.filter(current => current.id !== memberId);
        this.setState({
            project: Object.assign({}, this.state.project, {members}),
            editorId: null,
            deleteSectionName: null,
            deleteMemberName: null,
            deleteMemberId: null,
            deleteMemberDialogOpen: false
        }, () => {
            if (this.state.user) {
                saveMemberOrder(this.state.user, this.state.projectName, members.map(current => current.id));
                deleteMemberData(this.state.user, memberId);

                this.fullSaveIfNeeded();
            }
        });
    }

    batchAddMembers(memberNames, sectionId) {
        const newMembers = memberNames.map(current => createPerson(current ? current : undefined, sectionId));
        
        this.setState(Object.assign({}, {
            project: Object.assign({}, this.state.project, {
                members: this.state.project.members.slice().concat(newMembers)
            }),
            editorId: newMembers[newMembers.length - 1].id,
            batchAddDialogOpen: false
        }), () => {
            if (this.state.user) {
                saveMemberOrder(this.state.user, this.state.projectName, this.state.project.members.map(current => current.id));
                
                for (let i=0; i<newMembers.length; i++) {
                    saveNewMember(this.state.user, this.state.projectName, newMembers[i]);
                }

                this.fullSaveIfNeeded();
            }
        });
    }

    moveMemberToSection(memberId, sectionId, index) {
        // Remove and clone the member who is moving
        const removed = Object.assign({}, this.state.project.members.find(currentMember => currentMember.id === memberId), {section: sectionId});

        // Remove all section members for the destination
        const destinationSectionMembers = this.state.project.members.filter(currentMember => currentMember.id !== memberId && currentMember.section === sectionId);

        // Get remaining members
        const members = this.state.project.members.filter(currentMember => currentMember.id !== memberId && currentMember.section !== sectionId);

        // Insert in the new location
        destinationSectionMembers.splice(index, 0, removed);

        // Reinsert the removed section and set the state
        members.push(...destinationSectionMembers);
        this.setState({
            project: Object.assign({}, this.state.project, {members})
        }, () => {
            if (this.state.user) {
                saveMemberOrder(this.state.user, this.state.projectName, this.state.project.members.map(current => current.id));
                saveMemberEdits(this.state.user, this.state.projectName, {section: sectionId});

                this.fullSaveIfNeeded();
            }
        });
    }

    moveRegionToIndex(regionId, destinationIndex) {
        const regions = this.state.project.regions.slice();
        const indexOfRegion = regions.findIndex(current => current.id === regionId);

        const [removed] = regions.splice(indexOfRegion, 1);
        regions.splice(destinationIndex, 0, removed);

        this.setState({
            project: Object.assign({}, this.state.project, {regions})
        }, () => {
            if (this.state.user) {
                saveRegionOrder(this.state.user, this.state.projectName, this.state.project.regions.map(current => current.id));

                this.fullSaveIfNeeded();
            }
        });
    }

    moveSectionToIndex(sectionId, destinationId, destinationIndex) {
        // Group sections by region
        const sectionsByRegion = this.state.project.regions.reduce((acc, region) => {
            acc[region.id] = this.state.project.sections.filter(section => section.region === region.id);
            return acc;
        }, {});

        const sourceRegion = this.state.project.sections.find(currentSection => currentSection.id === sectionId).region;

        // Find and remove the section
        const sourceIndex = sectionsByRegion[sourceRegion].findIndex(currentSection => currentSection.id === sectionId);
        const [removed] = sectionsByRegion[sourceRegion].splice(sourceIndex, 1);

        // Insert the section at the new position and set the state
        removed.region = destinationId;
        sectionsByRegion[destinationId].splice(destinationIndex, 0, removed);
        const sections = Object.values(sectionsByRegion).reduce((acc, val) => acc.concat(val), []);

        this.setState({
            project: Object.assign({}, this.state.project, {sections})
        }, () => {
            if (this.state.user) {
                saveSectionOrder(this.state.user, this.state.projectName, this.state.project.sections.map(current => current.id));
                saveSectionEdits(this.state.user, this.state.projectName, {region: destinationId});

                this.fullSaveIfNeeded();
            }
        });
    }

    createNewRegion() {
        const regions = this.state.project.regions.slice();
        const newRegion = createRegion();
        regions.unshift(newRegion);

        this.setState(Object.assign({}, {
            project: Object.assign({}, this.state.project, {regions})
        }), () => {
            if (this.state.user) {
                saveRegionOrder(this.state.user, this.state.projectName, this.state.project.regions.map(current => current.id));
                saveNewRegion(this.state.user, this.state.projectName, newRegion);

                this.fullSaveIfNeeded();
            }
        });
    }

    deleteProject() {
        deleteProject(this.state.user, this.state.projectName).then(() => {
            getUnusedProjectName(this.state.user).then(name => {
                const newState = Object.assign({}, createFreshState(this.state.user), {
                    project: createEmptyProject(),
                    projectName: name,
                    needFullSave: true
                })
        
                this.setState(newState, () => {
                    resetProjectQueryString();
                });
            });
        });
    }

    handleClickedToolbarButton(event) {
        const newState = {};
        let saveNeeded = false;
        if (event.target.name === 'sort') {
            newState.project = Object.assign({}, this.state.project);
            newState.project.settings = Object.assign({}, this.state.project.settings);
            newState.project.settings.downstageTop = !this.state.project.settings.downstageTop;
            saveNeeded = true;
        }

        if (event.target.name === 'menu') {
            newState.drawerOpen = true;
        }

        if (event.target.name === 'region') {
            this.createNewRegion();
        }

        if (event.target.name === 'project-settings') {
            newState.projectOptionsDialogOpen = true;
        }
        this.setState(newState, () => {
            if (this.state.user && saveNeeded) {
                saveMetadata(this.state.user, this.state.projectName, Object.assign({},
                    this.state.project.settings,
                    {appVersion: this.state.project.appVersion}
                ));
            }
        });
    }

    handleClickedNewSectionButton(regionId) {
        const sections = this.state.project.sections.slice();
        const regions = this.state.project.regions.slice();

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

        this.setState(Object.assign({}, {
            project: Object.assign({}, this.state.project, {sections: sections, regions: regions}),
            editorId: sections[sections.length - 1].id
        }), () => {
            if (this.state.user) {
                saveSectionOrder(this.state.user, this.state.projectName, this.state.project.sections.map(current => current.id));
                saveNewSection(this.state.user, this.state.projectName, newSection);
                if (newRegion)
                    saveNewRegion(this.state.user, this.state.projectName, newRegion);

                this.fullSaveIfNeeded();
            }
        });
    }

    handleRequestedNewPerson(sectionId) {
        this.batchAddMembers([null], sectionId);
    }

    handleRequestedBatchAddMembers(sectionId) {
        const requestedSection = this.state.project.sections.find(current => current.id === sectionId);
        this.setState({
            editorId: sectionId,
            batchAddSectionId: sectionId,
            batchAddSectionName: requestedSection.name,
            batchAddDialogOpen: true
        });
    }

    handleAcceptedBatchAdd(members) {
        this.batchAddMembers(members, this.state.batchAddSectionId);
    }

    handleChangeProjectSetting(newSetting) {
        const newSettings = Object.assign({}, this.state.project.settings, newSetting);
        this.setState({
            project: Object.assign({}, this.state.project, {settings: newSettings})
        }, () => {
            if (this.state.user) {
                saveMetadata(this.state.user, this.state.projectName, Object.assign({},
                    this.state.project.settings,
                    {appVersion: this.state.project.appVersion}
                ));

                this.fullSaveIfNeeded();
            }
        });
    }

    handleRequestedDeleteRegion(regionId) {
        const requestedRegion = this.state.project.regions.find(current => current.id === regionId);
        const affectedSections = this.state.project.sections.filter(current => current.region === regionId);
        this.setState({
            editorId: regionId,
            deleteRegionId: regionId,
            deleteRegionName: requestedRegion.name,
            deleteRegionAffectedSections: affectedSections.slice(),
            deleteRegionDialogOpen: true
        });
    }

    handleRequestedDeleteSection(sectionId) {
        const requestedSection = this.state.project.sections.find(current => current.id === sectionId);
        this.setState({
            editorId: sectionId,
            deleteSectionId: sectionId,
            deleteSectionName: requestedSection.name,
            deleteSectionDialogOpen: true
        });
    }

    handleRequestedDeleteMember(memberId) {
        const requestedMember = this.state.project.members.find(current => current.id === memberId);
        const memberSection = this.state.project.sections.find(current => current.id === requestedMember.section);
        this.setState({
            editorId: memberId,
            deleteMemberId: memberId,
            deleteMemberName: requestedMember.name,
            deleteMemberDialogOpen: true,
            deleteSectionName: memberSection.name
        })
    }

    handleRequestedEditRegion(regionId) {
        this.setState({
            editRegionDialogOpen: true,
            editorId: regionId
        })
    }

    handleRequestedMoveRegion(regionId, direction) {
        const currentIndex = this.state.project.regions.findIndex(current => current.id === regionId);
        let destinationIndex = currentIndex;

        switch (direction) {
            case 'top':
                destinationIndex = 0;
                break;
            case 'up':
                if (destinationIndex > 0)
                    destinationIndex--;
                break;
            case 'down':
                if (destinationIndex < this.state.project.regions.length - 1)
                    destinationIndex++;
                break;
            case 'bottom':
                destinationIndex = this.state.project.regions.length - 1;
                break;
        }

        this.moveRegionToIndex(regionId, destinationIndex);
    }

    handleRequestedEditSection(sectionId) {
        this.setState({
            editSectionDialogOpen: true,
            editorId: sectionId
        })
    }

    handleRequestedSelectMember(memberId) {
        this.setState({
            editorId: memberId
        })
    }

    handleRequestedEditMember(memberId) {
        this.setState({
            editMemberDialogOpen: true,
            editorId: memberId
        });
    }

    /* DRAG AND DROP */

    handleSectionsListDragEnd(result) {
        if (result.destination) {
            const itemId = result.draggableId;
            const destinationId = result.destination.droppableId;
            const destinationIndex = result.destination.index;

            if (result.type === 'member')
                this.moveMemberToSection(itemId, destinationId, destinationIndex);
            else if (result.type === 'section') {
                this.moveSectionToIndex(itemId, destinationId, destinationIndex);
            }
        }
    }

    /* MAIN MENU */

    handleRequestPrint() {
        this.setState({drawerOpen: false}, () => {
            window.print();
        });
    }

    handleRequestNewProject() {
        this.setState({drawerOpen: false, newProjectDialogOpen: true});
    }

    handleRequestImportProject(project, name) {
        if (validateProject(project)) {
            const newState = Object.assign({},
                createFreshState(this.state.user),
                {
                    project: Object.assign({}, project),
                    projectName: name,
                    user: this.state.user
                }
            );

            if (this.state.user) {
                listProjects(this.state.user).then(existingProjects => {
                    if (existingProjects.indexOf(name) === -1) {
                        // No name conflict: go ahead with import.
                        this.setState(newState, this.saveSession);
                    }
                    else {
                        // Name conflict. Generate new name.
                        getUnusedProjectName(this.state.user, name).then(newName => {
                            newState.projectName = newName;
                            this.setState(newState, this.saveSession);
                        })
                    }
                });
            }
            else 
                this.setState(newState);
        }
        else {
            console.error(new Error('Unable to load project - invalid format.'));
        }
    }

    handleRequestExportProject() {
        const projectForExport = this.state.project;

        const blob = new Blob([JSON.stringify(projectForExport)], {type: 'text/json'});
        
        const download = document.createElement('a');
        download.download = `${this.state.projectName}.json`;
        download.href = URL.createObjectURL(blob);
        download.click();
        URL.revokeObjectURL(download.href);
    }

    handleRequestOpenProject(projectName) {
        loadProject(this.state.user, projectName).then(savedProject => {
            const newState = createFreshState(this.state.user);
            let upgradedProject = false;
            if (savedProject) {
                newState.project = Object.assign({}, savedProject);
                if (projectNeedsUpgrade(newState.project)) {
                    upgradedProject = true;
                    newState.project = upgradeProject(newState.project);
                }
            }
            newState.projectName = projectName;
            updateProjectQueryString(newState.projectName);
            this.setState(newState, upgradedProject ? this.saveSession : () => null);
        })        
    }

    handleToggleRoster(event) {
        this.setState({rosterOpen: !this.state.rosterOpen});
    }

    /* DIALOG EVENTS */
    handleNewProjectDialogClosed() {
        this.setState({newProjectDialogOpen: false});
    }

    handleSelectNewProjectTemplate(template) {
        const project = createEmptyProject(template);
        if (this.state.user) {
            getUnusedProjectName(this.state.user).then(name => {
                this.setState(Object.assign({},
                    createFreshState(this.state.user),
                    {
                        project,
                        projectName: name,
                        needFullSave: true
                    }
                ));
                resetProjectQueryString();
            });
        }
        else {
            this.setState(Object.assign({},
                createFreshState(this.state.user),
                {
                    project,
                    needFullSave: true
                }
            ));
            resetProjectQueryString();
        }
    }

    handleDeleteRegionDialogClosed(event) {
        if (event.detail.action === 'accept')
            this.deleteRegion();
        else
            this.setState({deleteRegionDialogOpen: false});
    }

    handleDeleteSectionDialogClosed(event) {
        console.log(event.detail.action);
        if (event.detail.action === 'accept')
            this.deleteSection();
        else
            this.setState({deleteSectionDialogOpen: false})
    }

    handleDeleteMemberDialogClosed(event) {
        console.log(event.detail.action);
        if (event.detail.action === 'accept')
            this.deleteMember();
        else
            this.setState({deleteMemberDialogOpen: false})
    }

    handleAcceptRegionEdits(regionId, data) {
        const newRegions = this.state.project.regions.slice();

        const originalData = newRegions.find(current => current.id === regionId);
        const updatedRegion = Object.assign({}, originalData, data);
        const indexOfRegion = newRegions.indexOf(originalData);
        newRegions.splice(indexOfRegion, 1, updatedRegion);

        this.setState({
            project: Object.assign({}, this.state.project, {
                regions: newRegions
            }),
            editRegionDialogOpen: false
        }, () => {
            if (this.state.user) {
                saveRegionEdits(this.state.user, this.state.projectName, updatedRegion);

                this.fullSaveIfNeeded();
            }
        });
    }

    handleAcceptSectionEdits(sectionId, data) {
        // Save changes
        const newSections = this.state.project.sections.slice();

        const originalData = newSections.find(current => current.id === sectionId);
        const indexOfSection = newSections.indexOf(originalData);
        const updatedSection = Object.assign({}, originalData, data);
        newSections.splice(indexOfSection, 1, updatedSection);

        this.setState({
            project: Object.assign({}, this.state.project, {
                sections: newSections
            }),
            editSectionDialogOpen: false
        }, () => {
            if (this.state.user) {
                saveSectionEdits(this.state.user, this.state.projectName, updatedSection);

                this.fullSaveIfNeeded();
            }
        });
    }

    handleAcceptMemberEdits (memberId, data) {
        // Save changes
        const newMembers = this.state.project.members.slice();
        
        const originalData = newMembers.find(current => current.id === memberId);
        const indexOfMember = newMembers.indexOf(originalData);
        const updatedMember = Object.assign({}, originalData, data);
        newMembers.splice(indexOfMember, 1, updatedMember);

        this.setState({
            project: Object.assign({}, this.state.project, {
                members: newMembers
            }),
            editMemberDialogOpen: false
        }, () => {
            if (this.state.user) {
                saveMemberEdits(this.state.user, this.state.projectName, updatedMember);

                this.fullSaveIfNeeded();
            }
        });
    }

    handleAcceptRenameProject (newName) {
        if (this.state.user) {
            const oldName = this.state.projectName;
            renameProject(this.state.user, oldName, newName).then(() => {
                this.setState({projectName: newName});
            }).catch((err) => {
                if (err.name === 'NotAuthenticatedError') {
                    // User is not authenticated. Swallow the error and keep the new name locally.
                    this.setState({
                        projectName: newName,
                        needFullSave: true
                    });
                }
                else if (err.name == 'NotFoundError') {
                    // Project with that name does not exist. Keep the new name, and do a full save.
                    this.setState({
                        projectName: newName,
                        needFullSave: true
                    }, () => {
                        this.fullSaveIfNeeded();
                    });
                }
                else if (err.name == 'NameCollisionError') {
                    // Project with that name already exists.
                    // Temporary logic: reset back to the original name
                    // Todo: resolve collision (notify user and/or generate unique name)
                    this.setState({projectName: newName}, () => {
                        this.setState({projectName: oldName, message: err.message});
                    });
                }
                else {
                    // Unknown error
                    console.error(err);
                }
            });
        }
        else
            this.setState({projectName: newName});
    }

    handleAcceptDeleteProject () {
        this.deleteProject();
    }

    /* DIALOG CLOSE EVENT LISTENERS */
    handleRequestCloseMenuDrawer() {
        this.setState({drawerOpen: false});
    }

    handleRequestCancelRegionEditDialog() {
        this.setState({editRegionDialogOpen: false})
    }

    handleRequestCancelSectionEditDialog() {
        this.setState({editSectionDialogOpen: false});
    }

    handleRequestCancelMemberEditDialog() {
        this.setState({editMemberDialogOpen: false});
    }

    handleRequestCancelBatchAddDialog() {
        this.setState({batchAddDialogOpen: false});
    }

    handleRequestCloseProjectSettingsDialog() {
        this.setState({projectOptionsDialogOpen: false});
    }

    // AUTH

    handleRequestLogin() {
        auth.signInWithPopup(provider).then(result => {
            const user = result.user;
            this.setState({user});
        });
    }

    handleRequestLogout() {
        auth.signOut().then(() => {
            this.setState({
                user: null
            });
        });
    }

    render() {
        return <React.Fragment>
            <MenuDrawer drawerOpen={this.state.drawerOpen}
                onClose={this.handleRequestCloseMenuDrawer}
                onRequestPrintProject={this.handleRequestPrint}
                onRequestNewProject={this.handleRequestNewProject}
                onRequestImportProject={this.handleRequestImportProject}
                onRequestExportProject={this.handleRequestExportProject}
                onRequestOpenProject={this.handleRequestOpenProject}
                onRequestDeleteProject={this.handleAcceptDeleteProject}
                onRequestLogin={this.handleRequestLogin}
                onRequestLogout={this.handleRequestLogout}
                projectName={this.state.projectName}
                user={this.state.user} />

            <MainToolbar id='rendering-toolbar'
                implicitSeatsVisible={this.state.project.settings.implicitSeatsVisible}
                downstageTop={this.state.project.settings.downstageTop}
                onRequestRenameProject={this.handleAcceptRenameProject}
                projectName={this.state.projectName}
                onToolbarButtonClick={this.handleClickedToolbarButton} />

            <SeatingRenderer id='rendering-area'
                project={this.state.project}
                regions={this.state.project.regions}
                sections={this.state.project.sections}
                members={this.state.project.members}
                settings={this.state.project.settings}
                editorId={this.state.editorId}
                expanded={!this.state.rosterOpen}
                onRequestSelectMember={this.handleRequestedSelectMember}
                onRequestNewSection={this.handleClickedNewSectionButton} />

            <SectionsList id='sections-list'
                editorId={this.state.editorId}
                sections={this.state.project.sections}
                members={this.state.project.members}
                regions={this.state.project.regions}
                expanded={this.state.rosterOpen}
                onToggleVisibility={this.handleToggleRoster}
                onRequestNewSection={this.handleClickedNewSectionButton}
                onDragEnd={this.handleSectionsListDragEnd}
                onRequestNewPerson={this.handleRequestedNewPerson}
                onRequestBatchAdd={this.handleRequestedBatchAddMembers}
                onRequestDeleteSection={this.handleRequestedDeleteSection}
                onRequestEditSection={this.handleRequestedEditSection}
                onRequestMoveRegion={this.handleRequestedMoveRegion}
                onRequestEditRegion={this.handleRequestedEditRegion}
                onRequestDeleteRegion={this.handleRequestedDeleteRegion}

                onRequestSelectMember={this.handleRequestedSelectMember}
                onRequestEditMember={this.handleRequestedEditMember}
                onRequestDeleteMember={this.handleRequestedDeleteMember} />

            <NewProjectDialog open={this.state.newProjectDialogOpen}
                onSelectTemplate={this.handleSelectNewProjectTemplate}
                onClose={this.handleNewProjectDialogClosed} />

            <SimpleDialog title={`Delete "${this.state.deleteRegionName}" region?`}
                body={<React.Fragment>
                    <p>This will also delete the following sections and all their section members:</p>
                    <ul>
                        {this.state.deleteRegionAffectedSections.map(current => <li key={current.id}>{current.name}</li>)}
                    </ul>
                </React.Fragment>}
                open={this.state.deleteRegionDialogOpen}
                onClose={this.handleDeleteRegionDialogClosed} />

            <SimpleDialog title={`Delete "${this.state.deleteSectionName}" section?`}
                body='This will also delete all section members.'
                open={this.state.deleteSectionDialogOpen}
                onClose={this.handleDeleteSectionDialogClosed} />
            
            <SimpleDialog title={`Delete ${this.state.deleteMemberName}?`}
                body={`This will remove them from the ${this.state.deleteSectionName} section.`}
                open={this.state.deleteMemberDialogOpen}
                onClose={this.handleDeleteMemberDialogClosed} />

            <EditDialog open={this.state.editRegionDialogOpen}
                title='Edit region'
                editor={RegionEditor}
                cloneFn={cloneRegion}
                data={this.state.project.regions.find(current => current.id === this.state.editorId)}
                onAccept={this.handleAcceptRegionEdits}
                onCancel={this.handleRequestCancelRegionEditDialog} />

            <EditDialog open={this.state.editSectionDialogOpen}
                title='Edit section'
                editor={SectionEditor}
                cloneFn={cloneSection}
                data={this.state.project.sections.find(current => current.id === this.state.editorId)}
                onAccept={this.handleAcceptSectionEdits}
                onCancel={this.handleRequestCancelSectionEditDialog} />

            <EditDialog open={this.state.editMemberDialogOpen}
                title='Edit section member'
                editor={MemberEditor}
                cloneFn={clonePerson}
                data={this.state.project.members.find(current => current.id === this.state.editorId)}
                onAccept={this.handleAcceptMemberEdits}
                onCancel={this.handleRequestCancelMemberEditDialog} />

            <BatchAddMembersDialog isOpen={this.state.batchAddDialogOpen}
                onClose={this.handleRequestCancelBatchAddDialog}
                onAddMembers={this.handleAcceptedBatchAdd}
                title={this.state.batchAddSectionName} />

            <ProjectSettingsDialog isOpen={this.state.projectOptionsDialogOpen}
                onClose={this.handleRequestCloseProjectSettingsDialog}
                onChange={this.handleChangeProjectSetting}
                {...this.state.project.settings} />

            <Snackbar open={this.state.message} onClose={() => {this.setState({message: null})}}
                message={this.state.message} />

            <Snackbar open={this.state.updateAvailable} onClose={event => this.setState({updateAvailable: false})}
                message={`A new version of ${APP_INFO.NAME} available`} timeout={24 * 60 * 60 * 1000}
                action={<SnackbarAction label='Reload' onClick={this.handleUserTriggeredUpdate} />} />
        </React.Fragment>
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
