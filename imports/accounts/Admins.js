import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import SimpleSchema from 'simpl-schema'

export const Admins = {
  name: 'admins',
  schema: {
    userId: {
      type: String,

      /**
       * Checks, if a user exists by given userId
       * @return {string|undefined}
       */
      custom: function () {
        const userId = this.value
        const userExists = Meteor.users.find(userId).count() === 1
        if (!userExists) {
          return 'admin.userDoesNotExist'
        }
      }
    }
  }
}

const AdminsCollection = new Mongo.Collection(Admins.name)
AdminsCollection.attachSchema(new SimpleSchema(Admins.schema))

Admins.collection = () => AdminsCollection
