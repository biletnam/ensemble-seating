import React, { PureComponent } from 'react';

import { SimpleDialog } from '@rmwc/dialog';
import { Typography } from '@rmwc/typography';

import '@material/dialog/dist/mdc.dialog.css';
import '@material/typography/dist/mdc.typography.css';
import '@material/textfield/dist/mdc.textfield.css';

class DeleteProjectDialog extends PureComponent {
    constructor(props) {
        super(props);
        this.handleClose = this.handleClose.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleClose(event) {
        if (event.detail.action === 'accept') {
            // Commit changes
            if (typeof this.props.onAccept === 'function')
                this.props.onAccept();
        }
        else {
            // Cancel
            if (typeof this.props.onCancel === 'function')
                this.props.onCancel();
        }
    }

    render() {
        return <SimpleDialog open={this.props.open} title={this.props.title}
            onClose={this.handleClose}
            acceptLabel='Delete project'>
            <Typography tag='p' use='body1'>This can't be undone.</Typography>
        </SimpleDialog>
    }
}

export default DeleteProjectDialog;
