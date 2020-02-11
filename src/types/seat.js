export class Seat {
    constructor() {
        /**
         * @type {string}
         */
        this.id = null;

        /**
         * @type {string}
         */
        this.section = null;

        /**
         * @type {string}
         */
        this.member = null;

        /**
         * @type {number}
         */
        this.seat = -1;

        /**
         * @type {boolean}
         */
        this.implicit = false;

        /**
         * @type {string}
         */
        this.color = '';

        /**
         * @type {number}
         */
        this.x = 0;

        /**
         * @type {number}
         */
        this.y = 0;
    }
}