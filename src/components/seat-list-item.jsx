import React from 'react';
import { useDrop } from 'react-dnd';

import { Drag as DragTypes } from '../types';
import './seat-list-item.css';

const SeatListItem = props => {
    const [{ isOver, dragInProgress }, dropRef] = useDrop({
		accept: DragTypes.ROSTER_SEAT,
        drop: (item, monitor) => props.onDrop && props.onDrop(item.id),
        canDrop: () => props.droppable,
		collect: monitor => ({
            isOver: !!monitor.isOver(),
            dragInProgress: monitor.getItem() && (monitor.getItemType() === DragTypes.ROSTER_SEAT)
		}),
    });

    let className = 'seat-list-item';
    if (dragInProgress) {
        if (props.droppable && isOver) {
            className += ' seat-list-item--drop-hover';
        }
        else if (!props.droppable) {
            className += ' seat-list-item--drop-disabled';
        }
    }

    return <li className={className} ref={dropRef}>
        {props.children}
    </li>;
}

export default SeatListItem;
