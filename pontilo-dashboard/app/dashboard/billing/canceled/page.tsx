'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import Link from 'next/link';

export default function PaymentCanceledPage() {
  return (
    <div className="container mx-auto py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Pagamento Cancelado</CardTitle>
          <CardDescription>
            Você cancelou o processo de pagamento
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Não se preocupe, você pode tentar novamente a qualquer momento.</p>
            <p className="mt-2">
              Sua conta continua ativa no plano atual.
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Precisa de ajuda? Entre em contato conosco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}