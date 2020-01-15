import React, { useState } from 'react';

import { Button } from '@rmwc/button';
import '@material/button/dist/mdc.button.min.css';

import ClearIcon from '../icons/clear-24px.svg';

import './section-layout-editor.css';

import { DEFAULT_SECTION_ROW_LENGTH } from '../helpers/project-helpers.js';
import { sumRows } from '../helpers/stage-helpers.js';

const SectionLayoutEditor = props => {
    const [draggingOver, setDraggingOver] = useState(null);
    function handleDragStart (event) {
        console.log(`Start dragging seat from row ${event.target.dataset.row}`);
        event.dataTransfer.dropEffect = 'move';
        event.dataTransfer.setData("text/plain", event.target.dataset.row);
    }

    function handleDragOver (event) {
        event.preventDefault();
        // console.log(`Dragging seat over row ${event.target.dataset.row}`);
    }

    function handleDrop (event) {
        event.preventDefault();
        const sourceRow = parseInt(event.dataTransfer.getData('text/plain'), 10);
        const targetRow = parseInt(event.currentTarget.dataset.row, 10);
        if (sourceRow !== targetRow) {
            console.log(`Move seat from row ${sourceRow} to row ${targetRow}`);
            const newData = props.rowSettings.slice();
            newData[sourceRow] -= 1;
            newData[targetRow] += 1;
            props.onRowUpdate && props.onRowUpdate(newData);
        }
        setDraggingOver(null);
    }

    function handleClickedNewSeat (row) {
        const newData = props.rowSettings.slice();
        newData[row] += 1;
        props.onRowUpdate && props.onRowUpdate(newData);
    }

    function handleCLickedDeleteSeat (row) {
        const newData = props.rowSettings.slice();
        newData[row] -= 1;
        props.onRowUpdate && props.onRowUpdate(newData);
    }

    function handleClickedNewRow () {
        const newData = props.rowSettings.slice();
        newData.push(newData[newData.length - 1] || DEFAULT_SECTION_ROW_LENGTH);
        props.onRowUpdate && props.onRowUpdate(newData);
    }

    function handleClickedRemoveRow (row) {
        const newData = props.rowSettings.slice();
        newData.splice(row, 1);
        props.onRowUpdate && props.onRowUpdate(newData);
    }

    const rows = [];
    for (let i=0; i<props.rowSettings.length; i++) {
        const thisRow = [];
        for (let k=0; k<props.rowSettings[i]; k++) {
            thisRow.push(<div className='section-layout-item' key={`row-${i}-item-${k}`}
                draggable='true' data-row={i}
                onDragStart={handleDragStart}>
                    <button title='Remove seat' onClick={() => handleCLickedDeleteSeat(i)} className='section-layout-item__delete-button'>&times;</button>
                </div>);
        }

        rows.push(<li className={`section-layout-row${draggingOver === i ? ' section-layout-row--dragging-over' : ''}`} key={`row-${i}-container`}
            onDragOver={handleDragOver} onDrop={handleDrop} onDragEnter={() => setDraggingOver(i)}
            data-row={i}>
                {thisRow}
                <button title='Add seat' onClick={() => handleClickedNewSeat(i)} className='section-layout-item section-layout-item--placeholder'>+</button>
                <div className='section-layout-row__meta-and-settings'>
                    <span>{props.rowSettings[i]} seats</span>
                    {props.rowSettings.length > 1 && <Button dense title='Remove row' onClick={() => handleClickedRemoveRow(i)} icon={<ClearIcon />}>Remove</Button>}
                </div>
            </li>);
    }

    if (!props.downstageTop) {
        rows.reverse();
    }

    return <>
        {!props.downstageTop && <p><Button dense raised onClick={handleClickedNewRow}>Add row</Button></p>}
        <ol reversed={!props.downstageTop} className='section-layout-container'>{rows}</ol>
        {props.downstageTop && <p><Button dense raised onClick={handleClickedNewRow}>Add row</Button></p>}
        <p>Total: {sumRows(props.rowSettings)} seats</p>
    </>
}

export default SectionLayoutEditor;
