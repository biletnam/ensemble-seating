import React, { PureComponent } from 'react';

import { createSectionRow } from '../helpers/project-helpers.js';

import { TwitterPicker } from 'react-color';

import { TextField } from '@rmwc/textfield';
import { Button } from '@rmwc/button';
import { IconButton } from '@rmwc/icon-button';
import { Radio } from '@rmwc/radio';

import '@material/textfield/dist/mdc.textfield.css';
import '@material/button/dist/mdc.button.css';
import '@material/icon-button/dist/mdc.icon-button.css';
import '@material/radio/dist/mdc.radio.css';
import '@material/form-field/dist/mdc.form-field.css';

import ClearIcon from '../icons/baseline-clear-24px.jsx';

class SectionEditor extends PureComponent {
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

    updateSectionOffsetType(newType) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, {offsetType: newType});
    }

    updateSectionOffsetValue(newValue) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, {offsetValue: newValue});
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
        const settingType = event.target.dataset.settingType;
        if (settingType === 'name') {
            this.updateSectionName(event.target.value);
        }

        else if (settingType === 'rowSettings') {
            const rowIndex = parseInt(event.target.getAttribute('data-row'), 10);
            this.updateRowSetting(rowIndex, event.target.name, event.target.value);
        }

        else if (settingType === 'offsetType') {
            this.updateSectionOffsetType(event.target.value);
        }

        else if (settingType === 'offsetValue') {
            this.updateSectionOffsetValue(event.target.value);
        }
    }

    handleColorChange(color, event) {
        this.updateSectionColor(color.hex);
    }

    handleRowBlur(event) {
        const settingType = event.target.dataset.settingType;

        const valueAsInt = parseInt(event.target.value, 10);
        if (settingType === 'rowSettings') {
            const rowIndex = parseInt(event.target.getAttribute('data-row'), 10);
            this.updateRowSetting(rowIndex, event.target.name, isNaN(valueAsInt) ? 0 : valueAsInt);
        }

        else if (settingType === 'offsetValue') {
            this.updateSectionOffsetValue(isNaN(valueAsInt) ? 0 : valueAsInt);
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
        if (this.props.data.rowSettings.length > 1) {
            const saveData = {};
            const row = parseInt(event.target.getAttribute('data-row'));
            saveData.rowSettings = this.props.data.rowSettings.slice();
            saveData.rowSettings.splice(row, 1);

            if (this.props.onRequestEdit)
                this.props.onRequestEdit(this.props.data.id, saveData);
        }
    }

    render() {
        return <div>
            {this.props.data && <React.Fragment>
                <div>
                    <h2>Name</h2>
                    <TextField name='name' data-setting-type='name' value={this.props.data.name} onChange={this.handleChange} />
                </div>
                
                <div>
                    <h2>Color</h2>
                    <TwitterPicker color={this.props.data.color} onChange={this.handleColorChange} />
                </div>
                
                <div>
                    <h2>Performers per row</h2>
                    <p>Pick how many performers may be seated within each row of this section.</p>
                {this.props.data.rowSettings.map((current, index) => <div key={index + '-rowSettings'} className='text-input-wrapper'>
                    <TextField label={`Row ${index + 1}`} data-row={index} data-setting-type='rowSettings' name='min' value={current.min} onChange={this.handleChange} onBlur={this.handleRowBlur} />
                    <IconButton icon={<ClearIcon />} label='Remove row' onClick={this.handleClickedRemoveRow} data-row={index} />
                </div>)}
                <br />
                    <Button onClick={this.handleClickedAddRow}>Add row</Button>
                </div>

                <div>
                    <h2>Position</h2>
                    <p>Pick how close to the front of the ensemble this section's seats should begin.</p>
                    <div>
                        <Radio value='first-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={this.handleChange}
                            checked={this.props.data.offsetType === 'first-row'}>Front of ensemble</Radio><br />
                        <Radio value='custom-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={this.handleChange}
                            checked={this.props.data.offsetType === 'custom-row'}>Start on row:</Radio><br />
                        <TextField pattern='\d+' disabled={this.props.data.offsetType !== 'custom-row'}
                            data-setting-type='offsetValue'
                            onChange={this.handleChange}
                            onBlur={this.handleRowBlur}
                            value={this.props.data.offsetValue} /><br />

                        <Radio value='last-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={this.handleChange}
                            checked={this.props.data.offsetType === 'last-row'}>Back of ensemble</Radio>
                    </div>
                </div>
            </React.Fragment>}
            
        </div>
    }
}

export default SectionEditor;
