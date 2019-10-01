import React from 'react';

import { TextField } from '@rmwc/textfield';
import '@material/textfield/dist/mdc.textfield.css';
import '@material/floating-label/dist/mdc.floating-label.css';
import '@material/notched-outline/dist/mdc.notched-outline.css';
import '@material/line-ripple/dist/mdc.line-ripple.css';

import { IconButton } from '@rmwc/icon-button';
import '@material/icon-button/dist/mdc.icon-button.css';

import './integer-input.css';

import AddIcon from '../icons/add-24px.svg';
import RemoveIcon from '../icons/remove-24px.svg';

const IntegerInput = props => {
    const {onChange, min, max, className, ...rest} = props;

    function handleChange (event) {
        const valueAsInteger = parseInt(event.target.value, 10);
        onChange(isNaN(valueAsInteger) ? 0 : clamp(valueAsInteger));
    }

    function clamp (value) {
        let result = value;
        if (typeof min == 'number' && value < min)
            result = min;
        else if (typeof max == 'number' && value > max)
            result = max;
        return result;
    }

    function decrement () {
        onChange(clamp(props.value - 1));
    }

    function increment () {
        onChange(clamp(props.value + 1));
    }

    function handleButton (event) {
        if (event.target.dataset.direction == 'up')
            increment();
        else
            decrement();
    }

    function handleKeyDown (event) {
        if (event.keyCode == 38)
            increment();
        else if (event.keyCode == 40)
            decrement();
    }

    return <div className='integer-input'>
        <IconButton data-direction='down' onClick={handleButton} disabled={props.disabled || (typeof min == 'number' && props.value <= min)} icon={<RemoveIcon />} />
        <TextField {...rest} className={`integer-input__text-field${className ? className : ''}`}
            onChange={handleChange} onKeyDown={handleKeyDown} disabled={props.disabled} />
        <IconButton data-direction='up' onClick={handleButton} disabled={props.disabled} icon={<AddIcon />} />
    </div>
}

export default IntegerInput;
