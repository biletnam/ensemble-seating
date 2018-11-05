import React, {Component} from 'react';

import {SimpleDialog} from '@rmwc/dialog';
import {Typography} from '@rmwc/typography';
import {Select} from '@rmwc/select';
import {Switch} from '@rmwc/switch';

import '@material/dialog/dist/mdc.dialog.css';
import '@material/typography/dist/mdc.typography.css';
import '@material/select/dist/mdc.select.css';
import '@material/floating-label/dist/mdc.floating-label.css';
import '@material/notched-outline/dist/mdc.notched-outline.css';
import '@material/line-ripple/dist/mdc.line-ripple.css';
import '@material/switch/dist/mdc.switch.css';
import '@material/form-field/dist/mdc.form-field.css';

class ProjectSettingsDialog extends Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(event) {
        if (typeof this.props.onChange === 'function') {
            const newSetting = {};
            if (event.target.name === 'curvedLayout' || event.target.name === 'implicitSeatsVisible') {
                // Toggle
                newSetting[event.target.name] = event.target.checked;
            }
            else
                newSetting[event.target.name] = event.target.value;
            
            this.props.onChange(newSetting);
        }
    }

    render() {
        return <SimpleDialog open={this.props.isOpen}
        onClose={this.props.onClose}
        title='Display options'
        acceptLabel='Done'
        cancelLabel={null}
        body={<div>
                <div className='text-input-wrapper'>
                    <Select value={this.props.seatNameLabels}
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
                    <Switch checked={this.props.curvedLayout}
                        onChange={this.onChange}
                        name='curvedLayout'>Curved layout</Switch>
                </div>
                
                <div className='text-input-wrapper'>
                    <Switch checked={this.props.implicitSeatsVisible}
                        onChange={this.onChange}
                        name='implicitSeatsVisible'>Show auto-generated seats</Switch>
                </div>
        </div>}
        acceptLabel='Close'
        cancelLabel={null} />
    }
};

export default ProjectSettingsDialog;
