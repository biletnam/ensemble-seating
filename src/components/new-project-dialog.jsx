import React, {PureComponent, useState, useEffect} from 'react';

import './new-project-dialog.css';
import * as templates from '../templates';

import {SimpleDialog} from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.min.css';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.css';

import { ListItem, ListGroup } from '@rmwc/list';
import '@material/list/dist/mdc.list.min.css';

import ProjectTile from './project-tile.jsx';
import { listProjects } from '../helpers/firebase.js';
import { mapProjects, sortProjects } from './project-list.jsx';

const LIST_ITEM_HEIGHT = 48;

const NewProjectDialog = props => {
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        if (props.open && props.user) {
            listProjects(props.user).then(projects => {
                const sortedProjects = sortProjects(mapProjects(projects), 'modified', 1);
                setRecentProjects(sortedProjects.slice(0, 3));
            });
        }
    }, [props.open, props.user]);

    function handleBrowse () {
        if (props.user) {
            // Switch to the "Open project" dialog to show all projects
            props.onRequestShowOpenProjectDialog && props.onRequestShowOpenProjectDialog();
        }        
    }
    
    return <SimpleDialog open={props.open}
        className='new-project-dialog'
        title='New seating chart'
        onClose={props.onClose}
        acceptLabel={null}
        cancelLabel={props.showFirstLaunch ? null : undefined}
        body={<>
            <div className='project-template-grid'>
                {Object.entries(templates).map(([id, template]) => (
                    <ProjectTile key={id} id={id}
                        onClick={props.onSelectTemplate}
                        title={template.name}
                        data={JSON.parse(JSON.stringify(template.data))} />
                ))}
            </div>

            {props.showFirstLaunch && <>
                <h3>Recent</h3>

                {props.user && <>
                    <ListGroup style={{minHeight: `${recentProjects.length * LIST_ITEM_HEIGHT}px`}}>
                        {recentProjects.map(project => (
                            <ListItem key={project.name}
                                data-project={project.name}
                                onClick={event => props.onRequestOpenProject(event.target.dataset.project)}>
                                    {project.name}
                                </ListItem>
                        ))}
                    </ListGroup>
                    
                    <p className='text-input-wrapper'>
                        <Button onClick={() => handleBrowse()} raised>More projects&hellip;</Button>
                    </p>
                </>}

                {!props.user && <p>
                    <Button raised onClick={props.onRequestLogin}>Sign in with Google</Button>
                </p>}
            </>}
        </>}
    />
}

export default NewProjectDialog;
