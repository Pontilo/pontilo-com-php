"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import DiceBearAvatar from "@/components/avatar/avataaars-avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Sparkles, Palette, User, CheckCircle } from "lucide-react"
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

interface AvatarConfig {
  avatarStyle?: string
  topType?: string
  accessoriesType?: string
  hairColor?: string
  clotheType?: string
  clotheColor?: string
  skinColor?: string
  eyeType?: string
  eyebrowType?: string
  mouthType?: string
  facialHairType?: string
}

interface AvatarItem {
  id: string
  type: string
  value: string
  displayName: string
  costPoints: number
  isDefault: boolean
}

interface AvatarCustomizerProps {
  studentId: string
  token: string
}

const defaultConfig: AvatarConfig = {
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

export default function AvatarCustomizer({ studentId, token }: AvatarCustomizerProps) {
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
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-10 w-10 text-gray-400" />
            </div>
          </div>
        )
      }
      return this.props.children
    }
  }
  const [config, setConfig] = useState<AvatarConfig>(defaultConfig)
  const [unlockedItems, setUnlockedItems] = useState<AvatarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [mounted, setMounted] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      const configResponse = await fetch(apiUrl("students/avatar/config"), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      
      if (configResponse.ok) {
        const configData = await configResponse.json()
        
        let avatarConfig = null
        if (configData.config) {
          avatarConfig = configData.config
        } else if (configData.eyeType || configData.topType || configData.avatarStyle) {
          avatarConfig = configData
        }
        
        if (avatarConfig) {
          const mergedConfig = { ...defaultConfig, ...avatarConfig }
          setConfig(mergedConfig)
        } else {
          setConfig(defaultConfig)
        }
      } else {
        setConfig(defaultConfig)
      }

      const unlockedResponse = await fetch(apiUrl("students/avatar/unlocked"), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
      
      if (unlockedResponse.ok) {
        const unlockedData = await unlockedResponse.json()
        setUnlockedItems(Array.isArray(unlockedData) ? unlockedData : [])
      } else {
        setUnlockedItems([])
      }
    } catch (error) {
      setConfig(defaultConfig)
      setUnlockedItems([])
    } finally {
      setIsLoading(false)
    }
  }, [studentId, token])

  useEffect(() => {
    setMounted(true)
    if (studentId && token) {
      loadData()
    }
  }, [studentId, token, loadData])

  const handleConfigChange = (type: string, value: string) => {
    setConfig((prev) => ({ ...prev, [type]: value }))
  }

  const saveConfig = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(apiUrl("students/avatar/config"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      })

      if (response.ok) {
        setMessage("Configuração salva com sucesso!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Erro ao salvar configuração")
        setTimeout(() => setMessage(""), 5000)
      }
    } catch (error) {
      setMessage("Erro de conexão ao salvar")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const getAvailableOptions = (type: string) => {
    const unlockedOptions = unlockedItems.filter((item) => item.type === type)
    if (unlockedOptions.length === 0) {
      const defaultItem = {
        id: `default-${type}`,
        type: type,
        value: defaultConfig[type as keyof AvatarConfig] || "Default",
        displayName: "Padrão",
        costPoints: 0,
        isDefault: true
      }
      return [defaultItem]
    }
    return unlockedOptions
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">Carregando personalizador...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Personalizar Avatar
            </CardTitle>
            <p className="text-gray-600">Crie seu avatar único com os itens desbloqueados!</p>
          </div>
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Preview do Avatar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-4 sm:p-8">
            <div className="relative">
              <div className="w-32 h-32 sm:w-48 sm:h-48 bg-white rounded-full shadow-2xl p-2 flex items-center justify-center border-4 border-purple-100">
                <DiceBearAvatar config={config} />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              Opções de Personalização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {["avatarStyle", "topType", "hairColor", "accessoriesType", "clotheType", "clotheColor", "skinColor", "eyeType", "eyebrowType", "mouthType", "facialHairType"].map((type) => (
              <div key={type} className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  {type === "avatarStyle" && <MdImage className="h-4 w-4 text-blue-500" />}
                  {type === "topType" && <MdFace className="h-4 w-4 text-blue-500" />}
                  {type === "hairColor" && <MdPalette className="h-4 w-4 text-blue-500" />}
                  {type === "accessoriesType" && <MdVisibility className="h-4 w-4 text-blue-500" />}
                  {type === "clotheType" && <MdCheckroom className="h-4 w-4 text-blue-500" />}
                  {type === "clotheColor" && <MdColorLens className="h-4 w-4 text-blue-500" />}
                  {type === "skinColor" && <MdPerson className="h-4 w-4 text-blue-500" />}
                  {type === "eyeType" && <MdRemoveRedEye className="h-4 w-4 text-blue-500" />}
                  {type === "eyebrowType" && <MdBrush className="h-4 w-4 text-blue-500" />}
                  {type === "mouthType" && <MdRecordVoiceOver className="h-4 w-4 text-blue-500" />}
                  {type === "facialHairType" && <MdFace2 className="h-4 w-4 text-blue-500" />}
                  {type.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </Label>
                <Select value={config[type as keyof AvatarConfig]} onValueChange={(value) => handleConfigChange(type, value)}>
                  <SelectTrigger className="bg-white border-gray-200 hover:border-purple-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableOptions(type).map((item) => (
                      <SelectItem key={item.id} value={item.value}>
                        {item.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            {message && (
              <Alert className={message.includes('sucesso') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={message.includes('sucesso') ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={saveConfig} 
              disabled={isSaving} 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
