'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  loading?: boolean;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  loading = false
}: PricingCardProps) {
  return (
    <Card className={`relative ${isPopular ? 'border-blue-500 shadow-lg' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
          Mais Popular
        </Badge>
      )}
      
      {isCurrentPlan && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
          Plano Atual
        </Badge>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`}
          </span>
          {price > 0 && <span className="text-muted-foreground">/mês</span>}
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onSelect}
          disabled={isCurrentPlan || loading}
          variant={isCurrentPlan ? "outline" : "default"}
        >
          {loading ? 'Processando...' : isCurrentPlan ? 'Plano Atual' : 'Selecionar Plano'}
        </Button>
      </CardFooter>
    </Card>
  );
}