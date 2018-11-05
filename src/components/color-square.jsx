import React, { Component } from 'react';

const ColorSquare = props => (
    <div className='color-square' style={{backgroundColor: props.color, marginLeft: '1em'}} />
);

export default ColorSquare;
