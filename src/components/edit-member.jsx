import React, { PureComponent } from 'react';

import { TextField } from '@rmwc/textfield';

import '@material/typography/dist/mdc.typography.min.css';
import '@material/textfield/dist/mdc.textfield.min.css';
import '@material/icon-button/dist/mdc.icon-button.min.css';

class MemberEditor extends PureComponent {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        const itemName = event.target.getAttribute('name');

        const newData = {};
        newData[itemName] = event.target.value;

        if (typeof this.props.onRequestEdit === 'function')
            this.props.onRequestEdit(this.props.editorId, newData);
    }

    render() {
        const {data, onRequestEdit, editorId, className='', id='', ...rest} = this.props;
        return <div className={className} id={id}>
            {data && <React.Fragment>
                <div>
                    <TextField label='Name' name='name' value={data.name} onChange={this.handleChange} />
                </div>
                <br />
                <div>
                    <TextField textarea outlined fullwidth label='Notes' name='notes' value={data.notes} onChange={this.handleChange} />
                </div>
            </React.Fragment>}
        </div>
    }
}

export default MemberEditor;
