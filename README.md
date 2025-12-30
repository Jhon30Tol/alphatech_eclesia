<div align="center">
# Alphatech Eclesia - Gestão de Igreja

## 🚀 Como fazer o deploy na Vercel

Siga os passos abaixo para implantar o projeto na Vercel:

1. **Importe o Projeto**: No dashboard da Vercel, importe este repositório.
2. **Configuração de Build**:
   - **Framework Preset**: Vite (detectado automaticamente).
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
3. **Variáveis de Ambiente**:
   Adicione as seguintes variáveis no passo de configuração da Vercel:
   - `VITE_SUPABASE_URL`: Sua URL do projeto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Sua Chave Anon do Supabase.
   - `GEMINI_API_KEY`: Sua Chave de API do Google Gemini.
4. **Deploy**: Clique em "Deploy".

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + Vite + TypeScript
- **Backend/DB**: Supabase
- **IA**: Google Gemini API
- **Gráficos**: Recharts
