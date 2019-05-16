import React, { PureComponent } from 'react';

import { Drawer, DrawerHeader, DrawerContent, DrawerTitle, DrawerSubtitle } from '@rmwc/drawer';
import { List, ListItem, ListItemPrimaryText, ListItemMeta, ListGroup, ListGroupSubheader, ListDivider, ListItemGraphic } from '@rmwc/list';
import { Button } from '@rmwc/button';
import { SimpleDialog } from '@rmwc/dialog';

import '@material/drawer/dist/mdc.drawer.min.css';
import '@material/list/dist/mdc.list.min.css';
import '@material/button/dist/mdc.button.min.css';
import '@material/dialog/dist/mdc.dialog.min.css';

import DeleteProjectDialog from './delete-project-dialog.jsx';
import AboutDialog from './about-dialog.jsx';
import UserWidget from './user-widget.jsx';
import ExportActionMenu from './export-action-menu.jsx';
import ExportImageDialog from './export-image-dialog.jsx';

import PrintIcon from '../icons/baseline-print-24px.jsx';
import DeleteForeverIcon from '../icons/baseline-delete_forever-24px.jsx';
import NoteAddIcon from '../icons/baseline-note_add-24px.jsx';
import FolderOpenIcon from '../icons/baseline-folder_open-24px.jsx';
import SaveAltIcon from '../icons/baseline-save_alt-24px.jsx';
import FeedbackIcon from '../icons/baseline-feedback-24px.jsx';
import InfoIcon from '../icons/baseline-info-24px.jsx';

import { browseForFile } from '../helpers/project-helpers.js';

class MenuDrawer extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            aboutDialogVisible: false,
            recentProjectsDialogVisible: false,
            deleteProjectDialogVisible: false,
            exportMenuVisible: false,
            exportDialogVisible: false,
            confirmImportDialogVisible: false
        }

        this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
        this.triggerFileImportDialog = this.triggerFileImportDialog.bind(this);
        this.handleAcceptDeleteProject = this.handleAcceptDeleteProject.bind(this);
        this.handleSelectExportOption = this.handleSelectExportOption.bind(this);

        // Dialog cancel listeners
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
            case 'delete-project':
                this.setState({deleteProjectDialogVisible: true});
                break;
            case 'new-project':
                if (typeof this.props.onRequestNewProject === 'function')
                    this.props.onRequestNewProject();
                break;
            case 'recent-projects':
                if (this.props.user)
                    this.props.onRequestShowOpenProjectDialog && this.props.onRequestShowOpenProjectDialog();
                else
                    this.setState({ confirmImportDialogVisible: true });
                break;
            case 'export':
                this.setState({ exportMenuVisible: true });
                break;
            case 'about':
                this.setState({
                    aboutDialogVisible: true
                });
                break;
        }
    }

    triggerFileImportDialog (event) {
        if ((event && event.detail.action == 'accept') || !event) {
            browseForFile().then(result => {
                const {project, projectName} = result;
                this.props.onRequestImportProject(project, projectName);
            }).catch(error => {
                // To do: recover from error and/or display a message
            });;
        }
        this.setState({ confirmImportDialogVisible: false });
    }

    handleAcceptDeleteProject() {
        this.setState({deleteProjectDialogVisible: false}, () => {
            if (typeof this.props.onRequestDeleteProject === 'function')
                this.props.onRequestDeleteProject();
        })
    }

    handleSelectExportOption(action) {
        if (action === 'project' && typeof this.props.onRequestExportProject === 'function')
            this.props.onRequestExportProject({format: action});

        else
            this.setState({ exportDialogVisible: true });
    }

    // Dialog cancel listeners
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
                    <ListItem data-name='new-project' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<NoteAddIcon />} />New&hellip;</ListItem>
                    <ListItem data-name='print-project' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<PrintIcon />} />Print&hellip;</ListItem>

                    <ListDivider />

                    <ListItem data-name='recent-projects' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<FolderOpenIcon />} />Open&hellip;</ListItem>
                    <ExportActionMenu open={this.state.exportMenuVisible} anchorCorner='topRight' fixed
                        onClose={() => this.setState({exportMenuVisible: false})}
                        onSelectAction={this.handleSelectExportOption}>
                        <ListItem data-name='export' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<SaveAltIcon />} />Export&hellip;</ListItem>
                    </ExportActionMenu>

                    {this.props.user && <React.Fragment>
                        <ListDivider />
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
                <DrawerSubtitle>
                    <a target='_blank' rel='noopener' href={`https://github.com/acmertz/ensemble-seating/releases/tag/v${APP_INFO.VERSION}`}>v{APP_INFO.VERSION}</a><br />
                    "{APP_INFO.CODENAME}"
                </DrawerSubtitle>
            </DrawerHeader>
        </Drawer>

        <DeleteProjectDialog open={this.state.deleteProjectDialogVisible} onCancel={this.handleRequestCancelDeleteProject}
            onAccept={this.handleAcceptDeleteProject}
            title={`Delete "${this.props.projectName}?"`} />

        <AboutDialog open={this.state.aboutDialogVisible} onClose={this.handleRequestCancelAbout} />

        <ExportImageDialog open={this.state.exportDialogVisible} onCancel={() => this.setState({exportDialogVisible: false})}
            onAccept={options => { this.setState({ exportDialogVisible: false }); this.props.onRequestExportProject(options) }}
            imageWidth={this.props.layoutWidth} imageHeight={this.props.layoutHeight} />

        <SimpleDialog title='Abandon current seating chart?'
            open={this.state.confirmImportDialogVisible}
            acceptLabel='Continue'
            body={<>
                <p>If you import a seating chart, the contents of the current seating chart will be lost. This can't be undone.</p>
                <p>Are you sure you want to continue?</p>
            </>}
            onClose={this.triggerFileImportDialog} />
    </React.Fragment>
    }
}

export default MenuDrawer;
