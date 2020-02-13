import React, { useState, useEffect, useRef } from 'react';
import tinycolor from 'tinycolor2';
import { useDrag, useDrop } from 'react-dnd';

import PlainInput from './plain-input.jsx';

import { Drag as DragTypes } from '../types';

import './seat.css';

const Seat = props => {
    const [{isDragging}, dragRef] = useDrag({
        item: { type: DragTypes.SEAT, id: props.memberId },
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const [{ isOver, dragInProgress }, dropRef] = useDrop({
		accept: DragTypes.SEAT,
		drop: (item, monitor) => props.onDropMember(item.id),
		collect: monitor => ({
            isOver: !!monitor.isOver(),
            dragInProgress: monitor.getItem() && (monitor.getItemType() === DragTypes.SEAT)
		}),
    });

    const [isEditing, setIsEditing] = useState(false);

    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current && inputRef.current.focus();
        }
    }, [isEditing]);

    function handleClick(event) {
        if (props.selected || !isOccupied) {
            setIsEditing(true);
        }
        else {
            setIsEditing(true);
        }
        if (isOccupied) {
            props.onClick(event);
        }
    }

    function handleInputKeydown(event) {
        if (event.keyCode === 13 || event.keyCode === 27) {
            inputRef.current && inputRef.current.blur();
            setIsEditing(false);
        }
    }

    function handleBlur(event) {
        setIsEditing(false);
        props.onBlur(event);
    }

    const isOccupied = !(!props.label);

    const style = {
        backgroundColor:  props.color,
        color: tinycolor(props.color).isLight() ? '#333' : '#fff',
        visibility: props.visible ? '' : 'hidden',
        left: typeof props.x === 'number' && !isNaN(props.x) ? Math.round(props.x) : 'unset',
        bottom: typeof props.y === 'number' && !isNaN(props.y) ? Math.round(props.y) : 'unset'
    };

    let className = 'seat';
    if (props.implicit) {
        className += ' seat--implicit';
    }
    if (isOccupied || isEditing) {
        className += ' seat--occupied';
    }
    else if (isOver && dragInProgress) {
        className += ' seat--drop-hover';
    }
    if (isEditing) {
        className += ' seat--editing'
    }
    if (props.selected) {
        className += ' seat--selected';
    }

    const seatNumberDisplay = props.seatNumber > -1 ? props.seatNumber + 1 : null;

    return <span className={className}
        ref={isOccupied ? dragRef : dropRef}
        data-seat-number={seatNumberDisplay}
        style={style} onClick={handleClick}>
            {isEditing && <PlainInput ref={inputRef}
                value={props.label || ''}
                onChange={event => props.onTextChange(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleInputKeydown} />
            }
            {!isEditing && props.label}
    </span>
}

export default Seat;
