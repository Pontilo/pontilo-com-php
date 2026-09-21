'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "@/components/billing/PricingCard";
import { CreditCard, Calendar, AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  maxClassrooms: number;
  maxStudentsPerClassroom: number;
  features: string[];
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
}

export default function BillingPage() {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Mock do teacherId - em produção, pegar do contexto de autenticação
  const teacherId = "teacher-id-example";

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      // Carregar planos disponíveis
      const plansResponse = await fetch('/api/subscription/plans');
      const plans = await plansResponse.json();
      setAvailablePlans(plans);

      // Carregar assinatura atual
      const subscriptionResponse = await fetch(`/api/subscription/current-plan/${teacherId}`);
      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json();
        setCurrentSubscription(subscription);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de cobrança:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planType: string) => {
    if (planType === 'GRATUITO') {
      // Se for plano gratuito, não precisa de pagamento
      return;
    }

    setProcessingPlan(planType);

    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId,
          planType,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/payment/create-customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir portal do cliente:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Cobrança e Assinaturas</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu plano e assinatura do ProvaMais
        </p>
      </div>

      {/* Assinatura Atual */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Assinatura Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{currentSubscription.plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  R$ {currentSubscription.plan.price.toFixed(2)}/mês
                </p>
              </div>
              <Badge variant={currentSubscription.status === 'ACTIVE' ? 'default' : 'destructive'}>
                {currentSubscription.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Próxima cobrança: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {currentSubscription.cancelAtPeriodEnd && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sua assinatura será cancelada no final do período atual.
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleManageSubscription} variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Gerenciar Assinatura
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Planos Disponíveis */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Planos Disponíveis</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => (
            <PricingCard
              key={plan.id}
              name={plan.name}
              price={plan.price}
              description={`Até ${plan.maxClassrooms} turmas e ${plan.maxStudentsPerClassroom} alunos por turma`}
              features={plan.features}
              isCurrentPlan={currentSubscription?.plan.type === plan.type}
              isPopular={plan.type === 'PRO'}
              onSelect={() => handleSelectPlan(plan.type)}
              loading={processingPlan === plan.type}
            />
          ))}
        </div>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Você pode cancelar sua assinatura a qualquer momento</p>
          <p>• As cobranças são processadas mensalmente</p>
          <p>• Ao fazer upgrade, você terá acesso imediato às novas funcionalidades</p>
          <p>• Ao fazer downgrade, as mudanças entram em vigor no próximo ciclo</p>
          <p>• Todos os pagamentos são processados de forma segura pelo Stripe</p>
        </CardContent>
      </Card>
    </div>
  );
}
