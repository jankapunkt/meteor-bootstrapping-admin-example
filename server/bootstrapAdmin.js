import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Accounts } from 'meteor/accounts-base'
import { check, Match } from 'meteor/check'
import { Random } from 'meteor/random'

import { Admins } from '../imports/accounts/Admins'
import { Users } from '../imports/accounts/Users'

// First, make sure there is already an admin collection present.
// When importing Admins, the collection is created when the module is loaded.
const AdminsCollection = Admins.collection()
const UsersCollection = Users.collection()
const isMongoCollection = Match.Where(collection => collection instanceof Mongo.Collection)

check(AdminsCollection, isMongoCollection)
check(UsersCollection, isMongoCollection)

/**
 * Export for testing purposes. This is still invoked at the end of this module.
 * implements #1: There should be no bootstrapping procedure initiated, if an Admin already exists.
 */

export const bootstrapAdmin = function () {
  if (AdminsCollection.find().count() === 0) {
    checkAdminConfig()
    checkFirstUser()
    createAdminAccount()
  }

  purgeSettings()
}

/**
 * Implements #2:
 * The person (incl. E-Mail), who will be the Admin, must be known at the time of the
 * rollout / first deployment. She does not need to be present but her credentials need to be added
 * to the deployment configuration. Incomplete / faulty credentials have to be rejected.
 *
 * Note: To safely check for Strings, we need to check for their length, too.
 * See: https://stackoverflow.com/questions/49672363/how-to-prevent-malicious-meteor-subscriptions-using-check
 * @return {void}
 */

function checkAdminConfig () {
  const nonEmptyString = Match.Where(x => typeof x === 'string' && x.length > 0)
  const adminSettings = Meteor.settings.admin

  check(adminSettings, {
    firstName: nonEmptyString,
    lastName: nonEmptyString,
    username: nonEmptyString,
    email: nonEmptyString
  })
}

/**
 * Implements #3: The initial Admin must also be the first user to be created.
 */

function checkFirstUser () {
  const usersCount = UsersCollection.find().count()
  const adminCount = AdminsCollection.find().count()
  const usersExistsBeforeAdmin = adminCount === 0 && usersCount > 0
  const adminExistsBeforeUsers = usersCount === 0 && adminCount > 0

  if (usersExistsBeforeAdmin || adminExistsBeforeUsers) {
    throw new Error(`Unexpected users/admin mismatch: There were ${usersCount} users and ${adminCount} admins.`)
  }
}

/**
 * Implements #4:
 * There must be no default password being configured for the initial Admin.
 * The account must be created on the server without password (denying login until a password is set).
 */

function createAdminAccount () {
  // 1. create user
  const { firstName, lastName, username, email } = Meteor.settings.admin
  const userId = Accounts.createUser({ username, email })

  // 2. create Admins entry for user
  let adminId
  try {
    // We try / catch this, because there may be an error thrown, if the schema validation fails here.
    // This gives us the ability to rollback before rethrowing the error.
    adminId = AdminsCollection.insert({ userId })
  } catch (insertError) {
    rollback({ users: userId, admins: adminId })
    throw insertError
  }

  // 3. check 'tegrity
  const userExists = userId && Meteor.users.find({ _id: userId }).count() > 0
  const adminExists = adminId && AdminsCollection.find({ _id: adminId }).count() > 0

  if (!userExists || !adminExists) {
    rollback({ users: userId, admins: adminId })
    throw new Error(`Unexpected: failed to create user/admin account. UserId=${userId} AdminId=${adminId}`)
  }

  // 4. update profile
  const profileUpdated = UsersCollection.update(userId, { $set: { firstName, lastName } })
  if (!profileUpdated) {
    rollback({ users: userId, admins: adminId })
    throw new Error(`Expected admin user profile to be updated, got ${profileUpdated}`)
  }

  // 5. optional: set roles here, if you'd like to use

  // 6. send enrolment email
  Accounts.sendEnrollmentEmail(userId)
}

/**
 * Implements #6:
 * There should be no way for any Meteor method or other methods to "know" the configured name and email.
 */

function purgeSettings () {
  delete Meteor.settings.admin
  process.env.METEOR_SETTINGS = JSON.stringify(Meteor.settings)
}

/**
 * Partially implements #7:
 * If any step of this procedure fails, potentially created documents need to be removed (rollback)
 * and an error must be thrown to prevent further startup.
 * (Error throwing is used at the specific sections)
 * @param users
 * @param admins
 * @return {{users: *, admins: any}}
 */

function rollback ({ users, admins }) {
  return {
    users: UsersCollection.remove(users),
    admins: AdminsCollection.remove(admins)
  }
}

bootstrapAdmin()
