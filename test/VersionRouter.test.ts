import {expect} from 'chai';
import {ErrorRequestHandler, NextFunction, Request, Response} from "express";
import Express = require("express");
import {VersionedRoute, VersionRouter} from "../src/VersionRouter";
import supertest = require("supertest");


describe('VersionRouter', async function () {
  this.timeout(60000);
  const handleError: ErrorRequestHandler = function (err, req, res, next) {
    console.error(err.stack)
    if (err.message.includes('Route not found for version')) {
      res.status(404).send({errorMessage: err.message})
    } else {
      res.status(500).send({errorMessage: err.message})
    }
  }
  it('should route request by version', async function () {
    const routeVersions: Array<VersionedRoute> = [
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
    ];
    const app = Express();
    app.use(VersionRouter.ExtractVersionFromHeader('Accept-version'));
    app.use('/', new VersionRouter(routeVersions).routeRequestByVersion());
    app.use(handleError);
    const server = await app.listen(9091);

    let res = await supertest(app)
      .get('/')
      .set({'Accept-version': '1.0.0'})
    console.log(res.body)
    expect(res.body).to.have.property('route').that.eq('1')

    res = await supertest(app)
      .get('/')
      .set({'Accept-version': '1.2.0'})
    console.log(res.body)
    expect(res.body).to.have.property('route').that.eq('2')

    res = await supertest(app)
      .get('/')
      .set({'Accept-version': '1.3.0'})
    console.log(res.body)
    expect(res.body).to.have.property('route').that.eq('2')

    res = await supertest(app)
      .get('/')
      .set({'Accept-version': '2.0.0'})
    console.log(res.body)
    expect(res.body).to.have.property('route').that.eq('3')

    // no matches - default route
    res = await supertest(app)
      .get('/')
      .set({'Accept-version': '1.1.0'})
    console.log(res.body)
    expect(res.body).to.have.property('route').that.eq('3')

    // no version in request - route to default
    res = await supertest(app)
      .get('/')
    console.log(res.body)
    expect(res.body).to.have.property('route').that.eq('3')

    server.close();

  });
  it('should return a error when version does not match and default not defined', async function () {
    const versionRouter = new VersionRouter([
      new VersionedRoute({
        version: '1.0.0',
        default: false,
        middleware: [
          (req: Request, res: Response, next: NextFunction) => {
            console.log('route 1 function 1')
            next()
          },
          (req: Request, res: Response, next: NextFunction) => {
            console.log('route 1 function 2')
            res.send({route: '1'})
          },
        ]
      }),
      new VersionedRoute({
        version: '>=1.2.0',
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
      })
    ])
    const app = Express();
    app.use(VersionRouter.ExtractVersionFromHeader('Accept-version'));
    app.use('/users', versionRouter.routeRequestByVersion());
    app.use(handleError);
    const server = await app.listen(9099);
    //
    // let res = await supertest(app)
    //   .get('/users')
    //   .set({'Accept-version': '1.0.0'})
    //   .expect(200)

    let res = await supertest(app)
      .get('/users')
      .set({'Accept-version': '1.1.0'})
      .expect(404);
    expect(res.body).to.haveOwnProperty('errorMessage').that.includes('Route not found for version')
    await server.close();

  });
  it('should return a error when no version header was supplied and no default version defined', async function () {
    const versionRouter = new VersionRouter([
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
      })
    ])
    const app = Express();
    app.use(VersionRouter.ExtractVersionFromHeader('Accept-version'));
    app.use('/', versionRouter.routeRequestByVersion());
    app.use(handleError);
    const server = await app.listen(10222);

    let res = await supertest(app)
      .get('/')
      .expect(404)
    expect(res.body).to.haveOwnProperty('errorMessage').that.includes('Route not found for version')
    server.close();
  });
  it('should use custom error handler', async function () {
    const versionRouter = new VersionRouter([
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
      })
    ], {
      errorHandler: (req, res, next) => {
        res.send({message: 'custom message'});
      }
    })
    const app = Express();
    app.use(VersionRouter.ExtractVersionFromHeader('Accept-version'));
    app.use('/', versionRouter.routeRequestByVersion());
    app.use(handleError);
    const server = await app.listen(10223);

    let res = await supertest(app)
      .get('/')
      .expect(200)
    expect(res.body).to.haveOwnProperty('message').that.includes('custom message')
    server.close();
  });
});
