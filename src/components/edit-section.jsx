import React, {Component} from 'react';

import { createSectionRow } from '../helpers/project-helpers.js';

import { TwitterPicker } from 'react-color';

import { Typography } from '@rmwc/typography';
import { TextField, TextFieldIcon, TextFieldHelperText } from '@rmwc/textfield';
import { Button } from '@rmwc/button';
import { IconButton } from '@rmwc/icon-button';

import '@material/typography/dist/mdc.typography.css';
import '@material/textfield/dist/mdc.textfield.css';
import '@material/button/dist/mdc.button.css';
import '@material/icon-button/dist/mdc.icon-button.css';

import ClearIcon from '../icons/baseline-clear-24px.jsx';

class SectionEditor extends Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleColorChange = this.handleColorChange.bind(this);
        this.handleRowBlur = this.handleRowBlur.bind(this);
        this.handleClickedAddRow = this.handleClickedAddRow.bind(this);
        this.handleRequestedDelete = this.handleRequestedDelete.bind(this);
        this.handleClickedRemoveRow = this.handleClickedRemoveRow.bind(this);
    }

    updateSectionName(newName) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, {name: newName});
    }

    updateSectionColor(newColor) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, {color: newColor});
    }

    updateRowSetting(row, setting, value) {
        const saveData = {};
        saveData.rowSettings = this.props.data.rowSettings.slice();

        const newSetting = Object.assign({}, this.props.data.rowSettings[row]);
        newSetting[setting] = value;

        saveData.rowSettings.splice(row, 1, newSetting);

        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, saveData);
    }

    handleChange(event) {
        const settingType = event.target.getAttribute('data-setting-type');
        if (settingType === 'name') {
            this.updateSectionName(event.target.value);
        }

        else if (settingType === 'rowSettings') {
            const rowIndex = parseInt(event.target.getAttribute('data-row'), 10);
            this.updateRowSetting(rowIndex, event.target.name, event.target.value);
        }

        else {
            const rowIndex = parseInt(event.target.getAttribute('data-row'), 10);
            this.updateRowSetting(settingType, rowIndex, event.target.value);
        }
    }

    handleColorChange(color, event) {
        this.updateSectionColor(color.hex);
    }

    handleRowBlur(event) {
        // If it can be converted to an integer, do it
        const valueAsInt = parseInt(event.target.value, 10);
        if (!isNaN(valueAsInt)) {
            const rowIndex = parseInt(event.target.getAttribute('data-row'), 10);
            this.updateRowSetting(rowIndex, event.target.name, valueAsInt);
        }
    }

    handleRequestedDelete() {
        if (this.props.onRequestDelete)
            this.props.onRequestDelete(this.props.data.id);
    }

    handleClickedAddRow(event) {
        const saveData = {};
        saveData['rowSettings'] = this.props.data['rowSettings'].slice();
        saveData['rowSettings'].push(createSectionRow())

        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, saveData);
    }

    handleClickedRemoveRow(event) {
        const saveData = {};
        const row = parseInt(event.target.getAttribute('data-row'));
        saveData.rowSettings = this.props.data.rowSettings.slice();
        saveData.rowSettings.splice(row, 1);

        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, saveData);
    }

    render() {
        return <div>
            <div><TextField label='Name' name='name' data-setting-type='name' value={this.props.data.name} onChange={this.handleChange} /></div>

            <div>
                <Typography use='headline6' tag='h2'>Color</Typography>
                <TwitterPicker color={this.props.data.color} onChange={this.handleColorChange} />
            </div>

            <div>
                <Typography use='headline6' tag='h2'>Performers per row</Typography>
                <Typography use='body1' tag='h3'>Pick how many performers may be seated within each row of this section.</Typography>
                {this.props.data.rowSettings.map((current, index) => <div key={index + '-rowSettings'} className='text-input-wrapper'>
                    <TextField label={`Row ${index + 1}`} data-row={index} data-setting-type='rowSettings' name='min' value={current.min} onChange={this.handleChange} onBlur={this.handleRowBlur} />
                    <IconButton icon={<ClearIcon />} label='Remove row' onClick={this.handleClickedRemoveRow} data-row={index} />
                </div>)}
                <br />
                <Button onClick={this.handleClickedAddRow}>Add row</Button>
            </div>
        </div>
    }
}

export default SectionEditor;
