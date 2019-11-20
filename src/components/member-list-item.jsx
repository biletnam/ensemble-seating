import React from 'react';

import './member-list-item.css';

const MemberListItem = props => {
    function handleChange(event) {
        if (props.data && props.onEdit)
            props.onEdit(props.memberId, Object.assign({}, props.data, {name: event.target.value}));
        else
            props.onCreate && props.onCreate(event.target.value);
    }

    function handleBlur(event) {
        if (props.memberId && event.target.value === '') {
            // Delete the member
            props.onDelete && props.onDelete(props.memberId);
        }
    }

    return <input className='plain-input'
        placeholder='(empty)'
        value={(props.data && props.data.name) || ''}
        onChange={handleChange}
        onBlur={handleBlur} />;
}

export default MemberListItem;
