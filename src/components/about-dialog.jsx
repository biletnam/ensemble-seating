import React, {Component} from 'react';

import {SimpleDialog} from '@rmwc/dialog';
import {Typography} from '@rmwc/typography';

import '@material/dialog/dist/mdc.dialog.css';
import '@material/typography/dist/mdc.typography.css';

const BODY_CONTENT = <div>
    <Typography tag='h3' use='subtitle1'>
        {APP_INFO.NAME} v{APP_INFO.VERSION} "{APP_INFO.CODENAME}"
    </Typography>
    
    <Typography tag='p' use='body1'>Ensemble Seating helps you create a seating chart for your musical ensembles, section by section.</Typography>
    <Typography tag='p' use='body1'>This project is open source. <a target='_blank' href='https://github.com/acmertz/ensemble-seating' rel='noopener'>View the source on GitHub</a></Typography>
</div>;

const AboutDialog = props => (
    <SimpleDialog {...props}
        title='About'
        body={BODY_CONTENT}
        acceptLabel='Close'
        cancelLabel={null} />
);

export default AboutDialog;
