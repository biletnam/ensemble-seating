export const seatSize = 32;
export const seatGap = .5 * seatSize;
export const regionGap = 2 * seatSize;

export function sumRows(rows) {
    let sum = 0;
    for (let i=0; i<rows.length; i++) {
        sum = sum + parseInt(rows[i].min, 10);
    }
    return sum;
}

export function getInitials(name) {
    let initials = "";
    const splitName = name.split(' ');
    for (let i=0; i<splitName.length; i++) {
        initials += splitName[i][0] || '';
    }
    return initials;
}

export function generateRows(sectionData) {
    let numOfRows = Math.max(...sectionData.map(section => {
        let returnValue = 0;
        if (section.offsetType === 'first-row' || (section.offsetType === 'custom-row' && parseInt(section.offsetValue, 10) === 0))
            returnValue = section.rowSettings.length;
        return returnValue;        
    }));

    // Check offset settings, and pad the start of its rows if necessary
    const sections = sectionData.map(currentSection => {
        if (currentSection.offsetType === 'custom-row' || currentSection.offsetType === 'last-row') {
            const result = JSON.parse(JSON.stringify(currentSection));

            const offsetValue = currentSection.offsetType === 'last-row' ? numOfRows + 1 : parseInt(currentSection.offsetValue, 10);
            if (!isNaN(offsetValue)) {
                for (let i=1; i<offsetValue; i++) {
                    result.rowSettings.unshift({min: 0, max: 0});
                }
            }
            
            return result;
        }
        else
            return currentSection;
    });

    // Update row count, in case it was changed while calculating offsets
    numOfRows = Math.max(...sections.map(section => section.rowSettings.length));

    const rows = [];
    
    for (let i=0; i<numOfRows; i++) {
        const currentRow = [];

        for (const currentSection of sections) {
            // If it has seats in the current row, add them to the current row.
            // Otherwise, reuse the settings from the last available row.
            let currentRowSettings = currentSection.rowSettings[i],
                implicit = false;
            if (typeof currentRowSettings === 'undefined') {
                implicit = true;
                currentRowSettings = currentSection.rowSettings[currentSection.rowSettings.length - 1];
            }
            for (let k=0; k<currentRowSettings.min; k++) {
                // Create a seat and add it to the current row
                currentRow.push({
                    id: `${currentSection.id}-[${i},${k}]`,
                    section: currentSection.id,
                    seat: sumRows(currentSection.rowSettings.slice(0, i)) + k,
                    member: null,
                    implicit,
                    color: currentSection.color
                });
            }
        }

        rows.push(currentRow);
    }

    // Determine which sections need to be rendered mirror image
    const sectionDirectionTotals = sections.reduce((acc, currentSection) => {
        acc[currentSection.id] = {
            firstHalf: 0,
            secondHalf: 0,
            mirror: null,
            x: null,
            y: null
        };
        return acc;
    }, {});

    for (const currentRow of rows) {
        const midpoint = Math.floor(currentRow.length / 2);
        for (let i=0; i<currentRow.length; i++) {
            const currentSeat = currentRow[i];
            if (i <= midpoint) {
                sectionDirectionTotals[currentSeat.section].firstHalf++
            }
            else
                sectionDirectionTotals[currentSeat.section].secondHalf++;
        }
    }

    Object.keys(sectionDirectionTotals).forEach(currentId => {
        const currentSection = sectionDirectionTotals[currentId];
        currentSection.mirror = currentSection.secondHalf > currentSection.firstHalf;
    });

    // For each section that needs to be mirrored, reverse its members within each row
    Object.keys(sectionDirectionTotals).filter(sectionId => sectionDirectionTotals[sectionId].mirror).forEach(sectionId => {
        for (const currentRow of rows) {
            let startIndex, endIndex;
            startIndex = currentRow.findIndex(seat => seat.section === sectionId);
            
            for (let i=currentRow.length - 1; i>-1; i--) {
                if (currentRow[i].section === sectionId) {
                    endIndex = i + 1;
                    break;
                }
            }

            // Only attempt to reverse members if the section actually has members in the current row
            if (startIndex > -1 && endIndex > -1) {
                const mirroredSeats = currentRow.slice(startIndex, endIndex);
                mirroredSeats.reverse();

                currentRow.splice(startIndex, endIndex - startIndex, ...mirroredSeats);
            }
        }
    });
    return rows;
}

export function getPositionOnCurve (seatNum, rowLength) {
    const position = {x: null, y: null};
    const step = Math.PI / rowLength;

    position.x = Math.cos(step * seatNum);
    position.y = Math.sin(step * seatNum);

    return position;
}

export function curveRows(rowData) {
    const rows = JSON.parse(JSON.stringify(rowData));

    if (Array.isArray(rows) && rows.length > 0) {
        const firstRowWidth = rows[0].length * seatGap;

        for (let i=0; i<rows.length; i++) {
            const count = rows[i].length - 1;

            for (let k=0; k<rows[i].length; k++) {
                // Get position as a percentage 0.0-1.0
                const position = getPositionOnCurve(k, count);

                // Multiply by the on-screen dimensions of each row to get pixel values
                // Start at a fixed size for the first row, then increase radius for each row
                rows[i][k].x = position.x * (firstRowWidth + (i * seatSize * 2));
                rows[i][k].y = position.y * (firstRowWidth + (i * seatSize * 2));

                rows[i][k].x -= (.5 * seatSize);
            }
        }

        // Normalize dimensions (shift values to the right so they don't arc around 0,0)
        const [regionWidth, regionHeight] = getLayoutDimensions(rows.flat());
        const offset = .5 * regionWidth;
        for (let i=0; i<rows.length; i++) {
            for (const seat of rows[i])
                seat.x += offset;
        }
    }

    return rows;
}

export function straightenRows(rowData) {
    const rows = JSON.parse(JSON.stringify(rowData));

    if (Array.isArray(rows) && rows.length > 0) {
        let xMax = 0,
            xMin = 0;
        for (let i=0; i<rows.length; i++) {
            for (let k=0; k<rows[i].length; k++) {
                // Temporary: use 1/2 seat of space between all seats
                const xVal = (k * seatSize) + (k * seatGap);
                const yVal = (i * seatSize) + (i * seatGap);
                rows[i][k].x = xVal;
                rows[i][k].y = yVal;

                if (xVal > xMax)
                    xMax = xVal;
                else if (xVal < xMin)
                    xMin = xVal;
            }
        }

        // Center rows
        const maxRowWidth = (xMax - xMin) + seatSize;
        for (let i=0; i<rows.length; i++) {
            const [width, height] = getLayoutDimensions(rows[i]);
            const diff = maxRowWidth - width;
            const offset = diff * .5;
            for (const seat of rows[i]) {
                seat.x += offset;
            }
        }
    }

    return rows;
}

export function seatMembers (membersBySection, rows) {
    const seatedRows = rows.map(currentRow => currentRow.map(currentSeat => {
        const member = membersBySection[currentSeat.section][currentSeat.seat];
        return Object.assign({}, currentSeat, {member: member ? member : null});
    }));

    // Collapse implicit, unoccupied seats that are adjacent to explicit seats
    for (let i=0; i<seatedRows.length; i++) {
        let explicitCount = seatedRows[i].filter(current => !(current.implicit && current.member === null)).length;
        while (explicitCount > 0) {
            // Find an implicit, unoccupied seat adjacent to a seat that is explicit, occupied, or both
            let indexToRemove = seatedRows[i].findIndex((current, index) => {
                let found = false;
                if (current.implicit && current.member === null) {
                    const previousSeat = seatedRows[i][index - 1];
                    const nextSeat = seatedRows[i][index + 1];

                    if ((previousSeat && !(previousSeat.implicit && previousSeat.member === null)) || (nextSeat && !(nextSeat.implicit && nextSeat.member === null)))
                        found = true;
                }
                return found;
            });

            // If no implicit, unoccupied seats are adjacent to an explict seat, select the first implicit, unoccupied seat
            if (indexToRemove === -1)
                indexToRemove = seatedRows[i].findIndex(current => current.implicit && current.member === null);
                
            if (indexToRemove > -1) {
                seatedRows[i].splice(indexToRemove, 1);
                explicitCount--;
            }
            else {
                explicitCount = 0;
            }
        }
    }

    return seatedRows;
}

export function getLayoutDimensions (positionedSeats) {
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let i=0; i<positionedSeats.length; i++) {
        const currentX = positionedSeats[i].x,
            currentY = positionedSeats[i].y;
        
        if (currentX < minX) minX = currentX;
        if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY;
        if (currentY > maxY) maxY = currentY;
    }

    return [(maxX - minX) + seatSize, (maxY - minY) + seatSize];
}

export function calculateSeatPositions(regions, sections, members) {
    const seatsByRegion = [];

    for (let i=0; i<regions.length; i++) {
        const region = regions[i];
        const includedSections = sections.filter(section => section.region === region.id);

        let rows = generateRows(includedSections);

        const membersBySection = {};
        for (let k = 0; k < sections.length; k++) {
            const currentSection = sections[k];
            membersBySection[currentSection.id] = members.filter(member => member.section === currentSection.id);
        }

        // Seat members if any are passed
        let seatedRows = seatMembers(membersBySection, rows);

        // Curve rows if necessary, and set container dimensions for scrolling
        if (region.curvedLayout)
            seatedRows = curveRows(seatedRows);
        else
            seatedRows = straightenRows(seatedRows);

        // Flatten seatedRows
        const flattenedSeats = seatedRows.flat();

        // Find the max Y coordinate of seats in seatsToRender, and offset this region by that amount
        let regionOffset = 0;
        if (i > 0) {
            // Get the maximum y coordinate of the last region
            const [previousRegionWidth, previousRegionHeight] = getLayoutDimensions(seatsByRegion[i - 1]);
            regionOffset = previousRegionHeight + regionGap;
        }
        
        for (let k=0; k<flattenedSeats.length; k++) {
            flattenedSeats[k].y += regionOffset;
        }

        seatsByRegion.push(flattenedSeats);
    }

    // Curved rows arc around 0,0
    // Find the maximum x coordinate, and center everything based on that
    let maxX = 0,
        minX = 0;

    seatsByRegion.forEach(region => {
        region.forEach(seat => {
            if (seat.x > maxX)
                maxX = seat.x;
            if (seat.x < minX)
                minX = seat.x;
        });
    });

    const [layoutWidth, layoutHeight] = getLayoutDimensions(seatsByRegion.flat());

    for (const region of seatsByRegion) {
        // Get the width of the current region
        const [regionWidth, regionHeight] = getLayoutDimensions(region);

        const diff = layoutWidth - regionWidth;
        const offset = diff * .5;

        // Add the difference to the X value of every seat in the region
        for (const seat of region)
            seat.x += offset;
    }
    
    return seatsByRegion.flat();
}
