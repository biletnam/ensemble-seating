import React, {Component} from 'react';

import { Typography } from '@rmwc/typography';
import { TextField, TextFieldIcon, TextFieldHelperText } from '@rmwc/textfield';
import { IconButton } from '@rmwc/icon-button';

import '@material/typography/dist/mdc.typography.css';
import '@material/textfield/dist/mdc.textfield.css';
import '@material/icon-button/dist/mdc.icon-button.css';

class MemberEditor extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleClickedDelete = this.handleClickedDelete.bind(this);
    }

    handleChange(event) {
        const itemName = event.target.getAttribute('name');

        const newData = {};
        newData[itemName] = event.target.value;

        if (typeof this.props.onRequestEdit === 'function')
            this.props.onRequestEdit(this.props.data.id, newData);
    }

    handleClickedDelete() {
        if (this.props.onRequestDelete)
            this.props.onRequestDelete(this.props.data.id);
    }

    render() {
        return <div>
            <div>
                <TextField label='Name' name='name' value={this.props.data.name} onChange={this.handleChange} />
            </div>
            <br />
            <div>
                <TextField textarea label='Notes' name='notes' value={this.props.data.notes} onChange={this.handleChange} />
            </div>
        </div>
    }
}

export default MemberEditor;
