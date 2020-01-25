import blankTemplate from './blank.json';
import stringOrchestraTemplate from './string-orchestra.json';
import fullOrchestraTemplate from './full-orchestra.json';
import windEnsembleTemplate from './wind-ensemble.json';
import concertChoirTemplate from './concert-choir.json';
import { Project } from '../types';

/**
 * @typedef {Object} ProjectTemplate
 * @property {string} name
 * @property {Project} data
 */

/**
 * @type {ProjectTemplate}
 */
export const blank = {
    name: 'Blank',
    data: blankTemplate
};

/**
 * @type {ProjectTemplate}
 */
export const stringOrchestra = {
    name: 'String orchestra',
    data: stringOrchestraTemplate
};

/**
 * @type {ProjectTemplate}
 */
export const fullOrchestra = {
    name: 'Full orchestra',
    data: fullOrchestraTemplate
};

/**
 * @type {ProjectTemplate}
 */
export const windEnsemble = {
    name: 'Wind ensemble',
    data: windEnsembleTemplate
};

/**
 * @type {ProjectTemplate}
 */
export const concertChoir = {
    name: 'Concert choir',
    data: concertChoirTemplate
};
