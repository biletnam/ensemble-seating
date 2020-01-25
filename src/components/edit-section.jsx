import React, { PureComponent } from 'react';

import { TwitterPicker } from 'react-color';

import { TextField } from '@rmwc/textfield';
import { Radio } from '@rmwc/radio';

import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/radio/dist/mdc.radio.min.css';
import '@material/form-field/dist/mdc.form-field.min.css';

import IntegerInput from './integer-input.jsx';
import SectionLayoutEditor from './section-layout-editor.jsx';

class SectionEditor extends PureComponent {
    constructor(props) {
        super(props);

        this.handleColorChange = this.handleColorChange.bind(this);
        this.handleRowUpdate = this.handleRowUpdate.bind(this);
    }

    updateSectionName(newName) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.editorId, {name: newName});
    }

    updateSectionColor(newColor) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.editorId, {color: newColor});
    }

    updateSectionOffsetType(newType) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.editorId, {offsetType: newType});
    }

    updateSectionOffsetValue(newValue) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.editorId, {offsetValue: newValue});
    }

    handleColorChange(color, event) {
        this.updateSectionColor(color.hex);
    }

    handleRowUpdate (rowSettings) {
        const data = JSON.parse(JSON.stringify(this.props.data));
        data.rowSettings = rowSettings;
        this.props.onRequestEdit && this.props.onRequestEdit(this.props.editorId, data);
    }

    render() {
        const {data, onRequestEdit, editorId, downstageTop, ...rest} = this.props;
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
                    <h2>Layout</h2>
                    <p>Pick how many performers may be seated within each row of this section.</p>
                    <SectionLayoutEditor onRowUpdate={this.handleRowUpdate}
                        rowSettings={data.rowSettings} downstageTop={downstageTop} />
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
