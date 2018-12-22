const seatSize = 32;

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
                    implicit
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
        const midpoint = Math.floor((currentRow.length - 1) / 2);
        for (let i=0; i<currentRow.length; i++) {
            const currentSeat = currentRow[i];
            if (i < midpoint) {
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
    const percentRadius = 100;
    const position = {x: null, y: null};
    const step = Math.PI / rowLength;

    position.x = (percentRadius * Math.cos(step * seatNum)) / 100;
    position.y = (percentRadius * Math.sin(step * seatNum)) / 100;

    return position;
}

export function curveRows(rows) {
    if (Array.isArray(rows) && rows.length > 0) {
        const firstRowWidth = rows[0].length * (seatSize * .5);

        for (let i=0; i<rows.length; i++) {
            const count = rows[i].length - 1;


            for (let k=0; k<rows[i].length; k++) {
                // Get position as a percentage 0.0-1.0
                const position = getPositionOnCurve(k, count);

                // Multiply by the on-screen dimensions of each row to get pixel values
                // Start at a fixed size for the first row, then increase radius for each row
                rows[i][k].x = position.x * (firstRowWidth + (i * seatSize * 2));
                rows[i][k].y = position.y * (firstRowWidth + (i * seatSize * 2));
            }
        }
    }
}

export function seatMembers (membersBySection, rows) {
    const seatedRows = rows.map(currentRow => currentRow.map(currentSeat => {
        const member = membersBySection[currentSeat.section][currentSeat.seat];
        return Object.assign({}, currentSeat, {member: member ? member.id : null});
    }));

    // Collapse implicit, unoccupied seats that are adjacent to explicit seats
    for (let i=0; i<seatedRows.length; i++) {
        if (seatedRows[i].some(seat => seat.implicit && !seat.member)) {
            // Row contains at least one empty, implicit seat
            // Split array into groups of implicit + unoccupied, and explicit.
            let seatGroups = seatedRows[i].reduce((acc, currentSeat) => {
                // Check the last seat of the last group to see if we need to start a new group
                const lastGroup = acc[acc.length - 1];
                const lastSeat = lastGroup.length > 0 ? lastGroup[lastGroup.length - 1] : null;
                if (lastSeat && ((lastSeat.implicit && !Boolean(currentSeat.member)) !== (currentSeat.implicit && !Boolean(currentSeat.member))))
                    acc.push([]);

                // Add the current seat to the last group
                acc[acc.length - 1].push(currentSeat);
                return acc;
            }, [[]]);

            // For each group of explicit seats, do the following:
            seatGroups.forEach((currentGroup, currentIndex) => {
                let seatsToRemove = currentGroup[0].implicit && !Boolean(currentGroup[0].member) ? 0 : currentGroup.length;
                while (seatsToRemove > 0) {
                    // Check if there are implicit/unoccupied seats on either side
                    let emptyOnLeft = 0, emptyOnRight = 0;
                    if (currentIndex > 0 && seatGroups[currentIndex - 1].length > 0 && seatGroups[currentIndex - 1][0].implicit && !Boolean(seatGroups[currentIndex - 1][0].member))
                        emptyOnLeft = seatGroups[currentIndex - 1].length;

                    if (currentIndex + 1 < seatGroups.length && seatGroups[currentIndex + 1].length > 0 && seatGroups[currentIndex + 1][0].implicit && !Boolean(seatGroups[currentIndex + 1][0].member))
                        emptyOnRight = seatGroups[currentIndex + 1].length;

                    if (emptyOnLeft === 0 && emptyOnRight === 0)
                        break;
                    else {
                        // Remove implicit/unoccupied seats from groups adjacent to the explicit group,
                        // favoring whichever side has more adjacent implicit/unoccupied seats.

                        if (emptyOnLeft > emptyOnRight)
                            seatGroups[currentIndex - 1].pop();
                        else
                            seatGroups[currentIndex + 1].splice(0, 1);

                        seatsToRemove--;
                    }
                }
            });
            seatedRows[i] = [].concat(...seatGroups);
        }
    }

    return seatedRows;
}

export function getLayoutDimensions (rows) {
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let i=0; i<rows.length; i++) {
        for (let k=0; k<rows[i].length; k++) {
            const currentX = rows[i][k].x,
                currentY = rows[i][k].y;
            
            if (currentX < minX) minX = currentX;
            if (currentX > maxX) maxX = currentX;
            if (currentY < minY) minY = currentY;
            if (currentY > maxY) maxY = currentY;
        }
    }

    return [(maxX - minX) + seatSize, (maxY - minY) + seatSize];
}
