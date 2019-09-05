export const seatSize = 32;
export const seatGap = 1;
export const regionGap = 2 * seatSize;

export function sumRows(rows) {
    let sum = 0;
    for (let i=0; i<rows.length; i++) {
        sum = sum + parseInt(rows[i], 10);
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

/**
 * Gets the section's absolute offset from the front of the ensemble
 * @param {object} currentSection 
 * @param {number} numOfRows 
 * @returns {number}
 */
function getRowOffset(currentSection, numOfRows) {
    let rowOffset = 0;
    if (currentSection.offsetType === 'custom-row')
        rowOffset = parseInt(currentSection.offsetValue, 10) - 1;
    else if (currentSection.offsetType === 'last-row')
        rowOffset = numOfRows;

    return rowOffset;
}

export function generateRows(sectionData) {
    // 1.) find how many rows there are, ignoring 'last-row' offsets
    // 2.) then, find the 'last-row' section with the most number of rows
    //     and add it to the total
    let lastRowMax = 0;
    let origNumOfRows = Math.max(...sectionData.map(section => {
        let returnValue = 0;

        if (section.offsetType === 'first-row')
            returnValue = section.rowSettings.length;
        else if (section.offsetType === 'custom-row') {
            const rowOffset = parseInt(section.offsetValue, 10);
            returnValue = section.rowSettings.length + rowOffset;
        }
        else if (section.rowSettings.length > lastRowMax)
            lastRowMax = section.rowSettings.length;

        return returnValue;        
    }));

    const numOfRows = origNumOfRows + lastRowMax;

    const rows = [];
    
    for (let i=0; i<numOfRows; i++) {
        const currentRow = [];
        
        // Determine if implicit seats would be needed to maintain section alignment
        // Conditions (any or all):
        // 1.) A section has an offsetType of 'last-row'
        // 2.) A section has an offsetType of 'custom-row' and we're not to that row yet
        // 3.) No sections have seats in the current row
        let implicitNeeded = sectionData.some(currentSection => {
            if (currentSection.offsetType === 'last-row')
                return true;
            else {
                const rowOffset = getRowOffset(currentSection, origNumOfRows);
                const hasCurrent = typeof currentSection.rowSettings[i - rowOffset] === 'number',
                    hasPrevious = typeof currentSection.rowSettings[(i - rowOffset) - 1] === 'number';
    
                return hasCurrent && hasPrevious;
            }
        });

        for (const currentSection of sectionData) {
            // If it has seats in the current row, add them to the current row.
            // Otherwise, reuse the settings from the last available row if
            // at least one other section had seats in the previous row.

            // This helps sections with multiple rows keep their shape as
            // as they go to the back of the ensemble and help seats stay
            // aligned with others in their section from row to row.
            const rowOffset = getRowOffset(currentSection, origNumOfRows);
            
            let currentRowLength,
                implicit = false;

            currentRowLength = currentSection.rowSettings[i - rowOffset];
            if (typeof currentRowLength === 'undefined' && implicitNeeded && currentSection.offsetType !== 'last-row') {
                implicit = true;
                if (!(currentSection.offsetType === 'custom-row' && rowOffset > i))
                    currentRowLength = currentSection.rowSettings[currentSection.rowSettings.length - 1];
            }

            if (typeof currentRowLength === 'number' && (!implicit || (implicit && implicitNeeded))) {
                for (let k=0; k<currentRowLength; k++) {
                    // Create a seat and add it to the current row
                    currentRow.push({
                        id: `${currentSection.id}-[${i},${k}]`,
                        section: currentSection.id,
                        seat: sumRows(currentSection.rowSettings.slice(0, i - rowOffset)) + k,
                        member: null,
                        implicit,
                        color: currentSection.color
                    });
                }
            }
        }

        rows.push(currentRow);
    }

    // Determine which sections need to be rendered mirror image
    const sectionDirectionTotals = sectionData.reduce((acc, currentSection) => {
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

/**
 * 
 * @param {Number} cx X coordinate of the central point for the rotation
 * @param {Number} cy Y coordinate of the central point for the rotation
 * @param {Number} x The original X coordinate
 * @param {Number} y The original Y coordinate
 * @param {Number} angle An angle, in degrees, by which to rotate the point
 * @returns {Array<Number>}
 */
function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
}

export function getPositionOnCurve (seatNum, rowLength, angle) {
    const percentOfArc = angle / 180;

    const position = {x: null, y: null};
    const step = (Math.PI * percentOfArc) / rowLength;

    position.x = Math.cos(step * seatNum);
    position.y = Math.sin(step * seatNum);

    // If there's an angle, rotate the point
    const rotationInDegrees = -.5 *  (180 - angle);
    const [rotatedX, rotatedY] = rotate(0, 0, position.x, position.y, rotationInDegrees);
    position.x = rotatedX;
    position.y = rotatedY;

    return position;
}

export function curveRows(rowData, angle, options = {seatSize, seatGap}) {
    const rows = JSON.parse(JSON.stringify(rowData));
    const increasePerRow = options.seatSize * (options.seatGap + 1);

    if (Array.isArray(rows) && rows.length > 0) {
        const firstRowWidth = rows[0].length * options.seatSize * .5;

        for (let i=0; i<rows.length; i++) {
            const count = rows[i].length - 1;

            for (let k=0; k<rows[i].length; k++) {
                // Get position as a percentage 0.0-1.0
                const position = getPositionOnCurve(k, count, angle);

                // Multiply by the on-screen dimensions of each row to get pixel values
                // Start at a fixed size for the first row, then increase radius for each row
                rows[i][k].x = position.x * (firstRowWidth + (i * increasePerRow));
                rows[i][k].y = position.y * (firstRowWidth + (i * increasePerRow));

                rows[i][k].x -= (.5 * options.seatSize);
            }
        }

        // Normalize dimensions (shift values to the right so they don't arc around 0,0)
        const [regionWidth, regionHeight] = getLayoutDimensions(rows.flat(), options);
        const offset = .5 * regionWidth;
        for (let i=0; i<rows.length; i++) {
            for (const seat of rows[i])
                seat.x += offset;
        }
    }

    return rows;
}

export function straightenRows(rowData, options = {seatSize, seatGap}) {
    const rows = JSON.parse(JSON.stringify(rowData));

    if (Array.isArray(rows) && rows.length > 0) {
        let xMax = 0,
            xMin = 0;
        for (let i=0; i<rows.length; i++) {
            for (let k=0; k<rows[i].length; k++) {
                const xVal = (k * options.seatSize) + (k * (options.seatSize * options.seatGap));
                const yVal = (i * options.seatSize) + (i * (options.seatSize * options.seatGap));
                rows[i][k].x = xVal;
                rows[i][k].y = yVal;

                if (xVal > xMax)
                    xMax = xVal;
                else if (xVal < xMin)
                    xMin = xVal;
            }
        }

        // Center rows
        const maxRowWidth = (xMax - xMin) + options.seatSize;
        for (let i=0; i<rows.length; i++) {
            const [width, height] = getLayoutDimensions(rows[i], options);
            const diff = maxRowWidth - width;
            const offset = diff * .5;
            for (const seat of rows[i]) {
                seat.x += offset;
            }
        }
    }

    return rows;
}

export function trimOuterSpacing (seats) {
    const result = JSON.parse(JSON.stringify(seats));
    const minX = Math.min(...result.map(seat => seat.x));
    const minY = Math.min(...result.map(seat => seat.y));

    for (let i=0; i<result.length; i++) {
        result[i].x -= minX;
        result[i].y -= minY;
    }

    return result;
}

export function seatMembers (membersBySection, rows) {
    const seatedRows = rows.map(currentRow => currentRow.map(currentSeat => {
        const member = membersBySection[currentSeat.section][currentSeat.seat];
        return Object.assign({}, currentSeat, {member: member ? member : null});
    }));

    return seatedRows;
}

export function getLayoutDimensions (positionedSeats, options = {seatSize}) {
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (let i=0; i<positionedSeats.length; i++) {
        const currentX = positionedSeats[i].x,
            currentY = positionedSeats[i].y;
        
        if (currentX < minX) minX = currentX;
        if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY;
        if (currentY > maxY) maxY = currentY;
    }

    return adjustDimensionsForSeatSize(maxX - minX, maxY - minY, options);
}

function adjustDimensionsForSeatSize (width, height, options = {seatSize}) {
    return [width + options.seatSize + 1, height + options.seatSize + 1];
}

function sumArray(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b) : 0;
}

function ensureEnoughSeats(rowLengths, numOfMembers) {
        // Duplicate the last row until there are enough seats
        const result = rowLengths.slice();
        while (sumArray(result) < numOfMembers)
            result.push(result[result.length - 1]);
        return result;
}

export function calculateSeatPositions(regions, sections, members, options) {
    const seatsByRegion = [];
    const dimensionsByRegion = [];

    let maxSeatX = 0,
        maxSeatY = 0,
        minSeatX = 0,
        minSeatY = 0;
    for (let i=0; i<regions.length; i++) {
        const region = regions[i];
        const includedSections = sections.filter(section => section.region === region.id);
        const regionOffset = i > 0 ? maxSeatY + regionGap : 0;

        let maxRegionX = 0,
            maxRegionY = 0,
            minRegionX = 0,
            minRegionY = 0;

        const membersBySection = {};
        for (const currentSection of includedSections) {
            membersBySection[currentSection.id] = members.filter(member => member.section === currentSection.id);
        }
        
        const rows = generateRows(includedSections.map(section => Object.assign({}, section, {
            rowSettings: ensureEnoughSeats(section.rowSettings, membersBySection[section.id].length)
        })));

        // Seat members if any are passed
        let seatedRows = seatMembers(membersBySection, rows);

        // Curve rows if necessary, and set container dimensions for scrolling
        if (region.curvedLayout)
            seatedRows = curveRows(seatedRows, region.angle, options);
        else
            seatedRows = straightenRows(seatedRows, options);

        // Normalize coordinates
        const trimmedSeats = trimOuterSpacing(seatedRows.flat());
        for (const row of seatedRows) {
            // Update each seat with the new positions from trimmedSeats
            for (const seat of row) {
                const trimmed = trimmedSeats.find(value => value.id === seat.id);
                if (trimmed)
                    Object.assign(seat, trimmed);
                
                // Update the y coordinate for the current region
                seat.y += regionOffset;

                // Finally, check if this seat exceeds the current max
                if (seat.x > maxRegionX)
                    maxRegionX = seat.x;
                if (seat.y > maxRegionY)
                    maxRegionY = seat.y;
                if (seat.x < minRegionX)
                    minRegionX = seat.x;
                if (seat.y < minRegionY)
                    minRegionY = seat.y;
            }
        }

        // Update the overall layout
        if (maxRegionX > maxSeatX)
            maxSeatX = maxRegionX;
        if (maxRegionY > maxSeatY)
            maxSeatY = maxRegionY;
        if (minRegionX < minSeatX)
            minSeatX = minRegionX;
        if (minRegionY < minSeatY)
            minSeatY = minRegionY;

        // Store the info
        seatsByRegion.push(seatedRows.flat());
        dimensionsByRegion.push({
            xMax: maxRegionX,
            yMax: maxRegionY,
            xMin: minRegionX,
            yMin: minRegionY
        });
    }

    // Horizontally center all regions in the layout
    if (seatsByRegion.length > 1) {
        const [layoutWidth, layoutHeight] = adjustDimensionsForSeatSize(maxSeatX - minSeatX, maxSeatY - minSeatY, options);
        for (let i=0; i<seatsByRegion.length; i++) {
            const region = seatsByRegion[i];
            const dimensions = dimensionsByRegion[i];
    
            // Get the width of the current region
            const [regionWidth, regionHeight] = adjustDimensionsForSeatSize(
                dimensions.xMax - dimensions.xMin,
                dimensions.yMax - dimensions.yMin,
                options
            );
    
            const diff = layoutWidth - regionWidth;
            const offset = diff * .5;
    
            // Add the difference to the X value of every seat in the region
            for (const seat of region)
                seat.x += offset;
        }
    }
    
    return seatsByRegion.flat();
}

function flipStageDirection(positionedSeats, options) {
    const seats = JSON.parse(JSON.stringify(positionedSeats));
    const [layoutWidth, layoutHeight] = getLayoutDimensions(seats, options);
    for (const seat of seats) {
        seat.x = (seat.x * -1) + layoutWidth;
        seat.y = (seat.y * -1) + layoutHeight;
    }
    return trimOuterSpacing(seats);
}

export function renderSVG (regions, sections, members, settings) {
    let seats = calculateSeatPositions(regions, sections, members, settings);
    const [layoutWidth, layoutHeight] = getLayoutDimensions(seats, settings);

    if (!settings.downstageTop)
        seats = flipStageDirection(seats, settings);

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    svg.setAttribute('width', layoutWidth);
    svg.setAttribute('height', layoutHeight);
    svg.setAttribute('viewbox', `0 0 ${layoutWidth} ${layoutHeight}`);

    seats.filter(seat => !(seat.implicit && !settings.implicitSeatsVisible && !seat.member)).forEach((seat, index) => {
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('width', settings.seatSize || seatSize);
        rect.setAttribute('height', settings.seatSize || seatSize);
        rect.setAttributeNS(ns, 'stroke', 'black');
        rect.setAttributeNS(ns, 'strokeWidth', '1');
        rect.setAttributeNS(ns, 'fill', seat.color);
        rect.setAttributeNS(ns, 'x', seat.x);
        rect.setAttributeNS(ns, 'y', seat.y);
        svg.appendChild(rect);
    });

    return svg;
}

export function renderImage (regions, sections, members, options) {
    let seats = calculateSeatPositions(regions, sections, members, options);
    const [layoutWidth, layoutHeight] = getLayoutDimensions(seats, options);

    if (!options.downstageTop)
        seats = flipStageDirection(seats, options);

    const exportWidth = options.width || layoutWidth;
    const exportHeight = options.height || layoutHeight;
    const scale = exportWidth / layoutWidth;

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    const ctx = canvas.getContext('2d');
    
    // Todo: option to control PNG transparency
    if (!(options.format === 'png' && options.transparency)) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, exportWidth, exportHeight);
    }

    ctx.strokeStyle = '#000';

    seats.filter(seat => !(seat.implicit && !options.implicitSeatsVisible && !seat.member)).forEach((seat, index) => {
        ctx.fillStyle = seat.color;
        const x = Math.floor(seat.x * scale) + .5;
        const y = Math.floor(seat.y * scale) + .5;
        const width = Math.floor(options.seatSize * scale);
        const height = Math.floor(options.seatSize * scale);
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
    });

    return canvas.toDataURL(`image/${options.format}`, options.quality);
}
