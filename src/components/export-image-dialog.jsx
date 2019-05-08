import React, { useState, useEffect } from 'react';

import { SimpleDialog } from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.min.css';

import { Select } from '@rmwc/select';
import '@material/select/dist/mdc.select.min.css';
import '@material/floating-label/dist/mdc.floating-label.min.css';
import '@material/notched-outline/dist/mdc.notched-outline.min.css';
import '@material/line-ripple/dist/mdc.line-ripple.min.css';

import { TextField } from '@rmwc/textfield';
import '@material/textfield/dist/mdc.textfield.min.css';

import { Slider } from '@rmwc/slider';
import '@material/slider/dist/mdc.slider.min.css';

function ExportImageDialog (props) {
    const [format, setFormat] = useState('jpeg');
    const [quality, setQuality] = useState(100);
    const [transparency, setTransparency] = useState(false);
    const [originalWidth, setOriginalWidth] = useState(props.imageWidth);
    const [originalHeight, setOriginalHeight] = useState(props.imageHeight);
    const [width, setWidth] = useState(Math.floor(originalWidth) || 640);
    const [height, setHeight] = useState(Math.floor(originalHeight) || 360);

    useEffect(() => {
        if ((props.imageWidth != originalWidth) || (props.imageHeight != originalHeight)) {
            setOriginalWidth(props.imageWidth);
            setOriginalHeight(props.imageHeight);
            setWidth(Math.floor(props.imageWidth));
            setHeight(Math.floor(props.imageHeight));
        }
    });

    function handleClose (event) {
        if (event.detail.action === 'accept') {
            // Pass a copy of the export settings to the parent
            if (typeof props.onAccept === 'function')
                props.onAccept({format, quality: quality / 100, transparency, width, height});
        }
        else {
            // Cancel
            if (typeof props.onCancel === 'function')
                props.onCancel();
        }
    }

    return <SimpleDialog open={props.open} title='Export as image'
            onClose={handleClose}
            acceptLabel='Export'
            onStateChange={state => state === 'opened' && window.dispatchEvent(new Event('resize'))}>
            <h2>Format</h2>
            <div className='text-input-wrapper'>
                <Select label='Format' value={format} onChange={event => setFormat(event.target.value)}
                    options={[
                        { label: 'JPEG', value: 'jpeg' },
                        { label: 'PNG', value: 'png' },
                        { label: 'SVG', value: 'svg'}
                ]} />
            </div>
            
            {(format === 'jpeg' || format === 'png') && <>
                {format === 'jpeg' && <>
                    <h3>Quality</h3>
                    <div className='text-input-wrapper'>
                        <Slider 
                            min={1} max={100} discrete
                            value={quality}
                            onInput={event => setQuality(event.target.value)} />
                    </div>
                </>}

                {format === 'png' && <>
                    <label className='text-input-wrapper'>
                        <input type='checkbox' checked={transparency} onChange={event => setTransparency(event.target.checked)} />
                        <span>&nbsp;Transparency</span>
                    </label>
                </>}

                <h2>Dimensions</h2>
                <div className='text-input-wrapper'>
                    <TextField pattern='\d+' label='Width'
                        data-setting-type='width'
                        onChange={event => setWidth(event.target.value)}
                        onBlur={event => {
                            const newWidth = parseInt(event.target.value),
                                newHeight = Math.floor(width * (height / width));
                            setWidth(newWidth);
                            setHeight(newHeight);
                        }}
                        value={width} />
                </div>
                <div className='text-input-wrapper'>
                    <TextField pattern='\d+' label='Height'
                        data-setting-type='height'
                        onChange={event => setHeight(event.target.value)}
                        onBlur={event => {
                            const newHeight = parseInt(event.target.value),
                                newWidth = Math.floor(newHeight * (width / height));
                            setHeight(newHeight);
                            setWidth(newWidth)
                        }}
                        value={height} />
                </div>
            </>}
        </SimpleDialog>
}

export default ExportImageDialog;
