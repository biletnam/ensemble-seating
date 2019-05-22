import React, { useState, useEffect } from 'react';

import { DataTable, DataTableContent, DataTableHead, DataTableHeadCell, DataTableBody, DataTableRow, DataTableCell } from '@rmwc/data-table';
import '@rmwc/data-table/data-table.css';

import { listProjects } from '../helpers/project-helpers.js';
import './project-list.css';

function convertToDate (time) {
    if (typeof time === 'number' && time > 0)
        return new Date(time).toLocaleDateString();
    else
        return '-';
}

function numberOrZero (num) {
    if (typeof num === 'number')
        return num;
    else
        return 0;
}

export function mapProjects (projects) {
    return Object.entries(projects).map(project => (
        Object.assign({name: project[0]}, project[1])
    ));
}

export function sortProjects (projects, sort, direction) {
    return projects.slice().sort((a, b) => {
        let aVal = a[sort], bVal = b[sort];
        if (sort != 'name') {
            aVal = numberOrZero(aVal);
            bVal = numberOrZero(bVal);
        }

        if (aVal === bVal)
            return 0;
        else if (aVal < bVal)
            return direction;
        else return -1 * direction;
    });
}

const ProjectList = props => {
    const [projects, setProjects] = useState([]);
    const [sort, setSort] = useState('name');
    const [direction, setDirection] = useState(-1);

    useEffect(() => {
        console.log("Updating project list...");
        if (props.user) {
            listProjects(props.user).then(newProjects => {
                if (newProjects) {
                    setProjects(mapProjects(newProjects));
                }
            });
        }
    }, [props.lastUpdated]);

    function updateSort(name) {
        let newDirection;
        if (name != sort)
            newDirection = -1;
        else {
            newDirection = direction == 1 ? -1 : 1;
        }
        
        setSort(name);
        setDirection(newDirection);
    }

    const sortedProjects = sortProjects(projects, sort, direction);

    return <DataTable>
        <DataTableContent>
            <DataTableHead>
                <DataTableRow>
                    <DataTableHeadCell onSortChange={() => updateSort('name')}
                        sort={sort == 'name' && direction} alignStart>Name</DataTableHeadCell>
                    <DataTableHeadCell onSortChange={() => updateSort('created')}
                        sort={sort == 'created' && direction} alignEnd>Created</DataTableHeadCell>
                    <DataTableHeadCell onSortChange={() => updateSort('modified')}
                        sort={sort == 'modified' && direction} alignEnd>Modified</DataTableHeadCell>
                </DataTableRow>
            </DataTableHead>
            <DataTableBody>
                {sortedProjects.map(project => (
                    <DataTableRow key={project.name}
                        data-project={project.name}
                        onClick={event => props.onProjectItemClick(event.currentTarget.dataset.project)}>
                        <DataTableCell>{project.name}</DataTableCell>
                        <DataTableCell alignEnd>{convertToDate(project.created)}</DataTableCell>
                        <DataTableCell alignEnd>{convertToDate(project.modified)}</DataTableCell>
                    </DataTableRow>
                ))}
            </DataTableBody>
        </DataTableContent>
    </DataTable>
} 

export default ProjectList;
