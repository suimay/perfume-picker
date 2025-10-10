import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface LoginProps {
  onToggleMode: () => void;
  onSuccess: () => void;
}

export function Login({ onToggleMode, onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } else {
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">로그인</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
        />

        <Input
          type="password"
          label="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      <p className="text-center mt-6 text-neutral-600">
        계정이 없으신가요?{' '}
        <button
          onClick={onToggleMode}
          className="text-neutral-900 font-semibold hover:underline"
        >
          회원가입
        </button>
      </p>
    </div>
  );
}
