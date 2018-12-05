import React, {Component} from 'react';

import {Switch} from '@rmwc/switch';
import { TextField, TextFieldIcon, TextFieldHelperText } from '@rmwc/textfield';

import '@material/switch/dist/mdc.switch.css';
import '@material/textfield/dist/mdc.textfield.css';

class RegionEditor extends Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        const saveData = {};

        if (event.target.hasOwnProperty('checked'))
            saveData[event.target.name] = event.target.checked;
        else
            saveData[event.target.name] = event.target.value;

        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, saveData);
    }

    render() {
        return <div>
            {this.props.data && <React.Fragment>
                <div className='text-input-wrapper'>
                    <TextField label='Name' name='name' value={this.props.data.name} onChange={this.handleChange} />
                </div>

                <div className='text-input-wrapper'>
                    <Switch checked={this.props.data.curvedLayout}
                        onChange={this.handleChange}
                        name='curvedLayout'>Curved layout</Switch>
                </div>
            </React.Fragment>}
        </div>
    }
}

export default RegionEditor;
