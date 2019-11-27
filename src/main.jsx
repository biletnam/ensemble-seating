import 'array-flat-polyfill';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Workbox } from 'workbox-window';
import semver from 'semver';
import debounce from 'lodash.debounce';

import Stage from './components/stage.jsx';
import Drawer from './components/drawer.jsx';
import Toolbar from './components/toolbar.jsx';
import Editor from './components/editor.jsx'
import Roster from './components/roster.jsx';
import NewProjectDialog from './components/new-project-dialog.jsx';
import BatchAddMembersDialog from './components/batch-add-members.jsx';
import ProjectSettingsDialog from './components/project-settings-dialog.jsx';
import OpenProjectDialog from './components/open-project-dialog.jsx';
import { queue as dialogQueue } from './components/dialog-queue.jsx';
import { queue as snackbarQueue } from './components/snackbar-queue.jsx';
import firebase, { auth, provider } from './helpers/firebase-helpers.js';

import { DialogQueue } from '@rmwc/dialog';
import { Snackbar, SnackbarAction, SnackbarQueue } from '@rmwc/snackbar';

import '@material/dialog/dist/mdc.dialog.min.css';
import '@material/snackbar/dist/mdc.snackbar.min.css';

import {
    saveDiff,
    loadProject,
    deleteProject,
    projectNeedsUpgrade,
    upgradeProject,
    updateProjectQueryString,
    resetProjectQueryString,
    getUnusedProjectName,
    createProjectFromTemplate,
    renameProject,
    validateProject,
    listProjects,
    idbGetLastAppVersion,
    idbSetLastAppVersion,
    idbSaveTemporaryProject,
    idbLoadTemporaryProject,
    idbDeleteTemporaryProject,
    isBlankProject,
    duplicateProject,
    deleteRegion,
    deleteSection,
    deleteMember,
    batchAddMembers,
    moveRegionToIndex,
    moveSectionToRegion,
    moveMemberToSection,
    addNewRegion,
    addNewSection,
    applyRegionEdits,
    applySectionEdits,
    applyMemberEdits,
    shuffleSection,
    exportProjectFile,
    projectExists
} from './helpers/project-helpers.js';

import './main.css';
import { getLayoutDimensions, calculateSeatPositions } from './helpers/stage-helpers.js';

function createFreshState(user) {
    return {
        batchAddSectionId: null,
        batchAddSectionName: null,
        batchAddDialogOpen: false,
        projectOptionsDialogOpen: false,
        newProjectDialogOpen: false,
        showFirstLaunch: false,
        openProjectDialogOpen: false,
        drawerOpen: false,
        rosterOpen: true,
        editorId: null,
        project: null,
        initProject: false,
        projectName: null,
        saving: false,
        saved: false,
        message: null,
        updateAvailable: false,
        user
    }
}

function hideLoadingScreen() {
    document.querySelector("#loading-cover").hidden = true;
}

class App extends Component {
    constructor(props) {
        super(props);

        this.worker = null;
        this.firstLaunch = true;

        this.state = createFreshState();
        this.state.project = createProjectFromTemplate();

        this.handleUserTriggeredUpdate = this.handleUserTriggeredUpdate.bind(this);
        this.saveSession = debounce(this.saveSession.bind(this), 500, { leading: true, trailing: true });
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
        this.handleRequestedSelectMember = this.handleRequestedSelectMember.bind(this);
        this.handleRequestedBatchAddMembers = this.handleRequestedBatchAddMembers.bind(this);
        this.handleAcceptedBatchAdd = this.handleAcceptedBatchAdd.bind(this);
        this.handleRequestedShuffleSection = this.handleRequestedShuffleSection.bind(this);
        this.handleChangeProjectSetting = this.handleChangeProjectSetting.bind(this);
        this.handleSectionsListDragEnd = this.handleSectionsListDragEnd.bind(this);
        
        this.handleRequestNewProject = this.handleRequestNewProject.bind(this);
        this.handleRequestDuplicateProject = this.handleRequestDuplicateProject.bind(this);
        this.handleRequestImportProject = this.handleRequestImportProject.bind(this);
        this.handleRequestOpenProject = this.handleRequestOpenProject.bind(this);
        this.handleAcceptRenameProject = this.handleAcceptRenameProject.bind(this);
        
        // Dialogs
        this.handleSelectNewProjectTemplate = this.handleSelectNewProjectTemplate.bind(this);
        this.handleAcceptRegionEdits = this.handleAcceptRegionEdits.bind(this);
        this.handleAcceptSectionEdits = this.handleAcceptSectionEdits.bind(this);
        this.handleAcceptMemberEdits = this.handleAcceptMemberEdits.bind(this);

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

        if (this.state.user)
            this.worker.messageSW({ type: 'SKIP_WAITING' });
        else {
            // Save project to a temporary location to load after refresh
            idbSaveTemporaryProject(this.state.project).then(() => {
                this.worker.messageSW({ type: 'SKIP_WAITING' });
            });
        }
    }

    initFirstLaunch(user) {
        const urlParams = new URLSearchParams(location.search);
        const nameParam = urlParams.get('project');

        let initProject;
        if (nameParam)
           initProject = decodeURIComponent(nameParam);

        if (user) {
            listProjects(user).then(projects => {
                // If project exists, open it
                if (Object.keys(projects).indexOf(initProject) !== -1) {
                    loadProject(user, initProject).then(project => {
                        if (project) {
                            const newState = {
                                project: Object.assign({}, project),
                                projectName: initProject,
                                saved: true,
                                user
                            }
                            let upgradedProject = false;
                            if (projectNeedsUpgrade(project)) {
                                upgradedProject = true;
                                newState.project = upgradeProject(project);
                            }

                            if (upgradedProject)
                                this.saveSession(project, newState.project)

                            this.setState(newState, () => {
                                updateProjectQueryString(newState.projectName, user);
                                hideLoadingScreen();
                            });
                        }
                    });
                }

                // Otherwise, show first launch UI and create fresh project, schedule save for next interaction
                else {
                    getUnusedProjectName(user).then(projectName => {
                        this.setState({
                            projectName,
                            user,
                            showFirstLaunch: true,
                            newProjectDialogOpen: true
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
            idbLoadTemporaryProject().then(idbProject => {
                if (idbProject) {
                    this.setState({
                        project: projectNeedsUpgrade(idbProject) ? upgradeProject(idbProject) : idbProject
                    }, () => {
                        resetProjectQueryString();
                        hideLoadingScreen();
                        idbDeleteTemporaryProject();
                    });
                }
                else {
                    this.setState({
                        showFirstLaunch: true,
                        newProjectDialogOpen: true
                    });
                    resetProjectQueryString();
                    hideLoadingScreen();
                }
            });
        }

        idbGetLastAppVersion().then(version => {
            if (version) {
                if (semver.lt(version, APP_INFO.VERSION)) {
                    // On a new version
                }
            }
            else {
                // First time running
            }
            idbSetLastAppVersion(APP_INFO.VERSION);
        });
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
                    if (isBlankProject(this.state.project)) {
                        listProjects(user).then(cloudProjects => {
                            // Load project if it already exists
                            if (Object.keys(cloudProjects).indexOf(this.state.projectName) !== -1) {
                                this.handleRequestOpenProject(this.state.projectName);
                            }
                            
                            // Schedule save for the next interaction
                            else {
                                getUnusedProjectName(user).then(name => {
                                    this.setState({
                                        projectName: name
                                    });
                                });
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
                            ), () => this.saveSession({}, this.state.project));
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

    saveSession(oldProject, newProject) {
        if (this.state.user) {
            this.setState({ saving: true });
            projectExists(this.state.user, this.state.projectName).then(exists => {
                saveDiff(this.state.user, exists ? oldProject : {}, newProject, this.state.projectName).then(saveTime => {
                    updateProjectQueryString(this.state.projectName);
                    this.setState({ project: Object.assign({}, this.state.project, { modified: saveTime }), saving: false, saved: true });
                });
            })
        }
    }

    deleteRegion(regionId) {
        const newProject = deleteRegion(regionId, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject,
            editorId: null
        });
    }

    deleteSection(sectionId) {
        const newProject = deleteSection(sectionId, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject,
            editorId: null
        });
    }

    deleteMember(memberId) {
        const newProject = deleteMember(memberId, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject,
            editorId: null
        });
    }

    batchAddMembers(memberNames, sectionId) {
        const newProject = batchAddMembers(memberNames, sectionId, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject,
            batchAddDialogOpen: false
        });
    }

    moveMemberToSection(memberId, sectionId, index) {
        const newProject = moveMemberToSection(memberId, sectionId, index, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    moveRegionToIndex(regionId, destinationIndex) {
        const newProject = moveRegionToIndex(regionId, destinationIndex, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    moveSectionToIndex(sectionId, destinationId, destinationIndex) {
        const newProject = moveSectionToRegion(sectionId, destinationId, destinationIndex, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    createNewRegion() {
        const newProject = addNewRegion(this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    deleteProject() {
        deleteProject(this.state.user, this.state.projectName).then(() => {
            getUnusedProjectName(this.state.user).then(name => {
                const newState = Object.assign({}, createFreshState(this.state.user), {
                    project: createProjectFromTemplate(),
                    projectName: name
                });
        
                this.setState(newState, () => {
                    resetProjectQueryString();
                });
            });
        });
    }

    handleClickedToolbarButton(event) {
        if (event.target.name === 'region') {
            this.createNewRegion();
            return;
        }

        const newState = { project: Object.assign({}, this.state.project) };
        let saveNeeded = false;
        if (event.target.name === 'sort') {
            newState.project.settings = Object.assign({}, this.state.project.settings);
            newState.project.settings.downstageTop = !this.state.project.settings.downstageTop;
            saveNeeded = true;
        }

        if (event.target.name === 'menu') {
            newState.drawerOpen = true;
        }

        if (event.target.name === 'project-settings') {
            newState.projectOptionsDialogOpen = true;
        }

        if (event.target.name === 'roster') {
            newState.rosterOpen = !this.state.rosterOpen;
        }

        if (saveNeeded)
            this.saveSession(this.state.project, newState.project);

        this.setState(newState);
    }

    handleClickedNewSectionButton(regionId) {
        const newProject = addNewSection(regionId, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    handleRequestedNewPerson(sectionId) {
        this.batchAddMembers([null], sectionId);
    }

    handleRequestedBatchAddMembers(sectionId) {
        const requestedSection = this.state.project.sections.find(current => current.id === sectionId);
        this.setState({
            batchAddSectionId: sectionId,
            batchAddSectionName: requestedSection.name,
            batchAddDialogOpen: true
        });
    }

    handleAcceptedBatchAdd(members) {
        this.batchAddMembers(members, this.state.batchAddSectionId);
    }

    handleRequestedShuffleSection(sectionId) {
        const newProject = shuffleSection(sectionId, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    handleChangeProjectSetting(newSetting) {
        const newSettings = Object.assign({}, this.state.project.settings, newSetting);
        const newProject = Object.assign({}, this.state.project, {settings: newSettings});
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    handleRequestedDeleteRegion(regionId) {
        const requestedRegion = this.state.project.regions.find(current => current.id === regionId);
        const affectedSections = this.state.project.sections.filter(current => current.region === regionId);

        dialogQueue.confirm({
            title: `Delete "${requestedRegion.name}" region?`,
            body: <>
                <p>This will also delete the following sections and all their section members:</p>
                <ul>
                    {affectedSections.map(current => <li key={current.id}>{current.name}</li>)}
                </ul>
            </>
        }).then(confirmed => {
            if (confirmed)
                this.deleteRegion(regionId);
        });
    }

    handleRequestedDeleteSection(sectionId) {
        const requestedSection = this.state.project.sections.find(current => current.id === sectionId);

        dialogQueue.confirm({
            title: `Delete "${requestedSection.name}" section?`,
            body: 'This will also delete all section members.'
        }).then(confirmed => {
            if (confirmed)
                this.deleteSection(sectionId);
        })
    }

    handleRequestedDeleteMember(memberId) {
        const requestedMember = this.state.project.members.find(current => current.id === memberId);
        const memberSection = this.state.project.sections.find(current => current.id === requestedMember.section);

        dialogQueue.confirm({
            title: `Delete ${requestedMember.name}?`,
            body: `This will delete them from the ${memberSection.name} section.`
        }).then(confirmed => {
            if (confirmed)
                this.deleteMember(memberId);
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

    handleRequestedSelectMember(memberId) {
        this.setState({
            editorId: memberId
        })
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

    handleRequestNewProject(event) {
        if (this.state.user)
            this.setState({ newProjectDialogOpen: true });
        else
            dialogQueue.confirm({
                title: 'Abandon current seating chart?',
                body: <>
                    <p>If you create a new seating chart, the contents of the current seating chart will be lost. This can't be undone.</p>
                    <p>Are you sure you want to continue?</p>
                </>
            }).then(confirmed => confirmed && this.setState({ newProjectDialogOpen: true }));
    }

    handleRequestDuplicateProject() {
        getUnusedProjectName(this.state.user, this.state.projectName).then(name => {
            const newProject = duplicateProject(this.state.project);
            const newState = Object.assign({},
                createFreshState(this.state.user),
                {
                    project: newProject,
                    projectName: name,
                    user: this.state.user,
                    message: 'Copied chart contents into a new seating chart.'
                }
            );

            this.saveSession({}, newProject);
            this.setState(newState);
        });
    }

    handleRequestImportProject(project, name) {
        if (validateProject(project)) {
            const newProject = duplicateProject(project);
            const newState = Object.assign({},
                createFreshState(this.state.user),
                {
                    project: newProject,
                    projectName: name,
                    user: this.state.user
                }
            );

            if (this.state.user) {
                listProjects(this.state.user).then(existingProjects => {
                    if (Object.keys(existingProjects).indexOf(name) === -1) {
                        // No name conflict: go ahead with import.
                        this.setState(newState, () => this.saveSession({}, this.state.project));
                    }
                    else {
                        // Name conflict. Generate new name.
                        getUnusedProjectName(this.state.user, name).then(newName => {
                            newState.projectName = newName;
                            this.setState(newState, () => this.saveSession({}, this.state.project));
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
            newState.saved = true;
            updateProjectQueryString(newState.projectName);
            this.setState(newState, () => {
                if (upgradedProject)
                    this.saveSession(savedProject, this.state.project);
            });
        })        
    }

    /* DIALOG EVENTS */
    handleSelectNewProjectTemplate(template) {
        const project = createProjectFromTemplate(template);
        if (this.state.user) {
            getUnusedProjectName(this.state.user).then(name => {
                this.setState(Object.assign({},
                    createFreshState(this.state.user),
                    {
                        project,
                        projectName: name
                    }
                ));
                resetProjectQueryString();
            });
        }
        else {
            this.setState(Object.assign({}, createFreshState(this.state.user), { project }));
            resetProjectQueryString();
        }
    }

    handleAcceptRegionEdits(regionId, data) {
        const newProject = applyRegionEdits(regionId, data, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    handleAcceptSectionEdits(sectionId, data) {
        const newProject = applySectionEdits(sectionId, data, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    handleAcceptMemberEdits (memberId, data) {
        const newProject = applyMemberEdits(memberId, data, this.state.project);
        this.saveSession(this.state.project, newProject);
        this.setState({
            project: newProject
        });
    }

    handleAcceptRenameProject (newName) {
        if (this.state.user) {
            const oldName = this.state.projectName;
            this.setState({ saving: true });
            renameProject(this.state.user, oldName, newName).then(saveTime => {
                this.setState({ projectName: newName, project: Object.assign({}, this.state.project, { modified: saveTime }), saving: false, saved: true });
                updateProjectQueryString(newName);
            }).catch((err) => {
                if (err.name === 'NotAuthenticatedError') {
                    // User is not authenticated. Swallow the error and keep the new name locally.
                    this.setState({ projectName: newName, saving: false });
                }
                else if (err.name == 'NotFoundError') {
                    // Project with that name does not exist. Keep the new name, and do a full save.
                    this.setState({ projectName: newName, saving: false });
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
        const seats = calculateSeatPositions(this.state.project.regions, this.state.project.sections, this.state.project.members, this.state.project.settings);
        const [layoutWidth, layoutHeight] = getLayoutDimensions(
            seats,
            this.state.project.settings
        );
        return <React.Fragment>
            <Drawer drawerOpen={this.state.drawerOpen}
                onClose={() => this.setState({ drawerOpen: false })}
                onRequestPrintProject={() => window.print()}
                onRequestNewProject={this.handleRequestNewProject}
                onRequestDuplicateProject={this.handleRequestDuplicateProject}
                onRequestImportProject={this.handleRequestImportProject}
                onRequestExportProject={options => exportProjectFile(this.state.projectName || undefined, this.state.project, options)}
                onRequestShowOpenProjectDialog={() => this.setState({openProjectDialogOpen: true})}
                onRequestDeleteProject={() => this.deleteProject()}
                onRequestLogin={this.handleRequestLogin}
                onRequestLogout={this.handleRequestLogout}
                projectName={this.state.projectName}
                layoutWidth={layoutWidth}
                layoutHeight={layoutHeight}
                user={this.state.user} />

            <Toolbar id='toolbar'
                implicitSeatsVisible={this.state.project.settings.implicitSeatsVisible}
                downstageTop={this.state.project.settings.downstageTop}
                rosterOpen={this.state.rosterOpen}
                onRequestRenameProject={this.handleAcceptRenameProject}
                projectName={this.state.projectName}
                lastSave={this.state.saved && this.state.project.modified}
                saving={this.state.saving}
                onToolbarButtonClick={this.handleClickedToolbarButton} />

            <Stage id='stage'
                seats={seats}
                project={this.state.project}
                regions={this.state.project.regions}
                sections={this.state.project.sections}
                settings={this.state.project.settings}
                editorId={this.state.editorId}
                expanded={!this.state.rosterOpen}
                onRequestSelectMember={this.handleRequestedSelectMember}
                onRequestNewSection={this.handleClickedNewSectionButton} />

            {this.state.editorId && <Editor expanded={this.state.rosterOpen}
                data={[...this.state.project.regions, ...this.state.project.sections, ...this.state.project.members].find(current => current.id === this.state.editorId)}
                onEditRegion={this.handleAcceptRegionEdits}
                onEditSection={this.handleAcceptSectionEdits}
                onEditMember={this.handleAcceptMemberEdits}
                onRequestDeleteRegion={this.state.project.regions.length > 1 && this.handleRequestedDeleteRegion}
                onRequestDeleteSection={this.handleRequestedDeleteSection}
                onRequestDeleteMember={this.handleRequestedDeleteMember}
                onClickedBack={() => this.setState({editorId: null})} />}
            
            {!this.state.editorId && <Roster id='roster'
                sections={this.state.project.sections}
                members={this.state.project.members}
                regions={this.state.project.regions}
                expanded={this.state.rosterOpen}
                onRequestNewSection={this.handleClickedNewSectionButton}
                onDragEnd={this.handleSectionsListDragEnd}
                onRequestNewPerson={this.handleRequestedNewPerson}
                onRequestBatchAdd={this.handleRequestedBatchAddMembers}
                onRequestShuffleSection={this.handleRequestedShuffleSection}
                onRequestMoveRegion={this.handleRequestedMoveRegion}
                onRequestDeleteRegion={this.handleRequestedDeleteRegion}

                onRequestSelectMember={this.handleRequestedSelectMember} />}

            <NewProjectDialog open={this.state.newProjectDialogOpen}
                onSelectTemplate={this.handleSelectNewProjectTemplate}
                onClose={() => this.setState({ newProjectDialogOpen: false, showFirstLaunch: false })}
                onRequestOpenProject={this.handleRequestOpenProject}
                onRequestShowOpenProjectDialog={() => this.setState({openProjectDialogOpen: true})}
                onRequestLogin={this.handleRequestLogin}
                showFirstLaunch={this.state.showFirstLaunch}
                user={this.state.user} />

            <BatchAddMembersDialog isOpen={this.state.batchAddDialogOpen}
                onClose={() => this.setState({ batchAddDialogOpen: false })}
                onAddMembers={this.handleAcceptedBatchAdd}
                title={this.state.batchAddSectionName} />

            <ProjectSettingsDialog isOpen={this.state.projectOptionsDialogOpen}
                onClose={() => this.setState({ projectOptionsDialogOpen: false })}
                onChange={this.handleChangeProjectSetting}
                {...this.state.project.settings} />

            <OpenProjectDialog open={this.state.openProjectDialogOpen}
                onClose={() => this.setState({openProjectDialogOpen: false})}
                onRequestOpenProject={this.handleRequestOpenProject}
                onRequestImportProject={this.handleRequestImportProject}
                showFirstLaunch={this.state.showFirstLaunch}
                currentProject={this.state.projectName}
                user={this.state.user} />
                
            <DialogQueue dialogs={dialogQueue.dialogs} />
            <SnackbarQueue messages={snackbarQueue.messages} />

            <Snackbar open={this.state.message} onClose={() => {this.setState({message: null})}}
                message={this.state.message} />

            <Snackbar open={this.state.updateAvailable} onClose={event => this.setState({updateAvailable: false})}
                message={`A new version of ${APP_INFO.NAME} is available`} timeout={24 * 60 * 60 * 1000}
                action={<SnackbarAction label='Reload' onClick={this.handleUserTriggeredUpdate} />} />
        </React.Fragment>
    }
}

ReactDOM.render(<App />, document.getElementById('app'));
