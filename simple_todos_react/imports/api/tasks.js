import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Tasks = new Mongo.Collection('tasks');

if (Meteor.isServer) {
    // This code only runs on the server


    Meteor.publish('tasks', function tasksPublication() {           // Calling Meteor.publish on the server registers a publication named "tasks".
        return Tasks.find({                                         // Only publish tasks that are public
            $or: [                                                      // or belong to the current user
              { private: { $ne: true } },
              { owner: this.userId },
            ],
        });
    });
}

// Client code is separated from our database logic
// These methods can be called from anywhere.

Meteor.methods({
    'tasks.insert'(text) {
        check(text, String);
        if (! this.userId) {                                        // Make sure the user is logged in before inserting a task
            throw new Meteor.Error('not-authorized');
        }
        Tasks.insert({
            text,                                                   // task from form
            createdAt: new Date(),                                  // current time
            owner: this.userId,                                     // _id of logged in user
            username: Meteor.users.findOne(this.userId).username,   // username of logged in user
        });
    },

    'tasks.remove'(taskId) {
        check(taskId, String);
        const task = Tasks.findOne(taskId);                         // find one task with same taskId
        if (task.private && task.owner !== this.userId) {           // if task found is private and task owner is not current user
            throw new Meteor.Error('not-authorized');                   // throw error
        }
        Tasks.remove(taskId);
    },

    'tasks.setChecked'(taskId, setChecked) {
        check(taskId, String);
        check(setChecked, Boolean);
        const task = Tasks.findOne(taskId);                         // find one task with same taskId
        if (task.private && task.owner !== this.userId) {           // if task found is private and task owner is not current user
            throw new Meteor.Error('not-authorized');                   // throw error
        }
        Tasks.update(taskId, { $set: { checked: setChecked } });
    },

    'tasks.setPrivate'(taskId, setToPrivate) {
        check(taskId, String);
        check(setToPrivate, Boolean);
        const task = Tasks.findOne(taskId);                         // find one task with same taskId
        if (task.owner !== this.userId) {                           // if task owner is not the current user
          throw new Meteor.Error('not-authorized');                     // throw error
        }
        Tasks.update(taskId, { $set: { private: setToPrivate } });  // update the located task and set private to private
    },
});
