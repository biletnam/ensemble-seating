import React from 'react';

import { Draggable } from 'react-beautiful-dnd';

import './seat-list-item.css';

const SeatListItem = props => {
    const { children, index, seatKey, draggable, ...rest } = props;

    return <Draggable draggableId={seatKey} index={index} isDragDisabled={!draggable} type='member'>
        {(provided, snapshot) => {
            let seatClass = 'seat-list-item';
            if (snapshot.isDragging && !snapshot.isDropAnimating) {
                seatClass += ' seat-list-item--dragging';
            }
            return <li className={seatClass} {...rest}
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}>
                {children}
            </li>
        }}
        
    </Draggable>
}

export default SeatListItem;
