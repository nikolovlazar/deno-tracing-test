import * as Sentry from 'https://deno.land/x/sentry/index.mjs';

Sentry.init({
  dsn: 'https://f41eae5880242718071636c5e9ce0bfa@o4506044970565632.ingest.us.sentry.io/4509594324631552',
  sendDefaultPii: true,
  tracesSampleRate: 1,
});

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(req.url);

  if (url.pathname === '/submit') {
    if (req.method === 'POST') {
      const sentryTrace = req.headers.get('sentry-trace')?.toString();
      const baggage = req.headers.get('baggage')?.toString();

      if (!sentryTrace || !baggage) {
        return Response.json(
          { message: 'Missing sentry-trace or baggage' },
          { status: 400 }
        );
      }

      return Sentry.continueTrace({ sentryTrace, baggage }, () =>
        Sentry.startSpan(
          { name: 'submit', op: 'http.server' },
          async (span) => {
            const formData = await req.formData();
            let name: string | undefined = undefined;
            let email: string | undefined = undefined;
            let message: string | undefined = undefined;

            await Sentry.startSpan(
              { name: 'parse form data', op: 'function' },
              () => {
                name = formData.get('name')?.toString();
                email = formData.get('email')?.toString();
                message = formData.get('message')?.toString();
              }
            );

            if (!name || !email || !message) {
              return Response.json(
                { message: 'Invalid form data' },
                { status: 400 }
              );
            }

            span.setAttributes({
              name,
              email,
              message,
            });

            console.log(name, email, message);

            await Sentry.startSpan(
              {
                name: 'SELECT "id" FROM "users" WHERE "name" = $1',
                op: 'db.query',
                attributes: {
                  'db.system': 'postgresql',
                },
              },
              () => new Promise((resolve) => setTimeout(resolve, 315))
            );

            return Response.json(
              {
                message: `Form submitted successfully - ${name} ${email} ${message}`,
              },
              {
                status: 200,
                headers: {
                  'Access-Control-Allow-Origin': 'http://localhost:3000',
                },
              }
            );
          }
        )
      );
    }
    return Response.json({ message: 'Method not allowed' }, { status: 405 });
  }

  return Response.json({ message: 'Not found' }, { status: 404 });
});
