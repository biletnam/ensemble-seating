import React, {PureComponent} from 'react';

import './new-project-dialog.css';
import {templates} from '../templates/index.js';

import {SimpleDialog} from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.css';

import ProjectTile from './project-tile.jsx';

class NewProjectDialog extends PureComponent {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event) {
        if (typeof this.props.onSelectTemplate === 'function')
            this.props.onSelectTemplate(event.target.name);
    }
    
    render() {
        return <SimpleDialog open={this.props.open}
            className='new-project-dialog'
            title='New seating chart'
            onClose={this.props.onClose}
            acceptLabel={null}
            body={
                <div className='project-template-grid'>
                    {templates.map(template => (
                        <ProjectTile key={template.id}
                            name={template.id}
                            onClick={this.handleClick}
                            title={template.name}
                            data={JSON.parse(JSON.stringify(template.data))} />
                    ))}
                </div>
            }
        />
    }
}

export default NewProjectDialog;
