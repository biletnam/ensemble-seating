import React, {PureComponent} from 'react';

import './new-project-dialog.css';
import {templates} from '../templates/index.js';

import {SimpleDialog} from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.min.css';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.css';

import ProjectTile from './project-tile.jsx';
import ProjectList from './project-list.jsx';

class NewProjectDialog extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            lastUpdatedProjectList: Date.now()
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleBrowse = this.handleBrowse.bind(this);
    }

    handleClick(event) {
        if (typeof this.props.onSelectTemplate === 'function')
            this.props.onSelectTemplate(event.target.name);
    }

    handleOpen(event) {
        this.setState({lastUpdatedProjectList: Date.now()});
    }

    handleBrowse() {
        if (this.props.user) {
            // Switch to the "Open project" dialog to show all projects
            this.props.onRequestShowOpenProjectDialog && this.props.onRequestShowOpenProjectDialog();
        }        
    }
    
    render() {
        return <SimpleDialog open={this.props.open}
            className='new-project-dialog'
            title='New seating chart'
            onClose={this.props.onClose}
            onOpen={this.onOpen}
            acceptLabel={null}
            cancelLabel={this.props.showFirstLaunch ? null : undefined}
            body={<>
                <div className='project-template-grid'>
                    {templates.map(template => (
                        <ProjectTile key={template.id}
                            name={template.id}
                            onClick={this.handleClick}
                            title={template.name}
                            data={JSON.parse(JSON.stringify(template.data))} />
                    ))}
                </div>

                {this.props.showFirstLaunch && <>
                    <h3>Recent</h3>

                    {this.props.user && <>
                        <ProjectList user={this.props.user}
                            max={3}
                            onProjectItemClick={this.props.onRequestOpenProject}
                            lastUpdated={this.state.lastUpdatedProjectList} />
                        
                        <p className='text-input-wrapper'>
                            <Button onClick={this.handleBrowse} raised>More projects&hellip;</Button>
                        </p>
                    </>}

                    {!this.props.user && <p>
                        <Button raised onClick={this.props.onRequestLogin}>Sign in with Google</Button>
                    </p>}
                </>}
            </>}
        />
    }
}

export default NewProjectDialog;
