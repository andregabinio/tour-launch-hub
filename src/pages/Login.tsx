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
        toast.success('Conta criada com sucesso!');
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/logo.png" alt="Tour" className="mx-auto mb-2 h-12 w-12 rounded-lg object-cover" />
          <CardTitle className="text-2xl">TOUR Launch Hub</CardTitle>
          <CardDescription>
            {isSignUp ? 'Crie sua conta' : 'Entre na sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Já tem conta? Entre' : 'Não tem conta? Crie uma'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
