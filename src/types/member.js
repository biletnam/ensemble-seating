export class Member {
    constructor (name = 'New person', sectionId = null) {
        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {string}
         */
        this.section = sectionId;

        /**
         * @type {string}
         */
        this.notes = '';

        /**
         * @type {number}
         */
        this.order = -1;
    }

    /**
     * @returns {Member}
     */
    static fromObject (obj) {
        return Object.assign(new Member(), obj);
    }
}
