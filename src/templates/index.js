import blank from './blank.json';
import stringOrchestra from './string-orchestra.json';
import fullOrchestra from './full-orchestra.json';
import windEnsemble from './wind-ensemble.json';
import concertChoir from './concert-choir.json';

const templates = [
    {
        name: 'Blank',
        id: 'blank',
        data: blank
    },
    {
        name: 'String orchestra',
        id: 'string-orchestra',
        data: stringOrchestra
    },
    {
        name: 'Full orchestra',
        id: 'full-orchestra',
        data: fullOrchestra
    },
    {
        name: 'Wind ensemble',
        id: 'wind-ensemble',
        data: windEnsemble
    },
    {
        name: 'Concert choir',
        id: 'concert-choir',
        data: concertChoir
    }
]

export { templates };
