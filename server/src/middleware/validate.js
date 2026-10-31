import { badRequest } from '../lib/errors.js';

// validate({ body: zodSchema, query: zodSchema, params: zodSchema })
// Parsed (coerced) values replace req.body / req.query / req.params.
export const validate = (schemas) => (req, _res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(badRequest(details[0]?.message || 'Invalid input', details));
    }
    req[part] = result.data;
  }
  next();
};
