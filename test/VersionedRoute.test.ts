import {expect} from 'chai';
import Express, {NextFunction, Request, Response} from "express";
import {VersionedRoute, VersionRouter} from "../src/VersionRouter";

describe('class VersionedRoute', async function () {
  it('should create a versioned route instance', async function () {
    const vr = new VersionedRoute({
      default: true,
      middleware: [
        (req: Request, res: Response, next: NextFunction) => {
          res.send()
        },
      ],
      version: "1.0.0"
    })
    
    expect(vr).to.be.instanceOf(VersionedRoute);
  });
  it('should generate a router instance containing the route middleware', async function () {
    const vr = new VersionedRoute({
      default: true,
      middleware: [
        (req: Request, res: Response, next: NextFunction) => {
          next()
        },
        (req: Request, res: Response, next: NextFunction) => {
          next()
        },
        (req: Request, res: Response, next: NextFunction) => {
          res.send()
        },
      ],
      version: "1.0.0"
    })
    const router = vr.toRouter();
    expect(router.stack).to.have.length(3)
  });

});
