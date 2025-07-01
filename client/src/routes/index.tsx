import { createFileRoute } from '@tanstack/react-router';
import logo from '../logo.svg';
import '../App.css';
import * as Sentry from '@sentry/react';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    Sentry.startSpan(
      { name: 'submitting form data', op: 'function' },
      async (span) => {
        const name = formData.get('name')?.toString();
        const email = formData.get('email')?.toString();
        const message = formData.get('message')?.toString();

        const response = await fetch(
          'https://kemvrlyubpaidfomrgcq.supabase.co/functions/v1/guest-signing',
          {
            method: 'POST',
            body: JSON.stringify({ name, email, message }),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        span.setAttributes({
          'http.response.status_code': response.status,
          'http.response_content_length': Number(
            response.headers.get('content-length')
          ),
        });
      }
    );
  };

  return (
    <div className='App'>
      <div className='guest-form-container'>
        <h2>Guest Sign Form</h2>
        <form onSubmit={handleSubmit} className='guest-form'>
          <div className='form-group'>
            <label htmlFor='name'>Name:</label>
            <input type='text' id='name' name='name' required />
          </div>

          <div className='form-group'>
            <label htmlFor='email'>Email:</label>
            <input type='email' id='email' name='email' required />
          </div>

          <div className='form-group'>
            <label htmlFor='message'>Message:</label>
            <textarea id='message' name='message' rows={4} required />
          </div>

          <button type='submit' className='submit-btn'>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
