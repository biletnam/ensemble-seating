import React, { useState } from 'react';
import { Slider } from '@rmwc/slider';
import '@material/slider/dist/mdc.slider.css';

const LabeledSlider = props => {
    const [liveValue, setLiveValue] = useState(null);

    const currentValue = liveValue || props.value;

    return <div>
        <Slider min={props.min} max={props.max} step={props.step}
                disabled={props.disabled}
                value={currentValue}
                onInput={event => setLiveValue(event.target.value)}
                onChange={event => { setLiveValue(null); props.onChange(event.target.value) }} />
        <span>{currentValue}{props.label}</span>
    </div>
};

export default LabeledSlider;
