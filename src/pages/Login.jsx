import React, { useState } from 'react';
import { Card, Input, Button } from '../components/commonComponents';
import { getStorageName } from '../utils/calculations';

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const validEmail = 'ashokyadav@gmail.com';
    const validPassword = 'Yadav@2026';

    if (email.trim().toLowerCase() !== validEmail || password !== validPassword) {
      setError('Invalid credentials.');
      return;
    }

    onLogin({ email: email.trim().toLowerCase() });
  };

  const storageName = getStorageName();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card title={`${storageName} Login`}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              placeholder="username"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="lg" className="!w-full">
              Login
            </Button>
          </form>

          <div className="mt-6 text-sm text-gray-600">
          </div>
        </Card>
      </div>
    </div>
  );
};
