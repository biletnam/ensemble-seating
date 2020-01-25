export class Region {
    constructor (name = 'Untitled region') {
        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {boolean}
         */
        this.curvedLayout = true;

        /**
         * @type {number}
         */
        this.angle = 180;

        /**
         * @type {number}
         */
        this.order = -1;
    }

    /**
     * @returns {Region}
     */
    static fromObject (obj) {
        return Object.assign(new Region(), obj);
    }
}
