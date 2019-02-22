import React, { Component } from 'react';

import './inline-input.css';

class InlineInput extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: props.value
        }

        this.autosaveTimeout = null;
        this.shouldCommitChanges = true;

        this.autosaveTimeoutExpired = this.autosaveTimeoutExpired.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value)
            this.setState({value: this.props.value});
    }

    commitChanges() {
        if (typeof this.props.onChange === 'function' && this.state.value !== this.props.value) {
            this.props.onChange(this.state.value);
        }
    }

    cancelChanges() {
        this.setState({value: this.props.value});
    }

    autosaveTimeoutExpired() {
        this.autosaveTimeout = null;
        this.commitChanges();
    }

    resetTimeout() {
        if (typeof this.props.autosaveTimeout === 'number') {
            if (typeof this.autosaveTimeout === 'number')
                clearTimeout(this.autosaveTimeout);
            
            this.autosaveTimeout = setTimeout(this.autosaveTimeoutExpired, this.props.autosaveTimeout);
        }
    }

    handleChange(event) {
        this.shouldCommitChanges = true;
        this.resetTimeout();
        this.setState({value: event.target.value});
    }

    handleBlur() {
        this.autosaveTimeout = clearTimeout(this.autosaveTimeout);
        if (this.shouldCommitChanges)
            this.commitChanges();
        else
            this.cancelChanges();
    }

    handleKeyDown(event) {
        if (event.keyCode === 13) {
            this.shouldCommitChanges = true;
            event.target.blur();
        }
        else if (event.keyCode === 27) {
            this.shouldCommitChanges = false;
            event.target.blur();
        }
    }

    render() {
        return <input className='inline-input'
            type='text'
            value={this.state.value || ''}
            placeholder={this.props.placeholder}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onKeyDown={this.handleKeyDown} />
    }
}

export default InlineInput;
