/* global describe it beforeEach afterEach */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { Admins } from '../imports/accounts/Admins'

let bootstrapAdmin = undefined
const admin = JSON.parse(JSON.stringify(Meteor.settings.admin || {})) // Object fallback for Meteor.isClient

if (Meteor.isServer) {
  describe('bootstrapAdmin', function () {
    const expectRolledBack = () => Meteor.users.find().count() === 0 && Admins.collection().find().count() === 0
    const expectedError = done => () => done(new Error('expected error to be thrown'))

    beforeEach(function () {
      Admins.collection().remove({})
      Meteor.users.remove({})
      Meteor.settings.admin = JSON.parse(JSON.stringify(admin))
    })

    it('skips the procedure (without errors), if an Admin exists', function () {
      const userId = Accounts.createUser({ username: Random.id(), email: `${Random.id(6)}@domain.tld` })
      Meteor.users.update(userId, { $set: { firstName: Random.id(), lastName: Random.id() } })
      Admins.collection().insert({ userId })

      bootstrapAdmin = require('../server/bootstrapAdmin').bootstrapAdmin // first time resolve module, then use export
      expect(Meteor.users.find().count()).to.equal(1)
      expect(Admins.collection().find().count()).to.equal(1)
    })
    it('should throw an error, if the minimum credentials are not provided', function () {
      delete Meteor.settings.admin.firstName
      expect(() => bootstrapAdmin()).to.throw('Match error: Missing key \'firstName\'')
      expectRolledBack()
    })
    it('it should add the credentials to the newly created Admin user account', function () {
      bootstrapAdmin()
      const adminUser = Meteor.users.findOne()
      expect(adminUser.username).to.equal(admin.username)
      expect(adminUser.emails[0].address).to.equal(admin.email)
      expect(adminUser.firstName).to.equal(admin.firstName)
      expect(adminUser.lastName).to.equal(admin.lastName)
    })
    it('should throw an error if the Admin is not the first user', function () {
      Accounts.createUser({ username: Random.id() })
      expect(() => bootstrapAdmin()).to.throw(`Unexpected users/admin mismatch: There were 1 users and 0 admins.`)
      expectRolledBack()
    })
    it('should throw an error, if the user (via userId), that is supposed to become Admin does not exist', function () {
      expect(() => Admins.collection().insert({ userId: Random.id() })).to.throw(`userId is invalid in admins insert`)
      expectRolledBack()
    })
    it('should create the Admin user without password', function () {
      bootstrapAdmin()
      const adminUser = Meteor.users.findOne()
      expect(adminUser.services.password.bcrypt).to.equal(undefined)
      expect(adminUser.services.password.reset).to.be.a('object')
    })
    it('should send an enrolment link to the successfully created Admin user', function (done) {
      const originalLog = console.log
      let doneCalled = false
      console.log = (text) => {
        if (doneCalled) return
        if (text.includes('Enrollment email URL: http://localhost:3000/#/enroll-account/')) {
          console.log = originalLog
          doneCalled = true
          return done()
        } else {
          console.log = originalLog
          doneCalled = true
          return done(new Error(`expected mail to be logged`))
        }
      }
      bootstrapAdmin()
    })
    it('should delete the Admin credentials from the config, once completed with success', function () {
      bootstrapAdmin()
      expect(Meteor.settings.admin).to.equal(undefined)

      const processSettings = JSON.parse(process.env.METEOR_SETTINGS)
      expect(processSettings.admin).to.equal(undefined)
    })
  })
}

if (Meteor.isClient) {
  describe('bootstrapAdmin', function () {
    it ('it should not be able to access the procedure on the client', function (done) {
      import('../server/bootstrapAdmin').catch(e => {
        expect(e.message).to.equal('Cannot find module \'../server/bootstrapAdmin\'')
        done()
      })
    })
  })
}