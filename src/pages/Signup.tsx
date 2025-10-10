import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface SignupProps {
  onToggleMode: () => void;
  onSuccess: () => void;
}

export function Signup({ onToggleMode, onSuccess }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
    } else {
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">회원가입</h2>

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

        <Input
          type="password"
          label="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '가입 중...' : '회원가입'}
        </Button>
      </form>

      <p className="text-center mt-6 text-neutral-600">
        이미 계정이 있으신가요?{' '}
        <button
          onClick={onToggleMode}
          className="text-neutral-900 font-semibold hover:underline"
        >
          로그인
        </button>
      </p>
    </div>
  );
}
