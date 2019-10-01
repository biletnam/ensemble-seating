import React, { PureComponent } from 'react';

import { DEFAULT_SECTION_ROW_LENGTH } from '../helpers/project-helpers.js';

import { TwitterPicker } from 'react-color';

import { TextField } from '@rmwc/textfield';
import { Button } from '@rmwc/button';
import { Radio } from '@rmwc/radio';

import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/button/dist/mdc.button.min.css';
import '@material/radio/dist/mdc.radio.min.css';
import '@material/form-field/dist/mdc.form-field.min.css';

import IntegerInput from './integer-input.jsx';

import './edit-section.css';

import ClearIcon from '../icons/clear-24px.svg';

class SectionEditor extends PureComponent {
    constructor(props) {
        super(props);

        this.handleColorChange = this.handleColorChange.bind(this);
        this.handleClickedAddRow = this.handleClickedAddRow.bind(this);
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

    handleColorChange(color, event) {
        this.updateSectionColor(color.hex);
    }

    handleClickedAddRow(event) {
        const saveData = {};
        saveData['rowSettings'] = this.props.data['rowSettings'].slice();
        saveData['rowSettings'].push(DEFAULT_SECTION_ROW_LENGTH)

        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, saveData);
    }

    handleClickedRemoveRow(row) {
        if (this.props.data.rowSettings.length > 1) {
            const saveData = {};
            saveData.rowSettings = this.props.data.rowSettings.slice();
            saveData.rowSettings.splice(row, 1);

            if (this.props.onRequestEdit)
                this.props.onRequestEdit(this.props.data.id, saveData);
        }
    }

    render() {
        const {data, onRequestEdit, ...rest} = this.props;
        return <div {...rest}>
            {data && <>
                <div>
                    <TextField label='Name' name='name' data-setting-type='name' value={data.name} onChange={event => this.updateSectionName(event.target.value)} />
                </div>
                
                <div>
                    <h2>Color</h2>
                    <TwitterPicker color={data.color} onChange={this.handleColorChange} />
                </div>
                
                <div>
                    <h2>Performers per row</h2>
                    <p>Pick how many performers may be seated within each row of this section.</p>
                    {data.rowSettings.map((current, index) => <div key={index + '-rowSettings'} className='section-editor__row-setting-container'>
                        <IntegerInput label={`Row ${index + 1}`} min={0} value={current} onChange={value => {this.updateRowSetting(index, value)}} />
                        <Button className='text-input-wrapper' label='Remove row' icon={<ClearIcon />} onClick={() => this.handleClickedRemoveRow(index)} />
                    </div>)}
                    <Button outlined onClick={this.handleClickedAddRow} raised>Add row</Button>
                </div>

                <div>
                    <h2>Position</h2>
                    <p>Pick how close to the front of the ensemble this section's seats should begin.</p>
                    <div>
                        <Radio value='first-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={event => this.updateSectionOffsetType(event.target.value)}
                            checked={data.offsetType === 'first-row'}>Front of ensemble</Radio><br />

                        <Radio value='custom-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={event => this.updateSectionOffsetType(event.target.value)}
                            checked={data.offsetType === 'custom-row'}>Start on row:</Radio><br />

                        <IntegerInput disabled={data.offsetType !== 'custom-row'}
                            value={data.offsetValue}
                            min={0}
                            onChange={value => this.updateSectionOffsetValue(value)} />

                        <Radio value='last-row' name='offsetType'
                            data-setting-type='offsetType'
                            onChange={event => this.updateSectionOffsetType(event.target.value)}
                            checked={data.offsetType === 'last-row'}>Back of ensemble</Radio>
                    </div>
                </div>
            </>}
        </div>
    }
}

export default SectionEditor;
