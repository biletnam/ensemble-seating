import React, { PureComponent } from 'react';

import { Switch } from '@rmwc/switch';
import { TextField } from '@rmwc/textfield';
import { Slider } from '@rmwc/slider';

import '@material/switch/dist/mdc.switch.min.css';
import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/slider/dist/mdc.slider.min.css';

class RegionEditor extends PureComponent {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleSliderInput = this.handleSliderInput.bind(this);
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

    handleSliderInput(event) {
        if (this.props.onRequestEdit)
            this.props.onRequestEdit(this.props.data.id, { angle: event.target.value });
    }

    render() {
        return <div>
            {this.props.data && <React.Fragment>
                <div className='text-input-wrapper'>
                    <TextField label='Name' name='name' value={this.props.data.name} onChange={this.handleChange} />
                </div>

                <h2>Shape</h2>
                <div className='text-input-wrapper'>
                    <Switch checked={this.props.data.curvedLayout}
                        onChange={this.handleChange}
                        name='curvedLayout'>&nbsp;Curved layout</Switch>
                </div>

                <div className='text-input-wrapper'>
                    <Slider min={90} max={180} discrete
                        disabled={!this.props.data.curvedLayout}
                        value={this.props.data.angle}
                        onInput={this.handleSliderInput} />
                    <span>Angle: {this.props.data.angle}&deg;</span>
                </div>
            </React.Fragment>}
        </div>
    }
}

export default RegionEditor;
