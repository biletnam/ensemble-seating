import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { SimpleDialog } from '@rmwc/dialog';

import '@material/dialog/dist/mdc.dialog.css';

import SeatingRenderer from './components/render-seating.jsx';
import MenuDrawer from './components/menu-drawer.jsx';
import MainToolbar from './components/toolbar.jsx';
import SectionsList from './components/sections-list.jsx';
import EditDialog from './components/edit-dialog.jsx';
import RegionEditor from './components/edit-region.jsx';
import SectionEditor from './components/edit-section.jsx';
import MemberEditor from './components/edit-member.jsx';
import BatchAddMembersDialog from './components/batch-add-members.jsx';
import ProjectSettingsDialog from './components/project-settings-dialog.jsx';

import {
    saveProject,
    loadProject,
    deleteProject,
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

function createFreshState() {
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
        drawerOpen: false,
        editorId: null,
        project: null,
        initProject: false,
        projectName: null
    }
}

function hideLoadingScreen() {
    document.querySelector("#loading-cover").setAttribute("hidden", "hidden");
}

class App extends Component {
    constructor(props) {
        super(props);

        this.state = createFreshState();
        this.state.project = createEmptyProject();

        const urlParams = new URLSearchParams(location.search);
        const nameParam = urlParams.get('project');
        if (nameParam)
            this.state.initProject = decodeURIComponent(nameParam);

        this.saveSession = this.saveSession.bind(this);
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

        // Dialogs
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
    }

    componentDidMount() {
        if (this.state.initProject) {
            // Initial setup
            loadProject(this.state.initProject).then(project => {
                if (project) {
                    const newState = {
                        project: Object.assign({}, project),
                        projectName: this.state.initProject,
                        initProject: null
                    }
                    if (projectNeedsUpgrade(project))
                        newState.project = upgradeProject(project);
                    this.setState(newState, () => {
                        updateProjectQueryString(newState.projectName);
                        hideLoadingScreen();
                    });
                }
            });
        }
        else {
            getUnusedProjectName().then(name => {
                this.setState({
                    projectName: name
                }, hideLoadingScreen);
            });
        }
    }

    saveSession() {
        saveProject(this.state.project, this.state.projectName)
    }

    deleteRegion() {
        const regionId = this.state.deleteRegionId;
        
        const regions = this.state.project.regions.filter(current => current.id !== regionId);
        const sections = this.state.project.sections.filter(current => current.region !== regionId);
        const members = this.state.project.members.filter(current => sections.some(currentSection => currentSection.id === current.section));
        this.setState({
            project: Object.assign({}, this.state.project, {regions, sections, members}),
            editorId: null,
            deleteRegionName: null,
            deleteRegionId: null,
            deleteRegionAffectedSections: [],
            deleteRegionDialogOpen: false
        }, this.saveSession);
    }

    deleteSection() {
        const sectionId = this.state.deleteSectionId;
        const sections = this.state.project.sections.filter(currentSection => currentSection.id !== sectionId);
        const members = this.state.project.members.filter(currentMember => currentMember.section !== sectionId);
        this.setState({
            project: Object.assign({}, this.state.project, {sections, members}),
            editorId: null,
            deleteSectionName: null,
            deleteSectionId: null,
            deleteSectionDialogOpen: false
        }, this.saveSession);
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
        }, this.saveSession);
    }

    batchAddMembers(members, sectionId) {
        const newMembers = this.state.project.members.slice();
        for (let i=0; i<members.length; i++) {
            newMembers.push(createPerson(members[i] ? members[i] : undefined, sectionId));
        }
        
        this.setState(Object.assign({}, {
            project: Object.assign({}, this.state.project, {members: newMembers}),
            editorId: newMembers[newMembers.length - 1].id,
            batchAddDialogOpen: false
        }), this.saveSession);
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
        }, this.saveSession);
    }

    moveRegionToIndex(regionId, destinationIndex) {
        const regions = this.state.project.regions.slice();
        const indexOfRegion = regions.findIndex(current => current.id === regionId);

        const [removed] = regions.splice(indexOfRegion, 1);
        regions.splice(destinationIndex, 0, removed);

        this.setState({
            project: Object.assign({}, this.state.project, {regions})
        }, this.saveSession);
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
        }, this.saveSession);
    }

    createNewRegion() {
        const newRegions = this.state.project.regions.slice();
        
        newRegions.unshift(createRegion());

        this.setState(Object.assign({}, {
            project: Object.assign({}, this.state.project, {regions: newRegions})
        }), this.saveSession);
    }

    deleteProject() {
        deleteProject(this.state.projectName).then(() => {
            getUnusedProjectName().then(name => {
                const newState = Object.assign({}, createFreshState(), {
                    project: createEmptyProject(),
                    projectName: name
                })
        
                this.setState(newState, () => {
                    resetProjectQueryString();
                });
            });
        });
    }

    handleClickedToolbarButton(event) {
        const newState = {};
        let saveProject = true;
        if (event.target.name === 'sort') {
            newState.project = Object.assign({}, this.state.project);
            newState.project.settings = Object.assign({}, this.state.project.settings);
            newState.project.settings.downstageTop = !this.state.project.settings.downstageTop;
        }

        if (event.target.name === 'menu') {
            newState.drawerOpen = true;
            saveProject = false;
        }

        if (event.target.name === 'region') {
            this.createNewRegion();
        }

        if (event.target.name === 'project-settings') {
            newState.projectOptionsDialogOpen = true;
            saveProject = false;
        }
        this.setState(newState, saveProject ? this.saveSession : () => {});
    }

    handleClickedNewSectionButton(regionId) {
        const newSections = this.state.project.sections.slice();
        const newRegions = this.state.project.regions.slice();

        newSections.push(createSection());
        if (newRegions.length === 0) {
            // There are no regions. Create one and assign the new section to it.
            newRegions.push(createRegion());
            newSections[newSections.length - 1].region = newRegions[newRegions.length - 1].id;
        }
        else {
            // Assign the section to the given region; otherwise, assign it to the first region
            newSections[newSections.length - 1].region = regionId || newRegions[0].id;
        }

        this.setState(Object.assign({}, {
            project: Object.assign({}, this.state.project, {sections: newSections, regions: newRegions}),
            editorId: newSections[newSections.length - 1].id
        }), this.saveSession);
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
        }, this.saveSession);
    }

    handleRequestedDeleteRegion(regionId) {
        const requestedRegion = this.state.project.regions.find(current => current.id === regionId);
        const affectedSections = this.state.project.sections.filter(current => current.region === regionId);
        this.setState({
            editorId: regionId,
            deleteRegionId: regionId,
            deleteRegionName: requestedRegion.name,
            deleteRegionAffectedSections: affectedSections.map(current => current.name),
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
        }, this.saveSession)
    }

    handleRequestedSelectMember(memberId) {
        const newState = {
            editorId: memberId
        };

        this.setState(newState, this.saveSession)
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
        getUnusedProjectName().then(name => {
            this.setState(Object.assign({},
                createFreshState(),
                {
                    project: createEmptyProject(),
                    projectName: name
                }
            ), this.saveSession);
        });
    }

    handleRequestImportProject(project, name) {
        if (validateProject(project)) {
            const newState = Object.assign({},
                createFreshState(),
                {
                    project: Object.assign({}, project),
                    projectName: name
                }
            );

            listProjects().then(existingProjects => {
                if (existingProjects.indexOf(name) === -1) {
                    // No name conflict: go ahead with import.
                    this.setState(newState, this.saveSession);
                }
                else {
                    // Name conflict. Generate new name.
                    getUnusedProjectName(name).then(newName => {
                        newState.projectName = newName;
                        this.setState(newState, this.saveSession);
                    })
                }
            });
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
        loadProject(projectName).then(savedProject => {
            const newState = createFreshState();
            if (savedProject) {
                newState.project = Object.assign({}, savedProject);
                if (projectNeedsUpgrade(newState.project))
                    newState.project = upgradeProject(newState.project);
            }
            newState.projectName = projectName;
            this.setState(newState, this.saveSession);
        })        
    }

    /* DIALOG EVENTS */
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
        const indexOfRegion = newRegions.indexOf(originalData);
        newRegions.splice(indexOfRegion, 1, Object.assign({}, originalData, data));

        this.setState({
            project: Object.assign({}, this.state.project, {
                regions: newRegions
            }),
            editRegionDialogOpen: false
        }, this.saveSession);
    }

    handleAcceptSectionEdits(sectionId, data) {
        // Save changes
        const newSections = this.state.project.sections.slice();

        const originalData = newSections.find(current => current.id === sectionId);
        const indexOfSection = newSections.indexOf(originalData);
        newSections.splice(indexOfSection, 1, Object.assign({}, originalData, data));

        this.setState({
            project: Object.assign({}, this.state.project, {
                sections: newSections
            }),
            editSectionDialogOpen: false
        }, this.saveSession)
    }

    handleAcceptMemberEdits (memberId, data) {
        // Save changes
        const newMembers = this.state.project.members.slice();
        
        const originalData = newMembers.find(current => current.id === memberId);
        const indexOfMember = newMembers.indexOf(originalData);
        newMembers.splice(indexOfMember, 1, Object.assign({}, originalData, data));

        this.setState({
            project: Object.assign({}, this.state.project, {
                members: newMembers
            }),
            editMemberDialogOpen: false
        }, this.saveSession)
    }

    handleAcceptRenameProject (newName) {
        const oldName = this.state.projectName;
        renameProject(oldName, newName).then(() => {
            this.setState({projectName: newName});
        }).catch(() => {
            console.error(new Error(`Unable to rename project: a project ${newName} already exists.`));
        });
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

    render() {
        return <React.Fragment>
            <MenuDrawer drawerOpen={this.state.drawerOpen}
                onClose={this.handleRequestCloseMenuDrawer}
                onRequestPrintProject={this.handleRequestPrint}
                onRequestNewProject={this.handleRequestNewProject}
                onRequestImportProject={this.handleRequestImportProject}
                onRequestExportProject={this.handleRequestExportProject}
                onRequestOpenProject={this.handleRequestOpenProject}
                onRequestRenameProject={this.handleAcceptRenameProject}
                onRequestDeleteProject={this.handleAcceptDeleteProject}
                projectName={this.state.projectName} />

            <MainToolbar id='rendering-toolbar'
                implicitSeatsVisible={this.state.project.settings.implicitSeatsVisible}
                downstageTop={this.state.project.settings.downstageTop}
                projectName={this.state.projectName}
                onToolbarButtonClick={this.handleClickedToolbarButton} />

            <SeatingRenderer id='rendering-area'
                project={this.state.project}
                regions={this.state.project.regions}
                sections={this.state.project.sections}
                members={this.state.project.members}
                settings={this.state.project.settings}
                editorId={this.state.editorId}
                onRequestSelectMember={this.handleRequestedSelectMember}
                onRequestNewSection={this.handleClickedNewSectionButton} />

            <SectionsList id='sections-list'
                editorId={this.state.editorId}
                sections={this.state.project.sections}
                members={this.state.project.members}
                regions={this.state.project.regions}
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

            <SimpleDialog title={`Delete "${this.state.deleteRegionName}" region?`}
                body={<React.Fragment>
                    <p>This will also delete the following sections and all their section members:</p>
                    <ul>
                        {this.state.deleteRegionAffectedSections.map(current => <li>{current}</li>)}
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
        </React.Fragment>
    }
}

ReactDOM.render(<App />, document.getElementById('root'));

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js');
    });
}
