import { Meteor } from 'meteor/meteor'
import SimpleSchema from 'simpl-schema'

export const Users = {
  name: 'users',
  schema: {
    createdAt: Date,
    firstName: {
      type: String,
      optional: true
    },
    lastName: {
      type: String,
      optional: true
    },
    username: String,
    emails: {
      type: Array,
      optional: true
    },
    'emails.$': {
      type: Object
    },
    'emails.$.address': String,
    'emails.$.verified': String,
    services: {
      type: Object,
      optional: true // default created users have no password = no services
    },
    'services.password': {
      type: Object,
      optional: true
    },
    'services.password.bcrypt': String,
    'services.password.reset': {
      type: Object,
      optional: true
    },
    'services.password.reset.token': {
      type: String,
      optional: true
    },
    'services.password.reset.email': {
      type: String,
      optional: true
    },
    'services.password.reset.when': {
      type: Date,
      optional: true
    },
    'services.password.reset.reason': {
      type: String,
      optional: true
    }
  },
  fields: {
    public: {
      createdAt: 1,
      firstName: 1,
      lastName: 1,
      username: 1,
      emails: 1/**/
    }
  }
}

Users.collection = () => Meteor.users

const usersSchema = new SimpleSchema(Users.schema)
Meteor.users.attachSchema(usersSchema)
