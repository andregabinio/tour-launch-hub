import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, nome);
        toast.success('acesso criado');
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="picote-bg flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <img
            src="/logo.png"
            alt="Tour"
            className="mx-auto mb-3 h-14 w-14 rounded-lg object-cover"
          />
          <CardTitle className="font-extrabold tracking-tight text-3xl lowercase">
            tour launch hub
          </CardTitle>
          <CardDescription className="lowercase">
            {isSignUp ? 'criar acesso' : 'entrar no painel'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="nome">nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="seu nome"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">e-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="sua senha"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? 'um momento...' : isSignUp ? 'criar acesso' : 'entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary underline-offset-4 hover:underline lowercase"
            >
              {isSignUp ? 'já tem acesso? entrar' : 'ainda não tem acesso? criar'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
