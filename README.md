# Zaptutor

Extensão para o Google Chrome que insere automaticamente o **nome do atendente na
frente de cada mensagem enviada no WhatsApp Web**.

Ideal para equipes que **compartilham o mesmo número de telefone**: o cliente sempre
sabe com quem está falando, porque o nome vira **conteúdo real da mensagem** — visível
para todos os destinatários, em qualquer dispositivo, inclusive em grupos.

> **Status:** em uso. O spec de design foi removido do repositório junto com o
> resto do andaime — segue recuperável no histórico do git.

## Recursos (v1)

- ✅ Nome do atendente na frente da mensagem.
- ✅ Formatação do nome: **negrito**, *itálico* e quebra de linha (markdown nativo do
  WhatsApp — aparece para todos).
- ✅ "Frase inicial maiúscula": capitaliza a primeira letra das frases ao enviar.
- ✅ Ligar/desligar pela tela de configuração (popup).
- ✅ O nome **sincroniza pela conta Google** (`chrome.storage.sync`): configure uma
  vez e ele acompanha você em qualquer computador onde logar.

## Como funciona

O nome não é um enfeite visual local — ele é escrito dentro do texto da mensagem
antes do envio. Exemplo do que o cliente recebe:

```
João
Olá, tudo bem? Como posso ajudar?
```

## Instalação (modo desenvolvedor)

1. Baixe/clone este repositório.
2. Abra `chrome://extensions`.
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto.
5. Abra (ou recarregue) o `web.whatsapp.com`, clique no ícone da extensão e
   configure o seu nome.

## Stack

- Chrome Extension **Manifest V3**
- JavaScript (sem dependências externas)
- Lógica de formatação isolada e testável

## Roadmap

- Troca rápida entre vários atendentes (atalhos Alt+1/2/3).
- "Frase maiúscula" ao vivo enquanto digita.
- Publicação na Chrome Web Store.

## Licença

MIT
