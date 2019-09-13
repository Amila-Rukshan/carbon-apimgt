/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Badge from '@material-ui/core/Badge';
import TextField from '@material-ui/core/TextField';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import LinearProgress from '@material-ui/core/LinearProgress';
import cloneDeep from 'lodash.clonedeep';
import Alert from 'AppComponents/Shared/Alert';

/**
 *
 * Handle the operation UI
 * @export
 * @param {*} props
 * @returns {React.Component} @inheritdoc
 */
export default function Operation(props) {
    const { operation: initOperation, updateOpenAPI } = props;
    const [isSaving, setIsSaving] = useState(false); // Use to show the loader and disable button
    const [isNotSaved, setIsNotSaved] = useState(false);
    // Use to show a badge if there are/is unsaved changes in the operation

    /**
     * Reduce the operation related actions to state
     * @param {Object} operationState current Operation object (Combined object
     *  from API operations and OpenAPI response)
     * @param {Object} operationAction Action object containing the action name and event
     * @returns {Object} next state
     */
    function operationReducer(operationState, operationAction) {
        const { action, event } = operationAction;
        const nextState = cloneDeep(operationState);
        if (action !== 'update') {
            setIsNotSaved(true);
        }
        switch (action) {
            case 'update':
                return event.value;
            case 'summary':
            case 'description':
                nextState.spec[action] = event.value;
                return nextState;
            case 'authType':
                nextState[action] = event.value ? 'Any' : 'None';
                nextState.spec['x-auth-type'] = event.value ? 'Any' : 'None';
                return nextState;
            default:
                break;
        }
        return operationState;
    }
    const [operation, operationActionsDispatcher] = useReducer(operationReducer, cloneDeep(initOperation));
    useEffect(() => {
        if (!isNotSaved) {
            // Accept update iff there are no unsaved changes,
            // Otherwise outside updates will override the current operations unsaved changes
            operationActionsDispatcher({ action: 'update', event: { value: initOperation } });
        }
    }, [initOperation, isNotSaved]);

    const [isCollapsed, setIsCollapsed] = useState(false);

    // Create styles dynamically using the mapped color for given verb
    const useStyles = makeStyles((theme) => {
        const backgroundColor = theme.custom.resourceChipColors[operation.verb.toLowerCase()];
        return {
            customButton: {
                '&:hover': { backgroundColor },
                backgroundColor,
                width: theme.spacing(12),
            },
            paperStyles: {
                border: `1px solid ${backgroundColor}`,
                borderBottom: isSaving ? '0px' : '',
            },
            customDivider: {
                backgroundColor,
            },
            linearProgress: {
                height: '2px',
            },
        };
    });

    /**
     * Handle the Save button event,
     *
     */
    function saveChanges() {
        setIsSaving(true);
        updateOpenAPI('operation', operation)
            .then(() => setIsNotSaved(false))
            .finally(() => setIsSaving(false));
    }
    const classes = useStyles();
    const closedWithUnsavedChanges = !isCollapsed && isNotSaved;

    /**
     *
     *
     * @param {*} event
     * @param {*} expanded
     */
    function handleCollapse(event, expanded) {
        if (!expanded && isNotSaved) {
            Alert.warning(`Unsaved changes detected in ${operation.target} ${operation.verb}`);
        }
        setIsCollapsed(expanded);
    }
    return (
        <ExpansionPanel onChange={handleCollapse} className={classes.paperStyles}>
            <ExpansionPanelSummary
                disableRipple
                disableTouchRipple
                expandIcon={<ExpandMoreIcon />}
                aria-controls='panel2a-content'
                id='panel2a-header'
            >
                {closedWithUnsavedChanges ? (
                    <Badge color='primary' variant='dot'>
                        <Button disableFocusRipple variant='contained' size='small' className={classes.customButton}>
                            {operation.verb}
                        </Button>
                    </Badge>
                ) : (
                    <Button disableFocusRipple variant='contained' size='small' className={classes.customButton}>
                        {operation.verb}
                    </Button>
                )}

                <Typography style={{ margin: '0px 30px' }} variant='h6' gutterBottom>
                    {operation.target}

                    <Typography style={{ margin: '0px 30px' }} variant='caption' gutterBottom>
                        {operation.spec.summary}
                    </Typography>
                </Typography>
            </ExpansionPanelSummary>
            <Divider light className={classes.customDivider} />
            <ExpansionPanelDetails>
                <Grid spacing={2} container direction='row' justify='flex-start' alignItems='flex-start'>
                    <Grid item md={12}>
                        <Typography variant='subtitle1'>
                            Summary {'&'} Description
                            <Divider variant='middle' />
                        </Typography>
                    </Grid>
                    <Grid item md={1} />
                    <Grid item md={6}>
                        <TextField
                            margin='dense'
                            fullWidth
                            label='Description'
                            multiline
                            rows='4'
                            value={operation.spec.description}
                            variant='outlined'
                            onChange={({ target: { value } }) =>
                                operationActionsDispatcher({ action: 'description', event: { operation, value } })
                            }
                        />
                    </Grid>
                    <Grid item md={5}>
                        <TextField
                            id='outlined-dense'
                            label='Summary'
                            margin='dense'
                            variant='outlined'
                            fullWidth
                            value={operation.spec.summary}
                            onChange={({ target: { value } }) =>
                                operationActionsDispatcher({ action: 'summary', event: { operation, value } })
                            }
                        />
                    </Grid>
                    <Grid item md={12}>
                        <Typography variant='subtitle1'>
                            Security
                            <Divider variant='middle' />
                        </Typography>
                    </Grid>
                    <Grid item md={1} />
                    <Grid item md={11}>
                        <FormControl component='fieldset'>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={operation.authType.toLowerCase() !== 'none'}
                                        onChange={({ target: { checked } }) =>
                                            operationActionsDispatcher({
                                                action: 'authType',
                                                event: { value: checked },
                                            })
                                        }
                                        size='small'
                                        color='primary'
                                    />
                                }
                                label='Enabled'
                                labelPlacement='start'
                            />
                        </FormControl>
                    </Grid>
                </Grid>
            </ExpansionPanelDetails>
            <Divider className={classes.customDivider} />
            <ExpansionPanelActions style={{ justifyContent: 'flex-start' }}>
                <Button disabled={isSaving} onClick={saveChanges} variant='outlined' size='small' color='primary'>
                    Save
                    {isSaving && <CircularProgress size={24} />}
                </Button>
                <Button
                    size='small'
                    onClick={() => {
                        operationActionsDispatcher({ action: 'update', event: { value: initOperation } });
                        setIsNotSaved(false);
                    }}
                >
                    Reset
                </Button>
            </ExpansionPanelActions>
            {isSaving && <LinearProgress classes={{ root: classes.linearProgress }} />}
        </ExpansionPanel>
    );
}

Operation.propTypes = {
    api: PropTypes.shape({}).isRequired,
    updateOpenAPI: PropTypes.func.isRequired,
    operation: PropTypes.shape({
        target: PropTypes.string.isRequired,
        verb: PropTypes.string.isRequired,
        spec: PropTypes.shape({}).isRequired,
    }).isRequired,
};
