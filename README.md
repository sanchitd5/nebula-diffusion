# Node 18 User Onboarding application (Typescript) [![Build Status](https://github.com/sanchitd5/hapi-boilerplate-typescript/actions/workflows/sonar.yml/badge.svg)](https://github.com/sanchitd5/hapi-boilerplate-typescript/actions/workflows/sonar.yml)
A Node based module to onboard user's into a very basic application, secured using JWT authorization.

The Node.js app uses [Hapi Framework](https://hapijs.com) and [Hapi Swagger](https://github.com/glennjones/hapi-swagger)

PS : This is an Typescript rewrite based of this [project](https://github.com/ChoudharyNavit22/User-Onboarding-Module)

# Contents

* [Manual Deployment](#manual-deployment)
* [Upload Image/Document Guidelines](UPLOAD_IMAGE_GUIDLINE.md)

# Project Dependencies

* MongoDB ([Install MongoDB](https://docs.mongodb.com/manual/administration/install-community/))

# <a id="manual-deployment"></a>Manual Deployment

## Setup Node.js

Inorder to setup NodeJS you need to fellow the current steps:

### Mac OS X

* Step1: Install Home brew

```
$ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

$ brew -v
```

* Step2: Install Node using Brew

```
$ brew install node

$ node -v

$ npm -v
```

### Linux Systems

* Step1: Install Node using apt-get

```
$ sudo apt-get install curl python-software-properties

$ curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -

$ sudo apt-get install nodejs

$ node -v

$ npm -v
```
## Setup Node User Onboarding Application

* Step1: Git clone the application

* Step2a: Install node modules

```
$ npm i -g pnpm
```

```
$ pnpm i
```

* Step3: Copy .env.example to .env

```
$ cp .env.example .env
```

* Step4a: Start the application

```
$ pnpm start
```
* Step4b: Start With Nodemon
```
$ pnpm nodemon
```

## Build

```
$ pnpm build
```

## Starting the build
```
$ pnpm deployment
```

The current version of your application would be running on **http://localhost:8000** or **http://IP_OF_SERVER:8000** (in case you are running on the server)
