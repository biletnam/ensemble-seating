import React, { PureComponent } from 'react';

import ProjectList from './project-list.jsx';

import { Dialog, DialogTitle, DialogContent, DialogActions, DialogButton } from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.min.css';
import { browseForFile } from '../helpers/project-helpers.js';

class OpenProjectDialog extends PureComponent {
    constructor (props) {
        super(props);
        this.state = {
            lastShown: Date.now()
        };

        this.handleClose = this.handleClose.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.open && !prevProps.open)
            this.setState({lastShown: Date.now()});
    }

    handleClose(event) {
        if (event.detail.action === 'browse'){
            browseForFile().then(result => {
                const {project, projectName} = result;
                this.props.onRequestImportProject(project, projectName);
            }).catch(error => {
                // To do: recover from error and/or display a message
            });
        }
        else
            this.props.onClose && this.props.onClose();
    }

    render() {
        return <Dialog open={this.props.open} onClose={this.handleClose}>
                <DialogTitle>Open seating chart</DialogTitle>
                <DialogContent>
                    <ProjectList user={this.props.user} currentProject={this.props.currentProject}
                        onProjectItemClick={this.props.onRequestOpenProject} lastUpdated={this.state.lastShown} />
                </DialogContent>
                <DialogActions>
                    <DialogButton action='cancel'>Cancel</DialogButton>
                    <DialogButton action='browse'>Browse&hellip;</DialogButton>
                </DialogActions>
            </Dialog>;
    }
    
};

export default OpenProjectDialog;
