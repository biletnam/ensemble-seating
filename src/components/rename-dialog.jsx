import React, {Component} from 'react';

import {SimpleDialog} from '@rmwc/dialog';
import {Typography} from '@rmwc/typography';
import { TextField, TextFieldIcon, TextFieldHelperText } from '@rmwc/textfield';

import '@material/dialog/dist/mdc.dialog.css';
import '@material/typography/dist/mdc.typography.css';
import '@material/textfield/dist/mdc.textfield.css';

class RenameDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value || ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.value !== prevProps.value)
            this.setState({
                value: this.props.value || ''
            });
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleClose(event) {
        if (event.detail.action === 'accept') {
            // Commit changes
            if (typeof this.props.onAccept === 'function')
                this.props.onAccept(this.state.value);
        }
        else {
            // Cancel
            if (typeof this.props.onCancel === 'function')
                this.props.onCancel();
        }
    }

    render() {
        return <SimpleDialog open={this.props.open} title={this.props.title} onClose={this.handleClose}>
            <TextField label={this.props.label} value={this.state.value} onChange={this.handleChange} />
        </SimpleDialog>
    }
}

export default RenameDialog;
