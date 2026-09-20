import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { HeartPulse, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(username, password, role, otpRequired ? otpToken : undefined);
      if (result.otpRequired) {
        setOtpRequired(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.body?.error || err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-teal-100 p-3">
            <HeartPulse className="h-10 w-10 text-teal-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Respiscan
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          AI-Powered Bacterial Pneumonia Detection
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {otpRequired ? 'Enter your 2FA code' : 'Sign in to your account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!otpRequired && (
              <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button
                  type="button"
                  className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${role === 'employee' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setRole('employee')}
                >
                  Employee
                </button>
                <button
                  type="button"
                  className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${role === 'admin' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setRole('admin')}
                >
                  Administrator
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              {!otpRequired ? (
                <>
                  <Input
                    label="Email / Username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    placeholder={`Enter your ${role} email or username`}
                  />
                  <Input
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="••••••••"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                        Forgot your password?
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <Input
                  label="6-digit authentication code"
                  type="text"
                  required
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  placeholder="123456"
                  autoFocus
                />
              )}

              <Button type="submit" className="w-full text-base" disabled={submitting}>
                {submitting ? 'Please wait…' : otpRequired ? 'Verify' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
