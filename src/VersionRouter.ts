import Express, {NextFunction, Request, RequestHandler, Response, Router} from 'express';
import semver from "semver/preload";

/**
 * An Express request handler that returns a promise
 * @public
 */
export interface RequestHandlerWithPromise extends RequestHandler {
  (req: Request, res: Response, next: NextFunction): Promise<any>;
}

/**
 * Express request object with added property 'version'
 * @public
 */
export interface RequestWithVersion extends Express.Request {
  version: string | undefined;
}

/**
 * An Express request handler with a request parameter of type RequestWithVersion
 * @public
 */
export interface RequestHandlerWithVersion extends Express.RequestHandler {
  (req: RequestWithVersion, res: Express.Response, next: Express.NextFunction): void
}

/**
 * VersionRouter constructor options
 * @public
 */
export interface VersionRouterOptions {
  /**
   * Custom error handler for the version match stage
   * @param req - request
   * @param res - response
   * @param next - next function
   */
  errorHandler: (req: RequestWithVersion , res: Response, next: NextFunction) => any
}

/**
 * Creates a router instance to route requests according to the value of req.version
 * @public
 */
export class VersionRouter {
  routes: Array<VersionedRoute>;
  errorHandler:
    (req: RequestWithVersion , res: Response, next: NextFunction) => void
    = (req: RequestWithVersion , res: Response, next: NextFunction) => {
    next(new Error('Route not found for version ' + req.version));
  }

  /**
   * Instantiates a Version Router
   * @param routes - versioned routes
   * @param options - additional options
   * @param options.errorHandler - Custom error handler for the version match stage
   * @constructor
   * @returns VersionRouter
   */
  constructor(routes: Array<VersionedRoute>, options?: VersionRouterOptions) {
    this.routes = routes;
    if (options) {
      this.errorHandler =  options.errorHandler;
    }
    return this
  }

  /**
   * Middleware for extracting the version from the said request header and assign it to req.version
   * Mount it once BEFORE all versioned routes
   * @param versionHeader - custom header
   */
  static ExtractVersionFromHeader(versionHeader: string)  {
    return (req: Request, res: Response, next: NextFunction) => {
      // @ts-ignore
      req.version = req.header(versionHeader) as string;
      return next()
    }
  }

  /**
   * Middleware to mount on the route path
   * e.g. app.use('/api/users', UsersRoutes.routeRequestByVersion())
   */
  routeRequestByVersion(): RequestHandlerWithVersion {
    const routes: Array<VersionedRoute> = [...this.routes];
    return (req: RequestWithVersion, res: Express.Response, next: Express.NextFunction) => {
      let router: Router;
      let route: VersionedRoute | undefined;
      if (!req.version) { // version not defined - get default route
        route = routes.find(r => r.default);
        if (!route) { // default route not found - return error
          return this.errorHandler(req, res, next);
        } else {
          router = route.toRouter();
        }
      } else {
        route = routes.find(
          r => semver.satisfies(req.version as string, r.version)
        );
        if (!route) {
          route = routes.find(r => r.default)
        }
        if (!route) {
          return this.errorHandler(req, res, next)
        }
        router = route.toRouter();
      }
      router(req, res, next);
    }
  }
}

/**
 * Creates a versioned route object that contains middleware and version data
 * @public
 * @returns an instance of VersionedRoute
 */
export class VersionedRoute implements VersionedMiddleware {
  middleware: Array<RequestHandler | RequestHandlerWithPromise> = [];
  version: string;
  default: boolean;

  constructor(config: VersionedMiddleware) {
    this.middleware = config.middleware;
    this.version = config.version;
    this.default = config.default;
  }

  /**
   * @returns the middleware array as a Router
   */
  toRouter(): Express.Router {
    const r = Router();
    r.use(this.middleware);
    return r;
  }
}

/**
 * configuration object for VersionedRoute class
 * @public
 */
export interface VersionedMiddleware {
  version: string;
  middleware: Array<RequestHandler | RequestHandlerWithPromise>;
  default: boolean;
}
