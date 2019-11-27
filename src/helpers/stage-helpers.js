import { DEFAULT_SECTION_ROW_LENGTH, Region, Section, Member } from '../helpers/project-helpers.js';

export const seatSize = 32;
export const seatGap = 1;
export const regionGap = 2 * seatSize;

/**
 * 
 * @param {Array<number|string>} rows 
 */
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
 * @typedef {Object} SeatData
 * @property {string} id
 * @property {string} section
 * @property {number} seat
 * @property {string} member
 * @property {boolean} implicit
 * @property {string} color
 * @property {number} x
 * @property {number} y
 */

/**
 * 
 * @param {[string, Region|Section|Member]} a 
 * @param {[string, Region|Section|Member]} b 
 */
function byEntryOrder (a, b) {
    if (a[1].order < b[1].order) {
        return -1;
    }
    else if (a[1].order > b[1].order) {
        return 1;
    }
    else {
        return 0;
    }
}

/**
 * 
 * @param {Array<[string, Section]>} sectionEntries 
 * @returns {number}
 */
function getNumberOfRows (sectionEntries) {
    return Math.max(...sectionEntries
        .map(([, sectionData]) => sectionData.rowSettings.length)
    );
}

 /**
  * 
  * @param {Object<string, Section>} sectionData 
  * @return {Array<Array<SeatData>>}
  */
export function generateRows(sectionData) {
    let sectionEntries = Object.entries(sectionData).sort(byEntryOrder);
    let hasLastRowSection = false;

    // Normalize row offsets

    sectionEntries = sectionEntries.map(([sectionId, sectionData], index) => {
        if (sectionData.offsetType === 'first-row') {
            return [sectionId, sectionData];
        }
        else if (sectionData.offsetType === 'custom-row') {
            const paddedRowSettings = sectionData.rowSettings.slice();
            // offsetValue is 1-based - skip 0
            for (let i=1; i<sectionData.offsetValue; i++) {
                paddedRowSettings.unshift(0);
            }
            return [sectionId, Section.fromObject(Object.assign({}, sectionData, {
                rowSettings: paddedRowSettings
            }))];
        }
        else if (sectionData.offsetType === 'last-row') {
            // Check again later to set up 'last-row' offsets
            hasLastRowSection = true;
            return [sectionId, sectionData];
        }
    });

    let numOfRows = getNumberOfRows(
        sectionEntries.filter(([,sectionData]) => sectionData.offsetType !== 'last-row')
    );

    if (hasLastRowSection) {
        // Go through all sections set to 'last-row', offsetting them
        // based on the total number of static rows
        sectionEntries = sectionEntries.map(([sectionId, sectionData]) => {
            if (sectionData.offsetType === 'last-row') {
                const paddedRowSettings = sectionData.rowSettings.slice();
                for (let i=0; i<numOfRows; i++) {
                    paddedRowSettings.unshift(0);
                }
                return [sectionId, Section.fromObject(Object.assign({}, sectionData, {
                    rowSettings: paddedRowSettings
                }))];
            }
            else {
                return [sectionId, sectionData];
            }
        });
        numOfRows = getNumberOfRows(sectionEntries);
    }

    /**
     * @type {Array<Array<SeatData>>}
     */
    const rows = [];
    
    for (let i=0; i<numOfRows; i++) {
        const currentRow = [];

        // If there exists a section with seats in the current row that also had seats in the
        // previous row, other sections need to contribute implicit seats past their last row.

        // This helps sections with multiple rows keep their shape as
        // as they go to the back of the ensemble and help seats stay
        // aligned with others in their section from row to row.
        const implicitNeeded = sectionEntries.some(([entryId, entryData]) => {
            if (entryData.offsetType === 'last-row' && entryData.rowSettings[i] > 0) {
                return true;
            }
            else {
                return typeof entryData.rowSettings[i] === 'number'
                && entryData.rowSettings[i] > 0
                && entryData.rowSettings.slice(0, i)
                        .some(rowLength => (typeof rowLength === 'number' && rowLength > 0));
            }
        });

        for (const [sectionId, currentSection] of sectionEntries) {
            // If it has seats in the current row, add them to the current row.
            // Otherwise, reuse the settings from the last available row.
            let currentRowLength = currentSection.rowSettings[i],
                implicit = false;

            // If the section doesn't have any seats in the current row because we're past the end,
            // it should still contribute "implicit" seats to help keep the other sections aligned
            // if implicit seats are needed for the current row (see above).
            if (implicitNeeded && typeof currentRowLength === 'undefined' && i >= currentSection.rowSettings.length) {
                implicit = true;
                currentRowLength = currentSection.rowSettings[currentSection.rowSettings.length - 1];
            }

            for (let k=0; k<currentRowLength; k++) {
                // Create a seat and add it to the current row
                currentRow.push({
                    id: `${sectionId}-[${i},${k}]`,
                    section: sectionId,
                    seat: sumRows(currentSection.rowSettings.slice(0, i)) + k,
                    member: null,
                    implicit,
                    color: currentSection.color,
                    x: 0,
                    y: 0
                });
            }
        }

        rows.push(currentRow);
    }

    // Determine which sections need to be rendered mirror image
    /**
     * @typedef SectionDirectionTotals
     * @property {number} firstHalf
     * @property {number} secondHalf
     * @property {boolean} mirror
     * @property {number} x
     * @property {number} y
     */

     /**
      * @type {Object<string, SectionDirectionTotals>}
      */
    const sectionDirectionTotals = sectionEntries.reduce((totals, [sectionId, currentSection]) => {
        totals[sectionId] = {
            firstHalf: 0,
            secondHalf: 0,
            mirror: null,
            x: null,
            y: null
        };
        return totals;
    }, {});

    for (const currentRow of rows) {
        const midpoint = currentRow.length / 2;
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
    sectionEntries.filter(([sectionId,]) => sectionDirectionTotals[sectionId].mirror)
        .forEach(([sectionId, sectionData]) => {
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
                if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
                    const mirroredSeats = currentRow.slice(startIndex, endIndex);
                    mirroredSeats.reverse();

                    currentRow.splice(startIndex, endIndex - startIndex, ...mirroredSeats);
                }
            }
        }
    );
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

/**
 * 
 * @param {Array<Array<SeatData>>} rowData 
 * @param {number} angle 
 * @param {import('./project-helpers.js').ProjectSettings} options 
 */
export function curveRows(rowData, angle, options = {seatSize, seatGap}) {
    /** @type {Array<Array<SeatData>>} */
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

/**
 * 
 * @param {Array<Array<SeatData>>} rowData 
 * @param {import('./project-helpers.js').ProjectSettings} options 
 */
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

/**
 * Trims the dimensions of the chart to fit the seats
 * @param {Array<SeatData>} seats 
 * @returns {Array<SeatData>}
 */
export function trimOuterSpacing (seats) {
    /** @type {Array<SeatData>} */
    const result = JSON.parse(JSON.stringify(seats));
    const minX = Math.min(...result.map(seat => seat.x));
    const minY = Math.min(...result.map(seat => seat.y));

    for (let i=0; i<result.length; i++) {
        result[i].x -= minX;
        result[i].y -= minY;
    }

    return result;
}

/**
 * Assigns member IDs to each seat, as available
 * @param {Object<string, Array<[string, Member]>} membersBySection 
 * @param {Array<Array<SeatData>>} rows 
 * @returns {Array<Array<SeatData>>}
 */
export function seatMembers (membersBySection, rows) {
    /** @type {Array<Array<SeatData>>} */
    const seatedRows = rows.map(currentRow => currentRow.map(currentSeat => {
        const [memberId, memberData] = membersBySection[currentSeat.section]
            .find(([id, data]) => data.order === currentSeat.seat) || [];
        return Object.assign({}, currentSeat, {member: memberId ? memberId : null});
    }));

    return seatedRows;
}

/**
 * Gets the dimensions of the chart based on all the available seats
 * @param {Array<SeatData>} positionedSeats 
 * @param {import('./project-helpers.js').ProjectSettings} options 
 * @returns {[number, number]}
 */
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

/**
 * 
 * @param {number} width 
 * @param {number} height 
 * @param {import('./project-helpers.js').ProjectSettings} options 
 * @returns {[number, number]}
 */
function adjustDimensionsForSeatSize (width, height, options = {seatSize}) {
    return [width + options.seatSize + 1, height + options.seatSize + 1];
}

/**
 * 
 * @param {Array<number>} arr 
 */
function sumArray(arr) {
    return arr.reduce((a, b) => a + b, 0);
}

/**
 * 
 * @param {Array<number>} rowLengths 
 * @param {number} numOfMembers 
 * @return {Array<number>}
 */
function ensureEnoughSeats(rowLengths, numOfMembers) {
        // Duplicate the last row until there are enough seats
        const result = rowLengths.slice();
        const newRowLength = result.length > 0 && result[result.length - 1] > 0 ? result[result.length - 1] : DEFAULT_SECTION_ROW_LENGTH;
        while (sumArray(result) < numOfMembers)
            result.push(newRowLength);
        return result;
}

/**
 * 
 * @param {Object<string, Region>} regions 
 * @param {Object<string, Section>} sections 
 * @param {Object<string, Member>} members 
 * @param {import('./project-helpers.js').ProjectSettings} options 
 * @returns {Array<SeatData>}
 */
export function calculateSeatPositions(regions, sections, members, options) {
    /** @type {Array<Array<SeatData>>} */
    const seatsByRegion = [];
    const dimensionsByRegion = [];

    let maxSeatX = 0,
        maxSeatY = 0,
        minSeatX = 0,
        minSeatY = 0;

    const regionEntries = Object.entries(regions);
    const sectionEntries = Object.entries(sections);
    const memberEntries = Object.entries(members);
    for (let i=regionEntries.length-1; i>-1; i--) {
        const [regionId, regionData] = regionEntries[i];

        /** @type {Object<string, Section>} */
        const includedSections = Object.fromEntries(sectionEntries.filter(([,sectionData]) => sectionData.region === regionId));
        const regionOffset = i < regionEntries.length - 1 ? maxSeatY + regionGap : 0;

        let maxRegionX = 0,
            maxRegionY = 0,
            minRegionX = 0,
            minRegionY = 0;

        /**
         * @type {Object<string, Array<[string, Member]>}
         */
        const membersBySection = {};
        for (const sectionId of Object.keys(includedSections)) {
            membersBySection[sectionId] = memberEntries.filter(([,memberData]) => memberData.section === sectionId);
        }
        
        // Make sure each row generates enough seats for all members
        Object.keys(includedSections).forEach(sectionId => {
            includedSections[sectionId] = Section.fromObject(
                Object.assign({}, includedSections[sectionId], { 
                    rowSettings: ensureEnoughSeats(includedSections[sectionId].rowSettings, membersBySection[sectionId].length) 
                })
            );
        });
        const rows = generateRows(includedSections);

        // Seat members if any are passed
        let seatedRows = seatMembers(membersBySection, rows);

        // Curve rows if necessary, and set container dimensions for scrolling
        if (regionData.curvedLayout)
            seatedRows = curveRows(seatedRows, regionData.angle, options);
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

/**
 * Divide an entire phrase in an array of phrases, all with the max pixel length given.
 * The words are initially separated by the space char.
 * Adapted from https://stackoverflow.com/a/16599668
 * @param phrase
 * @param length
 * @return
 */
function getLines(ctx,phrase,maxPxLength,textStyle) {
    var wa=phrase.split(" "),
        phraseArray=[],
        lastPhrase=wa[0],
        measure=0,
        splitChar=" ";
    if (wa.length <= 1) {
        return wa
    }
    ctx.font = textStyle;
    for (var i=1;i<wa.length;i++) {
        var w=wa[i];
        measure=ctx.measureText(lastPhrase+splitChar+w).width;
        if (measure<maxPxLength) {
            lastPhrase+=(splitChar+w);
        } else {
            phraseArray.push(lastPhrase);
            lastPhrase=w;
        }
        if (i===wa.length-1) {
            phraseArray.push(lastPhrase);
            break;
        }
    }
    return phraseArray;
}

const svgNS = 'http://www.w3.org/2000/svg';
const defaultMeasureStyle = {opacity: 0, pointerEvents: 'none', position: 'absolute'};
function measureDimensions(text, container = document.body) {
    let el;
    if (container.closest('svg')) {
        el = document.createElementNS(svgNS, 'text');
        el.textContent = text;
    }
    else {
        el = document.createElement('span');
        el.innerText = text;
    }

    Object.assign(el.style, defaultMeasureStyle);
    container.appendChild(el);
    const bounds = el.getBoundingClientRect();
    return container.removeChild(el) && { width: bounds.width, height: bounds.height };
}

function wrapAt(text, maxWidth, container) {
    return text.split(' ').reduce((allLines, current) => {
        if (allLines.length === 0)
            allLines.push(current);
        else {
            if (measureDimensions(`${allLines[allLines.length - 1]} ${current}`, container || undefined).width > maxWidth)
                allLines.push(current);
            else
                allLines[allLines.length - 1] = `${allLines[allLines.length - 1]} ${current}`;
        }
        return allLines;
    }, []);
}

export function renderSVG (regions, sections, members, options) {
    let seats = calculateSeatPositions(regions, sections, members, options);
    const [layoutWidth, layoutHeight] = getLayoutDimensions(seats, options);

    if (!options.downstageTop)
        seats = flipStageDirection(seats, options);

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.style.fontFamily = 'sans-serif';
    svg.style.fontSize = options.seatLabelFontSize;
    svg.style.visibility = 'hidden';
    svg.style.position = 'absolute';

    svg.setAttribute('width', layoutWidth);
    svg.setAttribute('height', layoutHeight);
    svg.setAttribute('dominant-baseline', 'hanging');
    svg.setAttribute('text-anchor', 'middle');
    svg.setAttribute('viewbox', `0 0 ${layoutWidth} ${layoutHeight}`);
    document.body.appendChild(svg);

    // Render seats
    const seatsToRender = seats.filter(seat => !(seat.implicit && !options.implicitSeatsVisible && !seat.member));
    for (const seat of seatsToRender) {
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('width', options.seatSize || seatSize);
        rect.setAttribute('height', options.seatSize || seatSize);
        rect.setAttributeNS(svgNS, 'stroke', 'black');
        rect.setAttributeNS(svgNS, 'strokeWidth', '1');
        rect.setAttributeNS(svgNS, 'fill', seat.color);
        rect.setAttributeNS(svgNS, 'x', seat.x);
        rect.setAttributeNS(svgNS, 'y', seat.y);
        svg.appendChild(rect);
    }

    const seatSizeOffset = .5 * options.seatSize;

    // Render labels
    for (const seat of seatsToRender) {
        let lines;
        if (seat.member)
            lines = wrapAt(options.seatNameLabels === 'initials' ? getInitials(seat.member.name) : seat.member.name, options.seatSize, svg);
        else
            lines = [`${seat.seat + 1}`];
        
        const labelText = document.createElementNS(svgNS, 'text');
        labelText.setAttribute('x', seat.x);

        for (let i=0; i<lines.length; i++) {
            const lineText = document.createElementNS(svgNS, 'tspan');
            lineText.setAttribute('x', seat.x + seatSizeOffset);
            if (i > 0)
                lineText.setAttribute('dy', '1em');
            lineText.textContent = lines[i];
            labelText.appendChild(lineText);
        }
        svg.appendChild(labelText);

        const boundingBox = labelText.getBoundingClientRect();

        const seatCenterY = seat.y + seatSizeOffset;
        let labelCandidateY = seatCenterY - (.5 * boundingBox.height);
        if (labelCandidateY < 0)
            labelCandidateY = 0;
        else if (labelCandidateY + boundingBox.height > layoutHeight)
            labelCandidateY = layoutHeight - boundingBox.height;
        labelText.setAttribute('y', labelCandidateY);

        if (boundingBox.x < 0) {
            const offsetX = .5 * boundingBox.width;
            labelText.setAttribute('x', offsetX);
            for (const line of labelText.childNodes) {
                line.setAttribute('x', offsetX);
            }
        }
        else if (boundingBox.x + boundingBox.width > layoutWidth) {
            // Bounding box contains actual coordinates from the top left of the element.
            // However, the element's 'x' proprety is at the center of the element. Make
            // sure to offset it appropriately!
            const offsetX = layoutWidth - (.5 * boundingBox.width);
            labelText.setAttribute('x', offsetX);
            for (const line of labelText.childNodes)
            line.setAttribute('x', offsetX);
        }
    }

    svg.remove();
    svg.style.position = null;
    svg.style.visibility = null;
    return svg;
}

function scaleForCanvas(value, scale, offset = false) {
    return Math.floor(value * scale) + (offset ? .5 : 0);
}

export function renderImage (regions, sections, members, options) {
    return new Promise((resolve, reject) => {
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
        
        if (!(options.format === 'png' && options.transparency)) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, exportWidth, exportHeight);
        }
    
        ctx.strokeStyle = '#000';
        ctx.lineWidth = Math.max(Math.floor(scale), 1);
    
        // Render seats
        const seatsToRender = seats.filter(seat => !(seat.implicit && !options.implicitSeatsVisible && !seat.member));
        for (const seat of seatsToRender) {
            // Render seat
            ctx.fillStyle = seat.color;
            const needsOffset = ctx.lineWidth % 2 !== 0;
            const x = scaleForCanvas(seat.x, scale, needsOffset);
            const y = scaleForCanvas(seat.y, scale, needsOffset);
            const width = Math.floor(options.seatSize * scale);
            const height = width;
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
        }
    
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000';
    
        const calcFont = `normal ${options.seatLabelFontSize}px sans-serif`;
        const renderFont = `normal ${options.seatLabelFontSize * scale}px sans-serif`;
        const seatSizeOffset = .5 * options.seatSize;
    
        // Render labels
        for (const seat of seatsToRender) {
            let lines;
            if (seat.member)
                lines = getLines(ctx, options.seatNameLabels === 'initials' ? getInitials(seat.member.name) : seat.member.name, options.seatSize * scale, ctx.font);
            else
                lines = [`${seat.seat + 1}`];
            
            const textHeight = lines.length * options.seatLabelFontSize;
            let startingY = seat.y + seatSizeOffset - (.5 * textHeight);

            // Offset startingY if the text would be off the screen
            if (startingY < 0)
                startingY = 0;
            else if (startingY + textHeight > layoutHeight)
                startingY = layoutHeight - textHeight;

            for (let i=0; i<lines.length; i++) {
                const text = lines[i];
                ctx.font = calcFont;
                const lineWidth = ctx.measureText(text).width;
                const x = seat.x + seatSizeOffset - (.5 * lineWidth);
                const y = startingY + (options.seatLabelFontSize * i);
    
                let screenOffsetX = 0;
                
                // Offset X if the text would be off the screen
                if (x < 0)
                    screenOffsetX = -1 * x;
                else if (x + lineWidth > layoutWidth)
                    screenOffsetX = layoutWidth - (x + lineWidth);
    
                ctx.font = renderFont;
                ctx.fillText(text, scaleForCanvas(x + screenOffsetX, scale), scaleForCanvas(y, scale));
            }
        }
            
        if (typeof canvas.toBlob === 'function')
            canvas.toBlob(resolve, `image/${options.format}`, options.quality);
        else
            resolve(canvas[exportFn](`image/${options.format}`, options.quality));
    });
}
