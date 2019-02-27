import React, {Component} from 'react';

import './new-project-dialog.css';
import {templates} from '../templates/index.js';

import {SimpleDialog} from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.css';

class NewProjectDialog extends Component {
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
                        <button type='button' key={template.id}
                            name={template.id}
                            onClick={this.handleClick}
                            className='project-template-button'>
                            <img src={template.thumbnail} alt={`${template.name} seating chart`} />
                            <span>{template.name}</span>
                        </button>
                    ))}
                </div>
            }
        />
    }
}

export default NewProjectDialog;
