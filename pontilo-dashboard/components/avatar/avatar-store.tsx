"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import DiceBearAvatar from "@/components/avatar/avataaars-avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Check, Coins, RefreshCw, Lock, Unlock, Star, Crown, Zap, Sparkles, Eye } from "lucide-react"
import { useConfirmDialog } from "@/components/ui/confirm-provider"
import { 
  MdImage, 
  MdFace, 
  MdVisibility, 
  MdPalette, 
  MdCheckroom, 
  MdColorLens, 
  MdPerson, 
  MdRemoveRedEye, 
  MdBrush, 
  MdRecordVoiceOver, 
  MdFace2 
} from "react-icons/md"

import apiUrl from "@/lib/api-config"

const defaultAvatarConfig = {
  avatarStyle: "Circle",
  topType: "ShortHairShortFlat",
  accessoriesType: "Blank",
  hairColor: "BrownDark",
  clotheType: "Hoodie",
  clotheColor: "Blue03",
  skinColor: "Light",
  eyeType: "Default",
  eyebrowType: "Default",
  mouthType: "Default",
  facialHairType: "Blank",
}

interface AvatarItem {
  id: string
  type: string
  value: string
  displayName: string
  costPoints: number
  isDefault: boolean
  createdAt?: string
}

interface AvatarStoreProps {
  studentId: string
  avatarPoints: number
  onUpdateAvatarPoints: (newPoints: number) => void
  token: string
}

const itemTypes = [
  { key: "avatarStyle", label: "Fundo", icon: MdImage },
  { key: "topType", label: "Cabelo", icon: MdFace },
  { key: "accessoriesType", label: "Acessórios", icon: MdVisibility },
  { key: "hairColor", label: "Cor do Cabelo", icon: MdPalette },
  { key: "clotheType", label: "Roupa", icon: MdCheckroom },
  { key: "clotheColor", label: "Cor da Roupa", icon: MdColorLens },
  { key: "skinColor", label: "Cor da Pele", icon: MdPerson },
  { key: "eyeType", label: "Olhos", icon: MdRemoveRedEye },
  { key: "eyebrowType", label: "Sobrancelhas", icon: MdBrush },
  { key: "mouthType", label: "Boca", icon: MdRecordVoiceOver },
  { key: "facialHairType", label: "Barba", icon: MdFace2 },
]

export default function AvatarStore({ studentId, avatarPoints, onUpdateAvatarPoints, token }: AvatarStoreProps) {
  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
      super(props)
      this.state = { hasError: false }
    }
    static getDerivedStateFromError() {
      return { hasError: true }
    }
    componentDidCatch() {}
    render() {
      if (this.state.hasError) {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        )
      }
      return this.props.children
    }
  }
  const [allItems, setAllItems] = useState<AvatarItem[]>([])
  const [unlockedItems, setUnlockedItems] = useState<AvatarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unlockingItem, setUnlockingItem] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [previewItem, setPreviewItem] = useState<AvatarItem | null>(null)
  const [mounted, setMounted] = useState(false)
  const { confirm } = useConfirmDialog()

  const getPreviewAvatarConfig = (item: AvatarItem | null) => {
    if (!item) return defaultAvatarConfig
    return {
      ...defaultAvatarConfig,
      [item.type]: item.value
    }
  }

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true)

      const allItemsResponse = await fetch(apiUrl("avatar-items"))
      
      if (!allItemsResponse.ok) {
        throw new Error(`Erro na API: ${allItemsResponse.status}`)
      }
      
      const allItemsData = await allItemsResponse.json()
      
      if (allItemsData.error) {
        throw new Error(allItemsData.error)
      }

      const unlockedResponse = await fetch(apiUrl("students/avatar/unlocked"), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      const unlockedData = await unlockedResponse.json()

      setAllItems(Array.isArray(allItemsData) ? allItemsData : [])
      setUnlockedItems(Array.isArray(unlockedData) ? unlockedData : [])
    } catch (error) {
      setMessage(`Erro ao carregar itens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setTimeout(() => setMessage(""), 5000)
      setAllItems([])
      setUnlockedItems([])
    } finally {
      setIsLoading(false)
    }
  }, [studentId, token])

  useEffect(() => {
    setMounted(true)
    loadItems()
  }, [loadItems])

  const unlockItem = async (itemId: string, cost: number, itemName: string) => {
    if (avatarPoints < cost) {
      setMessage("Pontos insuficientes!")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    const confirmed = await confirm({
      title: "Confirmar Desbloqueio",
      message: `Deseja gastar ${cost} pontos para desbloquear "${itemName}"?`,
      confirmText: "Desbloquear",
      cancelText: "Cancelar",
      type: "warning"
    })

    if (!confirmed) return

    try {
      setUnlockingItem(itemId)
      const response = await fetch(apiUrl("students/avatar/unlock"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarItemId: itemId }),
      })

      const responseData = await response.json()

      if (response.ok) {
        if (responseData.newAvatarPoints !== undefined) {
          onUpdateAvatarPoints(responseData.newAvatarPoints)
        } else {
          onUpdateAvatarPoints(avatarPoints - cost)
        }
        
        await loadItems()
        setMessage("Item desbloqueado com sucesso!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        if (response.status === 400) {
          setMessage("Dados inválidos para desbloqueio")
        } else if (response.status === 404) {
          setMessage("Estudante ou item não encontrado")
        } else if (response.status === 409) {
          setMessage(responseData.error || "Item já desbloqueado ou pontos insuficientes")
        } else {
          setMessage("Erro ao desbloquear item")
        }
        setTimeout(() => setMessage(""), 5000)
      }
    } catch (error) {
      setMessage("Erro de conexão ao desbloquear item")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setUnlockingItem(null)
    }
  }

  const isItemUnlocked = (itemId: string) => {
    return unlockedItems.some((item) => item.id === itemId)
  }

  const getItemsByType = (type: string) => {
    return allItems.filter((item) => item.type === type)
  }

  const getItemRarity = (cost: number) => {
    if (cost >= 80) return { rarity: "Lendário", color: "text-purple-500", bgColor: "bg-purple-100", icon: Crown }
    if (cost >= 50) return { rarity: "Épico", color: "text-orange-500", bgColor: "bg-orange-100", icon: Star }
    if (cost >= 25) return { rarity: "Raro", color: "text-blue-500", bgColor: "bg-blue-100", icon: Sparkles }
    if (cost >= 10) return { rarity: "Comum", color: "text-green-500", bgColor: "bg-green-100", icon: Zap }
    return { rarity: "Básico", color: "text-gray-500", bgColor: "bg-gray-100", icon: Check }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Carregando itens da loja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <CardHeader className="text-center pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loja de Itens
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600">Desbloqueie novos itens para personalizar seu avatar!</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-green-100 to-blue-100 px-3 py-2 sm:px-4 sm:py-2 rounded-full">
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Seus Pontos:</span>
            <span className="ml-2 text-base sm:text-lg font-bold text-green-600">{avatarPoints}</span>
          </div>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 sm:px-4 sm:py-2 rounded-full">
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Itens Desbloqueados:</span>
            <span className="ml-2 text-base sm:text-lg font-bold text-purple-600">{unlockedItems.length}</span>
          </div>
        </div>
      </CardHeader>

      {message && (
        <Alert className={`mb-6 ${message.includes('sucesso') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <AlertDescription className={message.includes('sucesso') ? 'text-green-800' : 'text-red-800'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            {previewItem ? `Preview: ${previewItem.displayName}` : 'Avatar Padrão'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <div className="relative">
            <div className="w-32 h-32 bg-white rounded-xl shadow-lg p-2 flex items-center justify-center">
              <DiceBearAvatar config={getPreviewAvatarConfig(previewItem)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={itemTypes[0]?.key} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 lg:grid-cols-8 h-auto bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-2 gap-1">
          {itemTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <TabsTrigger
                key={type.key}
                value={type.key}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium text-xs p-2"
              >
                <IconComponent className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">{type.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {itemTypes.map((type) => {
          const IconComponent = type.icon
          return (
            <TabsContent key={type.key} value={type.key} className="space-y-4">
              <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <IconComponent className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">{type.label}</h3>
                <span className="text-sm text-gray-600">({getItemsByType(type.key).length} itens)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {getItemsByType(type.key).map((item) => {
                  const rarity = getItemRarity(item.costPoints)
                  const RarityIcon = rarity.icon
                  const unlocked = isItemUnlocked(item.id)
                  const canAfford = avatarPoints >= item.costPoints

                  return (
                    <Card
                      key={item.id}
                      className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                        unlocked
                          ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg'
                          : 'bg-white/80 backdrop-blur-sm border-gray-200 shadow-md hover:shadow-xl'
                      }`}
                    >
                      {unlocked && (
                        <div className="absolute top-1 right-1">
                          <Badge className="bg-green-500 text-white border-0 text-xs px-1 py-0">
                            <Check className="h-2 w-2 mr-1" />
                            OK
                          </Badge>
                        </div>
                      )}

                      <CardContent className="p-3">
                        <div className="text-center space-y-2">
                          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                            unlocked ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'
                          }`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>

                          <div>
                            <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-2">{item.displayName}</h3>
                            <Badge className={`${rarity.bgColor} ${rarity.color} border-0 font-medium text-xs px-1 py-0`}>
                              <RarityIcon className="h-2 w-2 mr-1" />
                              {rarity.rarity}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-center gap-1">
                            <Coins className="h-3 w-3 text-yellow-500" />
                            <span className="font-bold text-sm text-gray-700">{item.costPoints}</span>
                          </div>

                          <div className="space-y-1">
                            <Button
                              onClick={() => setPreviewItem(previewItem?.id === item.id ? null : item)}
                              variant="outline"
                              className={`w-full text-xs py-1 h-6 transition-all duration-300 ${
                                previewItem?.id === item.id
                                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-purple-50'
                              }`}
                            >
                              <Eye className="h-2 w-2 mr-1" />
                              {previewItem?.id === item.id ? 'Ocultar' : 'Preview'}
                            </Button>
                            
                            {unlocked ? (
                              <Button disabled className="w-full bg-green-500 text-white hover:bg-green-600 text-xs py-1 h-7">
                                <Check className="h-3 w-3 mr-1" />
                                OK
                              </Button>
                            ) : (
                              <Button
                                onClick={() => unlockItem(item.id, item.costPoints, item.displayName)}
                                disabled={!canAfford || unlockingItem === item.id}
                                className={`w-full transition-all duration-300 text-xs py-1 h-7 ${
                                  canAfford
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {unlockingItem === item.id ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    ...
                                  </>
                                ) : canAfford ? (
                                  <>
                                    <Unlock className="h-3 w-3 mr-1" />
                                    Desbloquear
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3 w-3 mr-1" />
                                    Caro
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {getItemsByType(type.key).length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🎁</span>
                  </div>
                  <p className="text-gray-500 text-sm">Nenhum item disponível nesta categoria.</p>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
