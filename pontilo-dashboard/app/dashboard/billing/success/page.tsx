'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (sessionId) {
      // Aqui você pode fazer uma verificação adicional do pagamento
      // Por enquanto, vamos apenas simular um delay
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
      }, 2000);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container mx-auto py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Processando pagamento...</h2>
          <p className="text-muted-foreground mt-2">
            Aguarde enquanto confirmamos seu pagamento
          </p>
        </div>
      </div>
    );
  }

  if (!success || !sessionId) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Erro no Pagamento</CardTitle>
            <CardDescription>
              Não foi possível processar seu pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard/billing">
                Tentar Novamente
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Pagamento Realizado!</CardTitle>
          <CardDescription>
            Sua assinatura foi ativada com sucesso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Agora você tem acesso a todas as funcionalidades do seu plano.</p>
            <p className="mt-2">
              ID da sessão: <code className="text-xs bg-gray-100 px-1 rounded">{sessionId}</code>
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir para Dashboard
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/billing">
                Ver Detalhes da Assinatura
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}