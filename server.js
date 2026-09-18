const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Banco de dados em memória temporário
const messagesDB = {};

// Conteúdo da mensagem dividido por parágrafos
const messageParagraphs = [
  "Olha, já que você decidiu colocar para fora tudo o que estava engasgado, eu também não vou guardar nada...",
  "Não vou julgar quem você é no geral para não cometer injustiças, mas vou expor exatamente como você se comportou comigo.",
  "Você fez um escândalo e me esculhambou só porque adicionei a Gabi...",
  "No dia 15/08, na Zebu, apenas não concordei quando você insinuou que não me convidou porque eu não dei abertura...",
  "Até então eu não conhecia esse seu jeito de não responder; para mim era algo atípico...",
  "No final de semana do dia 22/08, você disse que não nos veríamos porque sua família precisava de você...",
  "No dia 27/08, a sua farra durou 5 dias entre Barretos, Franca e Rifaina...",
  "No feriado do dia 07/09, no rancho, mais uma vez você sumiu...",
  "A minha reação diante disso foi ficar digerindo em silêncio...",
  "No dia 14/09, mais convites meus foram recusados, mais silêncio...",
  "Para cada falha minha que você aponta, existem dezenas de atitudes suas que você jamais aceitaria...",
  "Fui ultrapassando meus limites e aceitando um tratamento que não merecia...",
  "Hoje, você joga uma carga de raiva em cima de mim...",
  "Não escrevo isso esperando desculpas, mudança ou resposta. Esse foi o meu limite.",
  "No balanço final do que cada um fez e representou, você está perdendo alguém que te tratou com cuidado. Se isso não te incomoda, melhore."
];

// Rota de criação do link seguro
app.post('/api/create-message', (req, res) => {
  const token = crypto.randomBytes(16).toString('hex');
  messagesDB[token] = {
    paragraphs: messageParagraphs,
    registeredKey: null,
    status: 'pending' // pending -> active -> destroyed
  };
  res.json({ link: `https://seu-dominio.com/read.html?token=${token}` });
});

// Middleware de verificação exclusiva de iPhone
function isiPhone(userAgent) {
  return /iPhone/i.test(userAgent);
}

// Rota de validação e entrega da mensagem
app.post('/api/read-message', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const { token, publicKey } = req.body;

  if (!isiPhone(userAgent)) {
    return res.status(403).json({ error: "Acesso permitido exclusivamente via iPhone." });
  }

  const session = messagesDB[token];

  if (!session || session.status === 'destroyed') {
    return res.status(410).json({ error: "Esta mensagem já foi lida e destruída." });
  }

  // Trava de Dispositivo Único (Pairing)
  if (!session.registeredKey) {
    session.registeredKey = publicKey;
    session.status = 'active';
  } else if (session.registeredKey !== publicKey) {
    return res.status(403).json({ error: "Este link foi vinculado a outro dispositivo." });
  }

  res.json({ paragraphs: session.paragraphs });
});

// Rota para destruir a mensagem ao concluir
app.post('/api/destroy-message', (req, res) => {
  const { token } = req.body;
  if (messagesDB[token]) {
    delete messagesDB[token];
  }
  res.json({ success: true });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));