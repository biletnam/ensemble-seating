import React, { PureComponent } from 'react';

import { TextField } from '@rmwc/textfield';
import { SimpleDialog } from '@rmwc/dialog';

import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/floating-label/dist/mdc.floating-label.min.css';
import '@material/notched-outline/dist/mdc.notched-outline.min.css';
import '@material/line-ripple/dist/mdc.line-ripple.min.css';

import '@material/dialog/dist/mdc.dialog.min.css';

/**
 * Splits a string of text by newline character
 * @param {string} value 
 * @returns {Array<string>}
 */
function getNames (value) {
    return value.split(/\r\n|\r|\n/g).filter(item => item != '')
}

class BatchAddMembersDialog extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            textareaValue: '',
            selectValue: null
        }

        this.handleClose = this.handleClose.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }

    handleClose(event) {
        if (event.detail.action === 'accept') {
            this.props.onAddMembers(getNames(this.state.textareaValue), parseInt(this.state.selectValue, 10) || 0);
        }
        else
            this.props.onClose();
        this.setState({textareaValue: '', selectValue: null});
    }

    handleChange(event) {
        this.setState({textareaValue: event.target.value});
    }

    handleSelect(event) {
        this.setState({selectValue: event.target.value});
    }

    render() {
        return <SimpleDialog title='Add multiple people'
            body={<React.Fragment>
                <div className='text-input-wrapper'>
                    <TextField name='textarea'
                        textarea
                        outlined
                        fullwidth
                        rows='8'
                        onChange={this.handleChange}
                        value={this.state.textareaValue} />
                </div>
                {this.props.emptySeats && (
                    <label className='text-input-wrapper'>
                        <span>Total: {getNames(this.state.textareaValue).length}</span>

                        <span style={{float: 'right'}}>
                            <span>Start at seat:&nbsp;</span>
                            <select onChange={this.handleSelect}>
                                {this.props.emptySeats.map(seat => <option key={seat} value={seat}>{seat + 1}</option>)}
                            </select>
                        </span>
                    </label>
                )}
            </React.Fragment>}
            open={this.props.isOpen}
            onClose={this.handleClose}
            acceptLabel={`Add to ${this.props.title} section`} />
    }
}

export default BatchAddMembersDialog;
