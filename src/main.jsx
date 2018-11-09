import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { SimpleDialog } from '@rmwc/dialog';

import '@material/dialog/dist/mdc.dialog.css';

import SeatingRenderer from './components/render-seating.jsx';
import MenuDrawer from './components/menu-drawer.jsx';
import MainToolbar from './components/toolbar.jsx';
import SectionsList from './components/sections-list.jsx';
import EditDialog from './components/edit-dialog.jsx';
import BatchAddMembersDialog from './components/batch-add-members.jsx';
import ProjectSettingsDialog from './components/project-settings-dialog.jsx';

import {
    saveProject,
    loadProject,
    deleteProject,
    updateProjectQueryString,
    resetProjectQueryString,
    getUnusedProjectName,
    createSection,
    createPerson,
    createEmptyProject,
    renameProject,
    validateProject,
    listProjects
} from './helpers/project-helpers.js';

import './main.css';

function createFreshState() {
    return {
        deleteSectionId: null,
        deleteSectionName: null,
        deleteSectionDialogOpen: false,
        deleteMemberId: null,
        deleteMemberName: null,
        deleteMemberDialogOpen: false,
        batchAddSectionId: null,
        batchAddSectionName: null,
        batchAddDialogOpen: false,
        editSectionDialogOpen: false,
        editMemberDialogOpen: false,
        projectOptionsDialogOpen: false,
        drawerOpen: false,
        editorType: null,
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
        this.handleRequestedDeleteSection = this.handleRequestedDeleteSection.bind(this);
        this.handleRequestedDeleteMember = this.handleRequestedDeleteMember.bind(this);
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
        this.handleDeleteSectionDialogClosed = this.handleDeleteSectionDialogClosed.bind(this);
        this.handleDeleteMemberDialogClosed = this.handleDeleteMemberDialogClosed.bind(this);
        this.handleAcceptSectionEdits = this.handleAcceptSectionEdits.bind(this);
        this.handleAcceptMemberEdits = this.handleAcceptMemberEdits.bind(this);
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

    deleteSection() {
        const sectionId = this.state.deleteSectionId;
        const sections = this.state.project.sections.filter(currentSection => currentSection.id !== sectionId);
        const members = this.state.project.members.filter(currentMember => currentMember.section !== sectionId);
        this.setState({
            project: Object.assign({}, this.state.project, {sections, members}),
            editorType: null,
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
            editorType: null,
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
            editorType: 'member',
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

    moveSectionToIndex(sectionId, destinationIndex) {
        // Find and remove the section
        const sourceIndex = this.state.project.sections.findIndex(currentSection => currentSection.id === sectionId);
        const [removed] = this.state.project.sections.splice(sourceIndex, 1);

        // Insert the section at the new position and set the state
        const sections = this.state.project.sections.filter(currentSection => currentSection.id !== sectionId);
        sections.splice(destinationIndex, 0, removed);
        this.setState({
            project: Object.assign({}, this.state.project, {sections})
        }, this.saveSession);
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

        if (event.target.name === 'project-settings') {
            newState.projectOptionsDialogOpen = true;
            saveProject = false;
        }
        this.setState(newState, saveProject ? this.saveSession : () => {});
    }

    handleClickedNewSectionButton() {
        const newSections = this.state.project.sections.slice();

        newSections.push(createSection());

        this.setState(Object.assign({}, {
            project: Object.assign({}, this.state.project, {sections: newSections}),
            editorType: 'section',
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
            editorType: 'section',
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

    handleRequestedDeleteSection(sectionId) {
        const requestedSection = this.state.project.sections.find(current => current.id === sectionId);
        this.setState({
            editorId: sectionId,
            editorType: 'section',
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
            editorType: 'member',
            deleteMemberId: memberId,
            deleteMemberName: requestedMember.name,
            deleteMemberDialogOpen: true,
            deleteSectionName: memberSection.name
        })
    }

    handleRequestedEditSection(sectionId) {
        this.setState({
            editSectionDialogOpen: true,
            editorId: sectionId,
            editorType: 'section'
        }, this.saveSession)
    }

    handleRequestedSelectMember(memberId) {
        const newState = {
            editorId: memberId,
            editorType: null
        };

        if (this.state.project.members.some(current => current.id === memberId))
            newState.editorType = 'member';
        else
            newState.editorType = 'section';

        this.setState(newState, this.saveSession)
    }

    handleRequestedEditMember(memberId) {
        this.setState({
            editMemberDialogOpen: true,
            editorId: memberId,
            editorType: 'member'
        });
    }

    /* DRAG AND DROP */

    handleSectionsListDragEnd(result) {
        if (result.destination) {
            const itemId = result.draggableId;
            const destinationSection = result.destination.droppableId;
            const destinationIndex = result.destination.index;

            if (result.type === 'member')
                this.moveMemberToSection(itemId, destinationSection, destinationIndex);
            else if (result.type === 'section')
                this.moveSectionToIndex(itemId, destinationIndex);
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
            }
            newState.projectName = projectName;
            this.setState(newState, this.saveSession);
        })        
    }

    /* DIALOG EVENTS */
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

    render() {
        return <React.Fragment>
            <MenuDrawer drawerOpen={this.state.drawerOpen}
                onClose={() => this.setState({drawerOpen: false})}
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
                curvedLayout={this.state.project.settings.curvedLayout}
                onToolbarButtonClick={this.handleClickedToolbarButton} />

            <SeatingRenderer id='rendering-area'
                project={this.state.project}
                editorId={this.state.editorId}
                onRequestSelectMember={this.handleRequestedSelectMember}
                onRequestNewSection={this.handleClickedNewSectionButton} />

            <SectionsList id='sections-list'
                editorId={this.state.editorId}
                sections={this.state.project.sections}
                members={this.state.project.members}
                onNewSectionButtonClick={this.handleClickedNewSectionButton}
                onDragEnd={this.handleSectionsListDragEnd}
                onRequestNewPerson={this.handleRequestedNewPerson}
                onRequestBatchAdd={this.handleRequestedBatchAddMembers}
                onRequestDeleteSection={this.handleRequestedDeleteSection}
                onRequestEditSection={this.handleRequestedEditSection}

                onRequestSelectMember={this.handleRequestedSelectMember}
                onRequestEditMember={this.handleRequestedEditMember}
                onRequestDeleteMember={this.handleRequestedDeleteMember} />

            <SimpleDialog title={`Delete "${this.state.deleteSectionName}" section?`}
                body='This will also delete all section members.'
                open={this.state.deleteSectionDialogOpen}
                onClose={this.handleDeleteSectionDialogClosed} />
            
            <SimpleDialog title={`Delete ${this.state.deleteMemberName}?`}
                body={`This will remove them from the ${this.state.deleteSectionName} section.`}
                open={this.state.deleteMemberDialogOpen}
                onClose={this.handleDeleteMemberDialogClosed} />

            <EditDialog open={this.state.editSectionDialogOpen}
                title='Edit section'
                editorType='section'
                data={this.state.project.sections.find(current => current.id === this.state.editorId)}
                onAccept={this.handleAcceptSectionEdits}
                onCancel={() => this.setState({editSectionDialogOpen: false})} />

            <EditDialog open={this.state.editMemberDialogOpen}
                title='Edit section member'
                editorType='member'
                data={this.state.project.members.find(current => current.id === this.state.editorId)}
                onAccept={this.handleAcceptMemberEdits}
                onCancel={() => this.setState({editMemberDialogOpen: false})} />

            <BatchAddMembersDialog isOpen={this.state.batchAddDialogOpen}
                onClose={() => this.setState({batchAddDialogOpen: false})}
                onAddMembers={this.handleAcceptedBatchAdd}
                title={this.state.batchAddSectionName} />

            <ProjectSettingsDialog isOpen={this.state.projectOptionsDialogOpen}
                onClose={() => this.setState({projectOptionsDialogOpen: false})}
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
