import React, { PureComponent } from 'react';

import LabeledSlider from './labeled-slider.jsx';

import { SimpleDialog } from '@rmwc/dialog';
import { Select } from '@rmwc/select';
import { Switch } from '@rmwc/switch';

import '@material/dialog/dist/mdc.dialog.css';
import '@material/typography/dist/mdc.typography.css';
import '@material/select/dist/mdc.select.css';
import '@material/floating-label/dist/mdc.floating-label.css';
import '@material/notched-outline/dist/mdc.notched-outline.css';
import '@material/line-ripple/dist/mdc.line-ripple.css';
import '@material/switch/dist/mdc.switch.css';
import '@material/form-field/dist/mdc.form-field.css';

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

class ProjectSettingsDialog extends PureComponent {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(event) {
        if (typeof this.props.onChange === 'function') {
            const newSetting = {};
            if (event.target.name === 'implicitSeatsVisible') {
                // Toggle
                newSetting[event.target.name] = event.target.checked;
            }
            else if (event.target.name === 'seatGap') {
                newSetting[event.target.name] = event.target.value;
            }
            else
                newSetting[event.target.name] = event.target.value;
            
            this.props.onChange(newSetting);
        }
    }

    render() {
        return <SimpleDialog open={this.props.isOpen}
        onClose={this.props.onClose}
        onStateChange={state => {
            if (state === 'opened')
                window.dispatchEvent(new Event('resize'));
        }}
        title='Display options'
        acceptLabel='Done'
        cancelLabel={null}
        body={<div>
                <h3>Labels</h3>
                <div className='text-input-wrapper'>
                    <Select value={this.props.seatNameLabels}
                        label='Label type'
                        onChange={this.onChange}
                        options={[
                            {
                                label: 'Initials',
                                value: 'initials'
                            },
                            {
                                label: 'Full name',
                                value: 'full'
                            }
                        ]}
                        name='seatNameLabels' />
                </div>
                <div className='text-input-wrapper'>
                        <Select value={this.props.seatLabelFontSize}
                            label='Font size'
                            onChange={this.onChange}
                            options={fontSizes}
                            name='seatLabelFontSize' />
                </div>
                
                <h3>Auto-generated seats</h3>
                <div className='text-input-wrapper'>
                    <Switch checked={this.props.implicitSeatsVisible}
                        onChange={this.onChange}
                        name='implicitSeatsVisible'>Show auto-generated seats</Switch>
                </div>

                <h3>Seat size</h3>
                <div className='text-input-wrapper'>
                    <LabeledSlider value={this.props.seatSize}
                        onChange={newValue => this.onChange({
                            target: {
                                name: 'seatSize',
                                value: newValue
                            }
                        })}
                        min={4} max={128} step={4} label='px' />
                </div>

                <h3>Seat spacing</h3>
                <div className='text-input-wrapper'>
                    <LabeledSlider value={this.props.seatGap}
                        onChange={newValue => this.onChange({
                            target: {
                                name: 'seatGap',
                                value: newValue
                            }
                        })}
                        min={0} max={8} step={.5} label=' × seat size' />
                </div>
        </div>}
        acceptLabel='Close'
        cancelLabel={null} />
    }
};

export default ProjectSettingsDialog;
