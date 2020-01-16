import React from 'react';

import PlainInput from './plain-input.jsx';
import PlainInputAction from './plain-input-action.jsx';
import DescriptionIcon from '../icons/description-24px.svg';

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

    return <PlainInput placeholder='(empty)'
        value={(props.data && props.data.name) || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        actions={props.data && props.onEdit ? [
            <PlainInputAction label='Add/edit notes'
                icon={<DescriptionIcon />}
                onClick={() => props.onSelect && props.onSelect()} />
        ] : []} />;
}

export default MemberListItem;
