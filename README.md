## Express Version Router
#### Lightweight api versioning tool for express
[![Build Status](https://travis-ci.org/roiperlman/express-version-router.svg?branch=master)](https://travis-ci.org/roiperlman/express-version-router)
[![Coverage Status](https://coveralls.io/repos/github/roiperlman/express-version-router/badge.svg?branch=master)](https://coveralls.io/github/roiperlman/express-version-router?branch=master)
## Installation
***
```
npm install --save express-version-router
```

 import:
```typescript
import {VersionRouter, VersionedRoute} from 'express-version-router';
```

This module generates [Express](https://www.npmjs.com/package/express) middleware that enables efficient management of api routes versions.
It enables the use of middleware arrays for each version of the route, and flexible version resolving strategies. 

## Usage
***
### Determining the desired version for the request
VersionedRoute assumes the existence of a 'version' property on the request object.
This property can be generated in any way along the route's path. 
VersionedRoute has a static utility method that can be mounted to extract the version from a header and assign it to req.version.

```typescript
app.use(VersionedRoute.ExtractVersionFromHeader('App-version')
```

Any custom header can be used, as well as any other strategy for assigning a value to request.version

### Configuring versioned routes
Version matching is done according to [semver](https://www.npmjs.com/package/semver) standards.

```typescript
const routeVersions = [
  new VersionedRoute({
    version: '1.0.0',
    default: false,
    middleware: [
      (req: Request, res: Response, next: NextFunction) => {
        console.log('route 2 function 1')
        next()
      },
      (req: Request, res: Response, next: NextFunction) => {
        console.log('route 2 function 2')
        res.send({route: '1'})
      },
    ]
  }),
  new VersionedRoute({
    version: '>=1.2.0 <2.0.0',
    default: false,
    middleware: [
      (req: Request, res: Response, next: NextFunction) => {
        console.log('route 2 function 1')
        next()
      },
      (req: Request, res: Response, next: NextFunction) => {
        console.log('route 2 function 2')
        res.send({route: '2'})
      },
    ]
  }),
  new VersionedRoute({
    version: '2.0.0',
    default: true,
    middleware: [
      (req: Request, res: Response, next: NextFunction) => {
        console.log('route 3 function 1')
        next()
      },
      (req: Request, res: Response, next: NextFunction) => {
        console.log('route 3 function 2')
        res.send({route: '3'})
      },
    ]
  })
]
```

Request version is checked against the versioned route 'version' property according to the semver standard.

If no matches were found, it will resolve to the route defined as default.

## Mount VersionRouter
```typescript
app.use('/testRoute', new VersionRouter(routeVersions).routeRequestByVersion)
```
The router can be configured with a custom error handler for the version matching stage of the
```typescript
app.use('/testRoute', new VersionRouter(
  routeVersions,
  {
    errorHandler: (req, res, next) => {
      // TODO do some error handling stuff
      next(new Error('some message'))
    }
  }).routeRequestByVersion)
```

# Api
***
## Class: VersionRouter
Creates a router instance to route requests according to the value of req.version

```typescript
export declare class VersionRouter
```

### Constructors

|  Constructor | Description |
|  --- | --- | 
|  constructor(routes, options) |  Constructs a new instance of the <code>VersionRouter</code> class |

### Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  errorHandler | |(req: RequestWithVersion<!-- -->, res: Response, next: NextFunction) =&gt; void |  Error handler function for the version matching stage    |
|  routes | |Array&lt;VersionedRoute<!-- -->&gt;  |  Array of <code>VersionedRoute</code> defining the routing options and versions |  

### Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  ExtractVersionFromHeaders(versionHeader) | <code>static</code> | Middleware for extracting the version from the said request header and assign it to req.version Mount it once BEFORE all versioned routes |
|  routeRequestByVersion()|  | Middleware to mount on the route path e.g. app.use('/api/users', UsersRoutes.routeRequestByVersion()) |

## Class: VersionedRoute
Creates a versioned route object that contains middleware and version data

<b>Signature:</b>

```typescript
export declare class VersionedRoute implements VersionedMiddleware 
```
<b>Implements:</b> VersionedMiddleware

### Constructors

|  Constructor | Description |
|  --- | --- |
|  constructor(config) |   Constructs a new instance of the <code>VersionedRoute</code> class |

### Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  default |  | boolean | Sets the version as default.<code>VersionRouter</code>will resolve to the default route in when version property is undefined or no matching version was found  |
|  middleware |  | Array&lt;RequestHandler>| An array of request handlers to mount on the versioned route |
|  version |  | string | Semver version number  |

### Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  toRouter() |  | returns a <code>Router</code>instance with the route's middleware mounted |

