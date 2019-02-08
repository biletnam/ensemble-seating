import React, {Component} from 'react';

import {SimpleDialog} from '@rmwc/dialog';
import '@material/dialog/dist/mdc.dialog.css';

const BODY_CONTENT = <div>
    <h3>
        {APP_INFO.NAME} v{APP_INFO.VERSION} "{APP_INFO.CODENAME}"
    </h3>
    
    <p>Ensemble Seating helps you create a seating chart for your musical ensembles, section by section.</p>
    <p>This project is open source. <a target='_blank' href='https://github.com/acmertz/ensemble-seating' rel='noopener'>View the source on GitHub</a></p>
</div>;

const AboutDialog = props => (
    <SimpleDialog {...props}
        title='About'
        body={BODY_CONTENT}
        acceptLabel='Close'
        cancelLabel={null} />
);

export default AboutDialog;
