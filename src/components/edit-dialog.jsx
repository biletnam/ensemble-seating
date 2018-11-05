import React, {Component} from 'react';

import {SimpleDialog} from '@rmwc/dialog';
import {Typography} from '@rmwc/typography';

import '@material/dialog/dist/mdc.dialog.css';
import '@material/typography/dist/mdc.typography.css';

import SectionEditor from './edit-section.jsx';
import MemberEditor from './edit-member.jsx';
import {cloneSection, clonePerson} from '../helpers/project-helpers.js';

class EditDialog extends Component {
    constructor(props) {
        super(props);

        this.CurrentEditor = props.editorType === 'section' ? SectionEditor : MemberEditor;
        this.state = null;
        if (props.data) {
            if (props.editorType === 'section') {
                this.state = cloneSection(props.data);
            }
            else {
                this.state = clonePerson(props.data);
            }
        }

        this.handleClose = this.handleClose.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        let needsUpdate = false;
        if (prevProps.data && !this.props.data)
            needsUpdate = true;
        
        if (this.props.data && !prevProps.data)
            needsUpdate = true;

        if (prevProps.data && this.props.data && (prevProps.data.id !== this.props.data.id))
            needsUpdate = true;

        if (needsUpdate) {
            let newData = null;
            if (this.props.data) {
                newData = this.props.editorType === 'section' ? cloneSection(this.props.data) : clonePerson(this.props.data);
            }
            this.setState(newData);
        }
    }

    handleClose(event) {
        if (event.detail.action === 'accept') {
            // Commit changes
            if (typeof this.props.onAccept === 'function')
                this.props.onAccept(this.props.data.id, this.state);
        }
        else {
            // Cancel
            if (typeof this.props.onCancel === 'function')
                this.props.onCancel();
        }
    }

    handleEdit(id, data) {
        this.setState(data);
    }

    render() {
        let currentEditor
        return <SimpleDialog open={this.props.open}
            title={this.props.title}
            onClose={this.handleClose}
            body={this.state ? <this.CurrentEditor data={this.state} onRequestEdit={this.handleEdit} /> : null}
            />
    }
}

export default EditDialog;
