import React, { PureComponent } from 'react';

import { DEFAULT_SECTION_ROW_LENGTH } from '../helpers/project-helpers.js';

import { TwitterPicker } from 'react-color';

import { TextField } from '@rmwc/textfield';
import { Button } from '@rmwc/button';
import { IconButton } from '@rmwc/icon-button';
import { Radio } from '@rmwc/radio';

import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/button/dist/mdc.button.min.css';
import '@material/icon-button/dist/mdc.icon-button.min.css';
import '@material/radio/dist/mdc.radio.min.css';
import '@material/form-field/dist/mdc.form-field.min.css';

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

    updateRowSetting(row, value) {
        const saveData = {};
        saveData.rowSettings = this.props.data.rowSettings.slice();
        saveData.rowSettings[row] = value;

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
            this.updateRowSetting(rowIndex, event.target.value);
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
            this.updateRowSetting(rowIndex, isNaN(valueAsInt) ? 0 : valueAsInt);
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
        saveData['rowSettings'].push(DEFAULT_SECTION_ROW_LENGTH)

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
        const {data, ...rest} = this.props;
        return <div {...rest}>
            {data && <React.Fragment>
                <div>
                    <TextField label='Name' name='name' data-setting-type='name' value={data.name} onChange={this.handleChange} />
                </div>
                
                <div>
                    <h2>Color</h2>
                    <TwitterPicker color={data.color} onChange={this.handleColorChange} />
                </div>
                
                <div>
                    <h2>Performers per row</h2>
                    <p>Pick how many performers may be seated within each row of this section.</p>
                {data.rowSettings.map((current, index) => <div key={index + '-rowSettings'} className='text-input-wrapper'>
                    <TextField label={`Row ${index + 1}`} data-row={index} data-setting-type='rowSettings' value={current} onChange={this.handleChange} onBlur={this.handleRowBlur} />
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
                            checked={data.offsetType === 'first-row'}>Front of ensemble</Radio><br />
                        <Radio value='custom-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={this.handleChange}
                            checked={data.offsetType === 'custom-row'}>Start on row:</Radio><br />
                        <TextField pattern='\d+' disabled={data.offsetType !== 'custom-row'}
                            data-setting-type='offsetValue'
                            onChange={this.handleChange}
                            onBlur={this.handleRowBlur}
                            value={data.offsetValue} /><br />

                        <Radio value='last-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={this.handleChange}
                            checked={data.offsetType === 'last-row'}>Back of ensemble</Radio>
                    </div>
                </div>
            </React.Fragment>}
            
        </div>
    }
}

export default SectionEditor;
