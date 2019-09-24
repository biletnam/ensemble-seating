import React from 'react';
import { Slider } from '@rmwc/slider';
import '@material/slider/dist/mdc.slider.min.css';

const LabeledSlider = props => {
    return <div>
        <Slider min={props.min} max={props.max} step={props.step}
                disabled={props.disabled}
                value={props.value}
                onInput={event => props.onChange(event.target.value)} />
        <span>{props.value}{props.label}</span>
    </div>
};

export default LabeledSlider;
