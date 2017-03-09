import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createContainer } from 'meteor/react-meteor-data'; // To use data from a Meteor collection inside a React component, we can use an Atmosphere package react-meteor-data which allows us to create a "data container" to feed Meteor's reactive data into React's component hierarchy.
import { Meteor } from 'meteor/meteor';
import { Tasks } from '../api/tasks.js';
import Task from './Task.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx';

// App component - represents the whole app
class App extends Component {

    constructor(props) {                // call super() if you have a constructor and don't worry about it if you don't have a constructor
        super(props);                   // only pass props into the constructor if you intend on using this.props in constructor
        this.state = {                  // establishing this.state.hideCompleted as false on page load
            hideCompleted: false,
        };
    }

    handleSubmit(event) {
        event.preventDefault();                                                 // The event.preventDefault() method stops the default action of an element from happening.
        const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();    // Find the text field via the React ref
        Meteor.call('tasks.insert', text);                                      // Calls tasks.insert method in api/tasks.js
        ReactDOM.findDOMNode(this.refs.textInput).value = '';                   // Clear form after successful input into db
    }

    toggleHideCompleted() {
        this.setState({
            hideCompleted: !this.state.hideCompleted,
        });
    }

    renderTasks() {
        let filteredTasks = this.props.tasks;

        if (this.state.hideCompleted) {                                         // if hideCompleted is True
          filteredTasks = filteredTasks.filter(task => !task.checked);          // filter through all tasks for ones not checked/completed
        }
                                                                                // filteredTasks is now array of tasks still to do
        return filteredTasks.map((task) => {                                    // Map array and render each Task component from Task.jsx
            const currentUserId = this.props.currentUser && this.props.currentUser._id;
            const showPrivateButton = task.owner === currentUserId;

            // Each task component is just an <li> element
            return (
                <Task
                    key={task._id}
                    task={task}
                    showPrivateButton={showPrivateButton}
                />
            );
        });
    }

    render() {
        return (
            <div className="container">
                <header>
                    <h1>Todo List ({this.props.incompleteCount})</h1>
                    <label className="hide-completed">
                        <input
                            type="checkbox"
                            readOnly
                            checked={this.state.hideCompleted}
                            onClick={this.toggleHideCompleted.bind(this)}
                        />
                        Hide Completed Tasks
                    </label>

                    <AccountsUIWrapper />

                    { this.props.currentUser ?
                        <form className="new-task" onSubmit={this.handleSubmit.bind(this)} >
                            <input
                                type="text"
                                ref="textInput"
                                placeholder="Type to add new tasks"
                            />
                        </form> : ''
                    }
                </header>
                <ul>
                  {this.renderTasks()}
                </ul>
            </div>
            );
        }
    }

App.propTypes = {                                                           // Properties of App component and their data types
    tasks: PropTypes.array.isRequired,                                      // Array of all Tasks
    incompleteCount: PropTypes.number.isRequired,                           // Number of incomplete Tasks
    currentUser: PropTypes.object,                                          // Object of info for current user logged in
};

export default createContainer(() => {                                      // "Data Container" to feed Meteor's reactive data into React's component hierarchy.
    Meteor.subscribe('tasks');                                              // Meteor.subscribe is called on the client with the publication name, the client subscribes to all the data from that publication
    return {
        tasks: Tasks.find({}, { sort: { createdAt: -1 } }).fetch(),         // find all tasks and sort by most recent task and store in array
        incompleteCount: Tasks.find({ checked: { $ne: true } }).count(),    // find all tasks whose checked is not equal to true and get count. $ne means "not equal to".
        currentUser: Meteor.user(),                                         // current user information
    };
}, App);
