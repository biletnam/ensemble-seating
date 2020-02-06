import React, { useState, useEffect } from 'react';

import { DataTable, DataTableContent, DataTableHead, DataTableHeadCell, DataTableBody, DataTableRow, DataTableCell } from '@rmwc/data-table';
import '@rmwc/data-table/data-table.css';

import { Menu, MenuSurfaceAnchor, MenuItem } from '@rmwc/menu';
import '@material/menu/dist/mdc.menu.css';
import '@material/menu-surface/dist/mdc.menu-surface.css';
import '@material/list/dist/mdc.list.css';

import { ListDivider } from '@rmwc/list';
import '@material/list/dist/mdc.list.css';

import { IconButton } from '@rmwc/icon-button';
import '@material/icon-button/dist/mdc.icon-button.css';

import MoreIcon from '../icons/more_vert-24px.svg';

import { Project } from '../types';
import { listProjects, renameProject, loadProject, saveDiff, deleteProject } from '../helpers/firebase.js';
import './project-list.css';

import { queue as dialogQueue } from './dialog-queue.jsx';
import { queue as snackbarQueue } from './snackbar-queue.jsx';

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
    const [menuOpen, setMenuOpen] = useState(null);

    function filterCurrent (project) {
        return project.name !== props.currentProject;
    }

    function updateProjectList () {
        listProjects(props.user).then(newProjects => {
            if (newProjects) {
                setProjects(mapProjects(newProjects).filter(filterCurrent));
            }
        });
    }

    useEffect(() => {
        console.log("Updating project list...");
        if (props.user)
            updateProjectList();
    }, [props.lastUpdated]);

    function onMenuSelect (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        const projectName = evt.detail.item.dataset.project;
        switch (evt.detail.item.dataset.name) {
            case 'open': {
                props.onProjectItemClick(projectName);
                break;
            }
            case 'rename': {
                dialogQueue.prompt({
                    title: 'Rename seating chart',
                    acceptLabel: 'Rename',
                    inputProps: {
                        label: 'Name',
                        helpText: `Enter a new name for "${projectName}"`,
                        minLength: 1
                    }
                }).then(value => {
                    if (typeof value === 'string') {
                        console.log(`Rename "${projectName}" to "${value}"`);
                        // Validate that a name was entered
                        if (value.length > 0) {
                            renameProject(props.user, projectName, value).then(() => {
                                snackbarQueue.notify({
                                    title: `Renamed "${projectName}" to "${value}"`
                                });
                                updateProjectList();
                            }).catch(error => {
                                snackbarQueue.notify({
                                    title: error.message
                                });
                            })
                        }
                        else {
                            // User entered a blank string
                        }
                    }
                });
                break;
            }
            case 'duplicate': {
                dialogQueue.prompt({
                    title: 'Duplicate seating chart',
                    acceptLabel: 'Duplicate',
                    inputProps: {
                        label: 'Name',
                        helpText: `Enter a new name for "${projectName}"`,
                        minLength: 1
                    }
                }).then(value => {
                    if (typeof value === 'string') {
                        if (value.length > 0) {
                            listProjects(props.user).then(existingProjects => {
                                if (existingProjects[value]) {
                                    // Project already exists
                                    snackbarQueue.notify({
                                        title: `A project by the name of "${value}" already exists.`
                                    });
                                }
                                else {
                                    // Duplicate project and save with new name
                                    loadProject(props.user, projectName).then(loadedProject => {
                                        const duplicatedProject = Project.clone(loadedProject);
                                        saveDiff(props.user, {}, duplicatedProject, value).then(() => {
                                            snackbarQueue.notify({
                                                title: `Saved a copy of "${projectName}" as "${value}"`
                                            });
                                            updateProjectList();
                                        });
                                    });
                                }
                            })
                        }
                        else {
                            // User entered a blank string
                        }
                        console.log(`Duplicate "${projectName}" to "${value}"`);
                        // Validate that a name was entered
                        // Check if there's already a project with that name
                        // Otherwise, rename the project
                    }
                });
                break;
            }
            case 'delete': {
                dialogQueue.confirm({
                    title: `Delete "${projectName}?"`,
                    body: `This can't be undone.`,
                    acceptLabel: 'Delete'
                }).then(confirmed => {
                    if (confirmed) {
                        // Delete the project
                        deleteProject(props.user, projectName).then(() => {
                            snackbarQueue.notify({
                                title: `Deleted "${projectName}"`
                            });
                            updateProjectList();
                        });
                    }
                });
                break;
            }
        }
    }

    function onContextMenuButtonClick (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        setMenuOpen(evt.target.name)
    }

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
                    <DataTableHeadCell></DataTableHeadCell>
                </DataTableRow>
            </DataTableHead>
            <DataTableBody>
                {sortedProjects.map(project => (
                    <DataTableRow key={project.name}
                        data-project={project.name} disabled
                        onClick={event => !menuOpen && props.onProjectItemClick(event.currentTarget.dataset.project)}
                        onContextMenu={(event) => {event.preventDefault(); event.stopPropagation(); setMenuOpen(project.name)}}>
                        <DataTableCell>{project.name}</DataTableCell>
                        <DataTableCell alignEnd>{convertToDate(project.created)}</DataTableCell>
                        <DataTableCell alignEnd>{convertToDate(project.modified)}</DataTableCell>
                        <DataTableCell>
                            <MenuSurfaceAnchor>
                                <Menu hoistToBody open={menuOpen === project.name}
                                    onClose={evt => setMenuOpen(null)}
                                    onSelect={onMenuSelect}>
                                    <MenuItem data-name='open' data-project={project.name}>Open</MenuItem>
                                    <ListDivider />
                                    <MenuItem data-name='rename' data-project={project.name}>Rename&hellip;</MenuItem>
                                    <MenuItem data-name='duplicate' data-project={project.name}>Duplicate&hellip;</MenuItem>
                                    <MenuItem data-name='delete' data-project={project.name}>Delete&hellip;</MenuItem>
                                </Menu>
                                <IconButton label='More' name={project.name} icon={<MoreIcon />} onClick={onContextMenuButtonClick} />
                            </MenuSurfaceAnchor>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTableBody>
        </DataTableContent>
    </DataTable>
} 

export default ProjectList;
