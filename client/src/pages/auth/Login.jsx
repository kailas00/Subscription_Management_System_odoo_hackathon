import { Link } from 'react-router-dom';
import { SignInForm } from '../../components/auth/SignInForm.jsx';

export default function Login() {
  return (
    <>
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-base text-muted">One sign-in for admins, billing staff and customers.</p>
      <div className="mt-6"><SignInForm autoFocus /></div>
      <p className="mt-6 text-center text-base text-muted">New customer? <Link to="/signup" className="font-semibold text-brand hover:underline">Create an account</Link></p>
    </>
  );
}
