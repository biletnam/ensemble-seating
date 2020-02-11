import { Region, Section, Member } from '../types';
import { calculateSeatPositions, getLayoutDimensions, flipStageDirection, getInitials } from './stage.js';

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

export function browseForFile () {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', inputEvent => {
            if (inputEvent.target.files.length > 0) {
                const reader = new FileReader();
                reader.addEventListener('load', fileReaderEvent => {
                    let parsedProject, projectName;
                    try {
                        parsedProject = JSON.parse(fileReaderEvent.target.result);
                        projectName = fileReaderEvent.target.file.name.split('.');
                        if (projectName.length > 1)
                            projectName = projectName.slice(0, projectName.length - 1);
                        projectName = projectName.join('.');
            
                        resolve({project: parsedProject, projectName});
                    }
                    catch(e) {
                        console.error('Unable to load project - file is corrupt.');
                        reject();
                    }
                });
                reader.file = inputEvent.target.files[0];
                reader.readAsText(inputEvent.target.files[0]);
            }
        });
        input.click();
    });
}

export async function exportProjectFile(projectName = 'Untitled project', projectForExport, options) {
    const regions = projectForExport.regions;
    const sections = projectForExport.sections;
    const members = projectForExport.members;
    const settings = Object.assign({}, options, projectForExport.settings);

    let result = null,
        mime = null,
        extension = null;

    if (options.format == 'project') {
        result = JSON.stringify(projectForExport);
        mime = 'text/json';
        extension = 'json';
    }
    else {
        if (options.format == 'svg') {
            const svg = renderSVG(regions, sections, members, settings);
            result = svg.outerHTML;
            mime = 'image/svg+xml;charset=utf-8';
            extension = 'svg';
        }
        else {
            result = await renderImage(regions, sections, members, settings);
            if (options.format == 'jpeg') {
                mime = 'image/jpeg';
                extension = 'jpg';
            }
            else {
                mime = 'image/png';
                extension = 'png';
            }
        }
    }

    // Export the data
    const download = document.createElement('a');
    download.download = `${projectName}.${extension}`;

    if (options.format === 'svg' || options.format === 'project') {
        const blob = new Blob([result], {type: mime});
        download.href = URL.createObjectURL(blob);
    }
    else
        download.href = result instanceof Blob ? URL.createObjectURL(result) : result;

    document.body.appendChild(download);
    download.click();
    document.body.removeChild(download);

    if (options.format === 'svg' || options.format === 'project')
        URL.revokeObjectURL(download.href);
}

/**
 * 
 * @param {Object<string, Region>} regions 
 * @param {Object<string, Section>} sections 
 * @param {Object<string, Member>} members 
 * @param {import('../types/project.js').ProjectSettings} options 
 */
function renderSVG (regions, sections, members, options) {
    let {seats, origin} = calculateSeatPositions(regions, sections, members, options);
    const [layoutWidth, layoutHeight] = getLayoutDimensions(seats, options);

    if (options.downstageTop)
        seats = flipStageDirection(seats);

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('xmlns', svgNS);
    svg.style.fontFamily = 'sans-serif';
    svg.style.fontSize = options.seatLabelFontSize;
    svg.style.visibility = 'hidden';
    svg.style.position = 'absolute';

    const svgWidth = layoutWidth + options.seatSize + 1;
    const svgHeight = layoutHeight + options.seatSize + 1;
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    svg.setAttribute('dominant-baseline', 'text-before-edge');
    svg.setAttribute('text-anchor', 'middle');
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    document.body.appendChild(svg);

    // Render seats
    const seatsToRender = seats.filter(seat => !(seat.implicit && !options.implicitSeatsVisible && !seat.member));
    for (const seat of seatsToRender) {
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('width', options.seatSize || seatSize);
        rect.setAttribute('height', options.seatSize || seatSize);
        rect.setAttribute('stroke', 'black');
        rect.setAttribute('strokeWidth', '1');
        rect.setAttribute('fill', seat.color);
        rect.setAttribute('x', Math.round(seat.x));
        rect.setAttribute('y', Math.round(layoutHeight - seat.y));
        svg.appendChild(rect);
    }

    const seatSizeOffset = .5 * options.seatSize;

    // Render labels
    for (const seat of seatsToRender) {
        let lines;
        if (seat.member) {
            lines = wrapAt(options.seatNameLabels === 'initials' ? getInitials(members[seat.member].name) : members[seat.member].name, options.seatSize, svg);
        }
        else {
            lines = [`${seat.seat + 1}`];
        }
        
        // Estimate initial x coordinate
        const initialLabelX = Math.round(seat.x + seatSizeOffset);
        const labelText = document.createElementNS(svgNS, 'text');
        labelText.setAttribute('x', initialLabelX);

        for (let i=0; i<lines.length; i++) {
            const lineText = document.createElementNS(svgNS, 'tspan');
            lineText.setAttribute('x', initialLabelX);
            if (i > 0) {
                lineText.setAttribute('dy', '1em');
            }
            lineText.textContent = lines[i];
            labelText.appendChild(lineText);
        }
        svg.appendChild(labelText);

        // Get dimensions of text
        const boundingBox = labelText.getBoundingClientRect();

        // Correct x coord if the text is out of bounds
        const halfTextWidth = .5 * boundingBox.width;
        if (initialLabelX < halfTextWidth) {
            labelText.setAttribute('x', halfTextWidth);
            for (const line of labelText.childNodes) {
                line.setAttribute('x', halfTextWidth);
            }
        }
        else if (initialLabelX + halfTextWidth > svgWidth) {
            const replacementX = svgWidth - halfTextWidth;
            labelText.setAttribute('x', replacementX);
            for (const line of labelText.childNodes) {
                line.setAttribute('x', replacementX);
            }
        }

        // Estimate y coordinate and correct it if out of bounds
        let labelCandidateY = layoutHeight - Math.floor((seat.y - seatSizeOffset) + (.5 * boundingBox.height));
        if (labelCandidateY < 0) {
            labelCandidateY = 0;
        }
        else if (labelCandidateY + boundingBox.height > svgHeight) {
            labelCandidateY = svgHeight - boundingBox.height;
        }
            
        labelText.setAttribute('y', labelCandidateY);
    }

    svg.remove();
    svg.style.position = null;
    svg.style.visibility = null;
    return svg;
}

/**
 * 
 * @param {Object<string, Region>} regions 
 * @param {Object<string, Section>} sections 
 * @param {Object<string, Member>} members 
 * @param {import('../types/project.js').ProjectSettings} options 
 */
function renderImage (regions, sections, members, options) {
    return new Promise((resolve, reject) => {
        const svg = renderSVG(regions, sections, members, options);
        svg.setAttribute('width', options.width);
        svg.setAttribute('height', options.height);

        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image(options.width, options.height);

        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;

        const ctx = canvas.getContext('2d');
        if (!(options.format === 'png' && options.transparency)) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(blobUrl);

            if (typeof canvas.toBlob === 'function')
                canvas.toBlob(resolve, `image/${options.format}`, options.quality);
            else
                resolve(canvas[exportFn](`image/${options.format}`, options.quality));
        }
        img.src = blobUrl;
    });
}
