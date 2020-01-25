import randomColor from 'randomcolor';

export class Section {
    constructor (name = 'Untitled', regionId = null) {
        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {string}
         */
        this.color = randomColor({luminosity: 'light'});

        /**
         * @type {string}
         */
        this.region = regionId;

        /**
         * @type {('first-row'|'custom-row'|'last-row')}
         */
        this.offsetType = 'first-row';

        /**
         * @type {number}
         */
        this.offsetValue = 0;

        /**
         * @type {Array<number>}
         */
        this.rowSettings = [2, 4, 4];

        /**
         * @type {number}
         */
        this.order = -1;
    }

    /**
     * @returns {Section}
     */
    static fromObject (obj) {
        return Object.assign(new Section(), obj);
    }
}
