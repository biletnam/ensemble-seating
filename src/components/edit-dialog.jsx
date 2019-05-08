import React, {Component} from 'react';

import {SimpleDialog} from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.min.css';

class EditDialog extends Component {
    constructor(props) {
        super(props);

        this.CurrentEditor = props.editor;
        this.state = props.data ? props.cloneFn(props.data) : null;

        this.handleClose = this.handleClose.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
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
            this.setState(this.props.data ? this.props.cloneFn(this.props.data) : null);
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

    handleStateChange(state) {
        // Workaround for MDC bug: slider handle positioned incorrectly in Dialog
        if (state === 'opened')
            window.dispatchEvent(new Event('resize'));
    }

    handleEdit(id, data) {
        this.setState(data);
    }

    render() {
        return <SimpleDialog open={this.props.open}
            title={this.props.title}
            onClose={this.handleClose}
            onStateChange={this.handleStateChange}
            body={<this.CurrentEditor data={this.state} onRequestEdit={this.handleEdit} />}
        />
    }
}

export default EditDialog;
