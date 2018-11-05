import React, {Component} from 'react';

import { TextField } from '@rmwc/textfield';
import { SimpleDialog } from '@rmwc/dialog';

import '@material/textfield/dist/mdc.textfield.css';
import '@material/floating-label/dist/mdc.floating-label.css';
import '@material/notched-outline/dist/mdc.notched-outline.css';
import '@material/line-ripple/dist/mdc.line-ripple.css';

import '@material/select/dist/mdc.select.css';
import '@material/floating-label/dist/mdc.floating-label.css';
import '@material/notched-outline/dist/mdc.notched-outline.css';
import '@material/line-ripple/dist/mdc.line-ripple.css';

import '@material/dialog/dist/mdc.dialog.css';

class BatchAddMembersDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            textareaValue: ''
        }

        this.handleClose = this.handleClose.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleClose(event) {
        if (event.detail.action === 'accept') {
            // To do: split textarea into list
            this.props.onAddMembers(this.state.textareaValue.split(/\r\n|\r|\n/g));
        }
        else
            this.props.onClose();
        this.setState({textareaValue: ''});
    }

    handleChange(event) {
        this.setState({textareaValue: event.target.value});
    }

    render() {
        return <SimpleDialog title='Add multiple people'
            body={<React.Fragment>
                <TextField name='textarea'
                    textarea
                    rows='8'
                    onChange={this.handleChange}
                    value={this.state.textareaValue} />
            </React.Fragment>}
            open={this.props.isOpen}
            onClose={this.handleClose}
            acceptLabel={`Add to ${this.props.title} section`} />
    }
}

export default BatchAddMembersDialog;
