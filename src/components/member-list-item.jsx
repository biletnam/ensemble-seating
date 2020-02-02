import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';

import PlainInput from './plain-input.jsx';
import DescriptionIcon from '../icons/description-24px.svg';

import { Drag as DragTypes } from '../types';

import AddIcon from '../icons/add-24px.svg';
import PersonIcon from '../icons/person-24px.svg';

import './member-list-item.css';

const MemberListItemAction = props => {
    const {label, icon, ...rest} = props;
    return <button title={label} aria-label={label} className='member-list-item__action' {...rest}>{icon}</button>
};

const MemberListItemHandle = React.forwardRef((props, ref) => {
    return <div ref={ref} className='member-list-item__handle'>{props.children}</div>
});

const MemberListItem = props => {
    const [{isDragging}, dragRef, previewRef] = useDrag({
        item: { type: DragTypes.ROSTER_SEAT, id: props.memberId },
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const inputRef = useRef(null);

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

    function handleClickAdd() {
        inputRef.current.focus();
    }

    return <div ref={previewRef} className='member-list-item'>
        {props.data && <MemberListItemHandle ref={dragRef}><PersonIcon /></MemberListItemHandle>}
        {!props.data && <MemberListItemAction label='Add section member' icon={<AddIcon />} onClick={handleClickAdd} />}
        <PlainInput placeholder='(empty)'
            value={(props.data && props.data.name) || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            ref={inputRef} />
        {props.data && props.onEdit && <MemberListItemAction label='Add/edit notes'
            icon={<DescriptionIcon />}
            onClick={() => props.onSelect && props.onSelect()} />
        }
    </div>;
}

export default MemberListItem;
