import React, { PureComponent } from 'react';

import './drawer.css';

import { Drawer, DrawerHeader, DrawerContent, DrawerTitle, DrawerSubtitle } from '@rmwc/drawer';
import { List, ListItem, ListDivider, ListItemGraphic } from '@rmwc/list';
import { Button } from '@rmwc/button';

import '@material/drawer/dist/mdc.drawer.min.css';
import '@material/list/dist/mdc.list.min.css';
import '@material/button/dist/mdc.button.min.css';
import '@material/dialog/dist/mdc.dialog.min.css';

import AboutDialog from './about-dialog.jsx';
import UserWidget from './user-widget.jsx';
import ExportActionMenu from './export-action-menu.jsx';
import ExportImageDialog from './export-image-dialog.jsx';

import PrintIcon from '../icons/baseline-print-24px.jsx';
import DeleteForeverIcon from '../icons/baseline-delete_forever-24px.jsx';
import NoteAddIcon from '../icons/baseline-note_add-24px.jsx';
import CopyIcon from '../icons/baseline-file_copy-24px.jsx';
import FolderOpenIcon from '../icons/baseline-folder_open-24px.jsx';
import SaveAltIcon from '../icons/baseline-save_alt-24px.jsx';
import FeedbackIcon from '../icons/baseline-feedback-24px.jsx';
import InfoIcon from '../icons/baseline-info-24px.jsx';

import { browseForFile } from '../helpers/project-helpers.js';
import { queue as dialogQueue } from './dialog-queue.jsx';

class MenuDrawer extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            aboutDialogVisible: false,
            recentProjectsDialogVisible: false,
            exportMenuVisible: false,
            exportDialogVisible: false
        }

        this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
        this.handleSelectExportOption = this.handleSelectExportOption.bind(this);

        // Dialog cancel listeners
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
                dialogQueue.confirm({
                    title: `Delete "${this.props.projectName}?"`,
                    body: 'This can\'t be undone.',
                    acceptLabel: 'Delete project'
                }).then(confirmed => {
                    if (confirmed && typeof this.props.onRequestDeleteProject === 'function')
                        this.props.onRequestDeleteProject();
                });
                break;
            case 'new-project':
                if (typeof this.props.onRequestNewProject === 'function')
                    this.props.onRequestNewProject();
                break;
            case 'duplicate-project':
                this.props.onRequestDuplicateProject && this.props.onRequestDuplicateProject();
                break;
            case 'recent-projects':
                if (this.props.user)
                    this.props.onRequestShowOpenProjectDialog && this.props.onRequestShowOpenProjectDialog();
                else
                    dialogQueue.confirm({
                        title: 'Abandon current seating chart?',
                        body: <>
                            <p>If you import a seating chart, the contents of the current seating chart will be lost. This can't be undone.</p>
                            <p>Are you sure you want to continue?</p>
                        </>,
                        acceptLabel: 'Continue'
                    }).then(confirmed => {
                        confirmed && browseForFile().then(result => {
                            const {project, projectName} = result;
                            this.props.onRequestImportProject(project, projectName);
                        }).catch(error => {
                            // To do: recover from error and/or display a message
                        });
                    });
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

    handleSelectExportOption(action) {
        if (action === 'project' && typeof this.props.onRequestExportProject === 'function')
            this.props.onRequestExportProject({format: action});

        else
            this.setState({ exportDialogVisible: true });
    }

    // Dialog cancel listeners
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
                    {this.props.user && <>
                        <ListItem data-name='duplicate-project' onClick={this.handleMenuButtonClick}><ListItemGraphic icon={<CopyIcon />} />Duplicate this chart</ListItem>
                    </>}
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

        <AboutDialog open={this.state.aboutDialogVisible} onClose={this.handleRequestCancelAbout} />

        <ExportImageDialog open={this.state.exportDialogVisible} onCancel={() => this.setState({exportDialogVisible: false})}
            onAccept={options => { this.setState({ exportDialogVisible: false }); this.props.onRequestExportProject(options) }}
            imageWidth={this.props.layoutWidth} imageHeight={this.props.layoutHeight} />
    </React.Fragment>
    }
}

export default MenuDrawer;
