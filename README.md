# Meteor Bootstrapping Admin Example

[![built with Meteor](https://img.shields.io/badge/Meteor-1.10.2-green?logo=meteor&logoColor=white)](https://meteor.com)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub](https://img.shields.io/github/license/jankapunkt/meteor-bootstrapping-admin-example)

A simple example how to bootstrap an Admin account safely.

## About

This example demonstrates, how you can use your deployment file (`settings.json`) to create
an Admin account as first user of your application by following certain requirements:

1. It should skip the bootstrapping procedure (without errors), if an Admin already exists.

2. The credentials of the person, who will be the Admin, must be known at the time of the server startup. 
   She does not need to be present but her credentials need to be added to the deployment configuration. 
   It should throw an error, if the minimum credentials are not provided. 
   Otherwise, if the credentials are valid, it should add the credentials to the newly created Admin user account.

3. The initial Admin must also be the first user to be created. 
   It should throw an error if the Admin is not the first user. 
   Furthermore, it should throw an error, if the user (via userId), that is supposed to become Admin does not exist. 

4. There must be no default password being configured for the initial Admin. 
   It should create the Admin user without password. This results in denying login until a password is set.

5. The Admin person is required to set a password using a unique password-reset link, that only she receives. 
   Therefore, it should send an enrolment link to the successfully created Admin user.

6. There should be no way for any Meteor method or other methods to "know" the configured name and email. 
   Thus, it should delete the Admin credentials from the config, once completed with success.

7. If any step of this procedure fails, potentially created documents need to be removed (rollback) and 
   an error must be thrown to prevent further startup.

8. There must be no client involvement in creating the initial Admin document at all. 
   Thus, it should not be able to access the procedure on the client.

## Install and run

Just clone this repo, install dependencies and run with settings:

```bash
$ git clone git@github.com:jankapunkt/meteor-bootstrapping-admin-example.git
$ cd meteor-bootstrapping-admin-example
$ meteor npm install
$ meteor --settings=settings.json
```

## Use this in your app

The core logic of this is containted in [`./server/bootstrapAdmin.js`](./server/bootstrapAdmin.js). If you want to use
this code in your app, please beware, that there might still be unknown issues and that there might still be the chance
to create an Admin without permission. If you found such a case, and it can be reproduced, I highly appreciate if you
would open an issue or a pull request.

## Why not a package

Making this a package would require lot's of flexibility and abstraction, since everybody has a different user and admin
schema, some may also require to add `Roles` etc. 
The consequence is an increased complexity beyond the purpose of the use case above and may result in violating 
the requirements.

## Run the tests

The requirements from above are defined as unit tests in the [`tests/main.js`](./tests/main.js) file.

You can run the tests via

```bash
$ meteor npm run test:watch
```

## License

MIT, see [license file](./LICENSE)
