#!/bin/bash

# Script para configurar variáveis de ambiente no Firebase App Hosting
# Execute: chmod +x scripts/setup-firebase-env.sh && ./scripts/setup-firebase-env.sh

echo "🔧 Configurando variáveis de ambiente no Firebase App Hosting..."
echo ""

# Verificar se Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI não encontrado!"
    echo "📦 Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

echo "🔐 Fazendo login no Firebase..."
firebase login

echo ""
echo "📋 Configurando variáveis de ambiente..."
echo ""

# Configurar variáveis públicas
echo "✅ Configurando NEXT_PUBLIC_FIREBASE_PROJECT_ID..."
firebase apphosting:env:set NEXT_PUBLIC_FIREBASE_PROJECT_ID="studio-8444859572-1c9a4" --force

# Configurar secrets (variáveis sensíveis)
echo ""
echo "🔒 Configurando GOOGLE_API_KEY..."
echo "AIzaSyCMuGt4eK2Wyam1LyKGv4TjvkshLWBFLlM" | firebase apphosting:secrets:set GOOGLE_API_KEY

echo ""
echo "🔒 Configurando FIREBASE_CLIENT_EMAIL..."
echo "firebase-adminsdk-fbsvc@studio-8444859572-1c9a4.iam.gserviceaccount.com" | firebase apphosting:secrets:set FIREBASE_CLIENT_EMAIL

echo ""
echo "🔒 Configurando FIREBASE_PRIVATE_KEY..."
cat << 'EOF' | firebase apphosting:secrets:set FIREBASE_PRIVATE_KEY
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvGfIu5laKgpgC
jrs7SWiKKoz2JfN7wTSOj719VN8PZR0cbUx0r1ZTVJOQ81MoA22FBtgmfnruZ8cY
6/TyPZmZAnEC4T1vHmztFLLcAEUwKExF9G3oiH1v/dI0A2NZO39+4MqIW/WeeJAy
XEmo6VFPTwGMEE9cSk6jeoFEiJzJJqvwRWAt6CNKWbF2JoplfZIZE3Jvm6Z/Sg2r
gcxPmaVYyqzkvuQ+HY4Y3M1Mt1tJ8LEW+/+9pVsmBylv/FNUT84JBg2A8UD/Qdq9
GDnitLdkMnqBg2j5OXSq+TOqwBwPbdMDzS1sMWE3i5C73Bapz5tOL4vfH2SNuRAX
7o8EjSDrAgMBAAECggEAUdsSQWSCflvQjhmFY5DMoxKDNSrGqUrHtAF0NtvvLvY4
5qodvMqe03PNTEzDygfYMgDiGRS1iS/QflEIABpV7JacmBkNrB2QFEDB4GDr9zhP
d8BthPARm8IPeys+TV+oGXsikx5SM1PvLOvBr4nq7eVkNsMFJoLCQmApgA1RJiL8
8uKjrUXjDFMT9GHFjPBxGxuCzbgEA6R/+VzbFdk60qnGX7eATEEiytnilu2Z/hhg
3cAhS9F2eKxqMHWDkx1rO3hzJW1eoODlRZpVr8pA+bUXzifTBw9u4ot6QMV54faC
Dm9QADbrg8n7Sf0fcUx/zr5gF3yiX8oNCGacDEIJGQKBgQDWw+kBXKbsJA7RpcJ4
BfZgmnfymnqfZnh0Q/vk/Q4kZkz4S6cWTHehHieWVi10TfIdZndmDcQY/s73liiw
8GPEEMmoD/j40xR/0Wv/GAHVJlEsa2Ce2oBVzJlbwu29uFRFhWRtOzqKdK3w8RWl
FETwkosIahEY5nE+u0Sq1Dp/5QKBgQDQuHwI2j/Vgk6D3r+nMb8Cq/uzoP99ROIu
OWqkk/GqcY3qZcnrPeaKo4RDGO4U+lH1+qBmamTpZUV9eRFXqqE5v+t0rNXsBYKP
IewxFMhirkQ58lefVrZUhao+/6nWPm4OTPSxHwQxpHq/gMWUVTXC+tQX6vfnINjc
dpQLloXwjwKBgQC4FShtIGt7UNTa4ge0NPgfiYdyjPK6Gmz4yyTn+/fZP06OLNpF
BLotgdlQxQElBYKXrLJ+6SHCgvYHxc+PCh2ZewI+aaJwNQ0HGgxFlOBNQRCm0Er7
HjKOWFbDDmwVCCBDjrir3+6nqqdFNH/nBV6qDhHZ3oBVJYC/0mhjPJH/+QKBgA41
4UwBAAObYZkc21OY0XZvGy35sitnOzcGdbpK0FNYc98Xmw3HIyEhTOn8kokfGeFz
dORELiat3HNUgNfFKED0TiWddtsg7Oit2JTm41XEo6SGWWzhzHwotZSgd4G8smWK
28YLZI+0sR7Et68HtidWSIZwWvyDggBQmnfHgcsFAoGAK1gUvt45CEqwmOHB1vPA
+eRIKGwh08FcLS/nB1QxXT1cKBZ8DeclL818+inKUa1WZSh8qydh3tx5rPiWHMGv
WO3NBrEtYLVPAmPl/vwIDp4bRTo52ZFCBwi1J8x61+uauPFr1wiWf+oukktgwK7T
EEoI4O6VsiITgeClBwfot/U=
-----END PRIVATE KEY-----
EOF

echo ""
echo "⚠️  ATENÇÃO: Configure manualmente a RESEND_API_KEY"
echo "Execute: firebase apphosting:secrets:set RESEND_API_KEY"
echo "Cole sua chave do Resend quando solicitado"
echo ""

read -p "Deseja configurar RESEND_API_KEY agora? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[SsYy]$ ]]; then
    firebase apphosting:secrets:set RESEND_API_KEY
fi

echo ""
echo "✅ Configuração de variáveis concluída!"
echo ""
echo "🚀 Próximos passos:"
echo "1. Faça commit das alterações: git add . && git commit -m 'Configure Firebase env vars'"
echo "2. Faça push para deploy: git push"
echo "3. Ou faça deploy manual: firebase deploy --only hosting"
echo ""
echo "⏳ Aguarde alguns minutos para o deploy completar"
echo "🧪 Teste as funcionalidades: reenviar credenciais, trocar senha, deletar usuário"
echo ""
