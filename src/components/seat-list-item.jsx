import React from 'react';

import { Draggable } from 'react-beautiful-dnd';

import './seat-list-item.css';

const SeatListItem = props => {
    const { children, index, seatKey, draggable, ...rest } = props;

    return <Draggable draggableId={seatKey} index={index} isDragDisabled={!draggable} type='member'>
        {(provided, snapshot) => (
            <li className='seat-list-item' {...rest}
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}>
                {children}
            </li>
        )}
        
    </Draggable>
}

export default SeatListItem;
