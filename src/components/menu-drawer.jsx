import React, { PureComponent } from 'react';

import { Drawer, DrawerHeader, DrawerContent, DrawerTitle, DrawerSubtitle } from '@rmwc/drawer';
import { List, ListItem, ListItemPrimaryText, ListItemMeta, ListGroup, ListGroupSubheader, ListDivider, ListItemGraphic } from '@rmwc/list';
import { Button } from '@rmwc/button';

import '@material/drawer/dist/mdc.drawer.css';
import '@material/list/dist/mdc.list.css';
import '@material/button/dist/mdc.button.css';

import RenameDialog from './rename-dialog.jsx';
import DeleteProjectDialog from './delete-project-dialog.jsx';
import RecentProjectsDialog from './recent-projects-dialog.jsx';
import AboutDialog from './about-dialog.jsx';
import UserWidget from './user-widget.jsx';

import PrintIcon from '../icons/baseline-print-24px.jsx';
import EditIcon from '../icons/baseline-edit-24px.jsx';
import DeleteForeverIcon from '../icons/baseline-delete_forever-24px.jsx';
import NoteAddIcon from '../icons/baseline-note_add-24px.jsx';
import HistoryIcon from '../icons/baseline-history-24px.jsx';
import FolderOpenIcon from '../icons/baseline-folder_open-24px.jsx';
import SaveAltIcon from '../icons/baseline-save_alt-24px.jsx';
import FeedbackIcon from '../icons/baseline-feedback-24px.jsx';
import InfoIcon from '../icons/baseline-info-24px.jsx';

class MenuDrawer extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            aboutDialogVisible: false,
            renameDialogVisible: false,
            recentProjectsDialogVisible: false,
            deleteProjectDialogVisible: false
        }

        this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
        this.handleSelectFileForImport = this.handleSelectFileForImport.bind(this);
        this.handleFileReaderLoaded = this.handleFileReaderLoaded.bind(this);
        this.handleRequestOpenProject = this.handleRequestOpenProject.bind(this);
        this.handleAcceptRename = this.handleAcceptRename.bind(this);
        this.handleAcceptDeleteProject = this.handleAcceptDeleteProject.bind(this);

        // Dialog cancel listeners
        this.handleRequestCancelRename = this.handleRequestCancelRename.bind(this);
        this.handleRequestCancelDeleteProject = this.handleRequestCancelDeleteProject.bind(this);
        this.handleRequestCancelRecentProjects = this.handleRequestCancelRecentProjects.bind(this);
        this.handleRequestCancelAbout = this.handleRequestCancelAbout.bind(this);
    }

    handleMenuButtonClick(event) {
        switch (event.target.dataset.name) {
            case 'print-project':
                if (typeof this.props.onRequestPrintProject === 'function')
                    this.props.onRequestPrintProject();
                break;
            case 'rename-project':
                this.setState({renameDialogVisible: true});
                break;
            case 'delete-project':
                this.setState({deleteProjectDialogVisible: true});
                break;
            case 'new-project':
                if (typeof this.props.onRequestNewProject === 'function')
                    this.props.onRequestNewProject();
                break;
            case 'recent-projects':
                this.setState({
                    recentProjectsDialogVisible: true
                });
                break;
            case 'import':
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.addEventListener('change', this.handleSelectFileForImport);
                input.click();
                break;
            case 'export':
                if (typeof this.props.onRequestExportProject === 'function')
                    this.props.onRequestExportProject();
                break;
            case 'about':
                this.setState({
                    aboutDialogVisible: true
                });
                break;
        }
    }

    handleSelectFileForImport(event) {
        event.target.removeEventListener('change', this.handleSelectFileForImport);
        if (event.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', this.handleFileReaderLoaded);
            reader.file = event.target.files[0];
            reader.readAsText(event.target.files[0]);
        }
    }

    handleFileReaderLoaded(event) {
        event.target.removeEventListener('load', this.handleFileReaderLoaded);
        let parsedProject, projectName;
        try {
            parsedProject = JSON.parse(event.target.result);
            projectName = event.target.file.name.split('.');
            if (projectName.length > 1)
                projectName = projectName.slice(0, projectName.length - 1);
            projectName = projectName.join('.');

            if (typeof this.props.onRequestImportProject === 'function')
            this.props.onRequestImportProject(parsedProject, projectName);
        }
        catch(e) {
            console.error('Unable to load project - file is corrupt.');
        }
    }

    handleRequestOpenProject(project) {
        this.setState({recentProjectsDialogVisible: false}, () => {
            this.props.onRequestOpenProject(project);
        })
    }

    handleAcceptRename(newName) {
        this.setState({renameDialogVisible: false}, () => {
            if (typeof this.props.onRequestRenameProject === 'function')
                this.props.onRequestRenameProject(newName);
        });
    }

    handleAcceptDeleteProject() {
        this.setState({deleteProjectDialogVisible: false}, () => {
            if (typeof this.props.onRequestDeleteProject === 'function')
                this.props.onRequestDeleteProject();
        })
    }

    // Dialog cancel listeners
    handleRequestCancelRename() {
        this.setState({renameDialogVisible: false});
    }

    handleRequestCancelDeleteProject() {
        this.setState({deleteProjectDialogVisible: false});
    }

    handleRequestCancelRecentProjects() {
        this.setState({recentProjectsDialogVisible: false});
    }

    handleRequestCancelAbout() {
        this.setState({aboutDialogVisible: false});
    }

    render() {
        return <React.Fragment>
            <Drawer modal open={this.props.drawerOpen} onClose={() => this.props.onClose()}>
            <DrawerHeader>
                <DrawerTitle>{APP_INFO.NAME}</DrawerTitle>
                <DrawerSubtitle>{this.props.projectName}</DrawerSubtitle>
            </DrawerHeader>
            <DrawerContent>
                <List>
                    <ListItem data-name='new-project' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<NoteAddIcon />} />New seating chart</ListItem>
                    <ListItem data-name='print-project' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<PrintIcon />} />Print&hellip;</ListItem>

                    <ListDivider />

                    {this.props.user && <ListItem data-name='recent-projects' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<HistoryIcon />} />Open project</ListItem>}
                    <ListItem data-name='import' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<FolderOpenIcon />} />Import</ListItem>
                    <ListItem data-name='export' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<SaveAltIcon />} />Export</ListItem>

                    {this.props.user && <React.Fragment>
                        <ListDivider />
                    
                        <ListItem data-name='rename-project' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<EditIcon />} />Rename this project&hellip;</ListItem>
                        <ListItem data-name='delete-project' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<DeleteForeverIcon />} />Delete this project&hellip;</ListItem>
                    </React.Fragment>}

                    <ListDivider />

                    <ListItem data-name='feedback' tag='a' href='https://goo.gl/forms/UJ0XwlMNNjrskdQ33' target='_blank' rel='noopener'><ListItemGraphic icon={<FeedbackIcon />} />Feedback</ListItem>
                    <ListItem data-name='about' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<InfoIcon />} />About</ListItem>
                </List>
            </DrawerContent>
            <DrawerHeader>
                <DrawerSubtitle>
                    {!this.props.user && <Button raised onClick={this.props.onRequestLogin}>Sign in with Google</Button>}
                    {this.props.user && <React.Fragment>
                        <UserWidget thumbnail={this.props.user.photoURL}
                            displayName={this.props.user.displayName}
                            email={this.props.user.email} />
                        <Button raised onClick={this.props.onRequestLogout}>Sign out</Button>
                    </React.Fragment>}
                </DrawerSubtitle>
                <DrawerSubtitle>v{APP_INFO.VERSION}<br />"{APP_INFO.CODENAME}"</DrawerSubtitle>
            </DrawerHeader>
        </Drawer>
        <RenameDialog open={this.state.renameDialogVisible} onCancel={this.handleRequestCancelRename}
            onAccept={this.handleAcceptRename}
            title='Rename project'
            label='Project name'
            value={this.props.projectName} />

        <DeleteProjectDialog open={this.state.deleteProjectDialogVisible} onCancel={this.handleRequestCancelDeleteProject}
            onAccept={this.handleAcceptDeleteProject}
            title={`Delete "${this.props.projectName}?"`} />

        <RecentProjectsDialog open={this.state.recentProjectsDialogVisible} 
            onClose={this.handleRequestCancelRecentProjects}
            onRequestOpenProject={this.handleRequestOpenProject}
            user={this.props.user} />

        <AboutDialog open={this.state.aboutDialogVisible} onClose={this.handleRequestCancelAbout} />
    </React.Fragment>
    }
}

export default MenuDrawer;
