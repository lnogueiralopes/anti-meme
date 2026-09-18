const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco de dados em memória temporária
const messagesDB = {};

// Texto dividido em parágrafos para temporização de leitura
const messageParagraphs = [
  "Olha, já que você decidiu colocar para fora tudo o que estava engasgado, eu também não vou guardar nada.",
  "Não vou julgar quem você é no geral para não cometer injustiças, mas vou expor exatamente como você se comportou comigo.",
  "Você fez um escândalo e me esculhambou só porque adicionei a Gabi. Já explained que não foi por interesse — afinal, a conheço há tempos e não é o perfil de mulher que me despertaria interesse. Adicionei por puro impulso para ver os stories em que você aparecia, o que foi um erro meu, pois só me torturei. Mas é incoerente sua indignação, principalmente ao dizer que depois disso \"desanimou de vez\". Antes disso você estava animada? Basta olhar a sequência de fatos dos últimos tempos. Se estava, disfarçou muito bem.",
  "No dia 15/08, na Zebu, apenas não concordei quando você insinuou que não me convidou porque eu não dei abertura, embora no fundo eu entendesse que era sua turma e que você já tinha compromisso com suas amigas. Para mim era um incômodo normal — até mandei a imagem da zebra brincando sobre isso. Incomodava, mas tudo bem, faz parte, é começo. Obviamente a pessoa de quem eu gosto sozinha na festa me incomodaria, mas não fiz cena. Claro que eu poderia ter agido melhor, mas será que foi tão grave? Um dia antes eu tinha voltado na estrada com você ao telefone. Na choperia, quando falei de conversarmos depois, você disse que não poderíamos continuar nos falando, mas ainda assim seguimos conversando normalmente, inclusive te mandei as fotos das armas.",
  "Até então eu não conhecia esse seu jeito de não responder; para mim era algo atípico e mandei mensagem apenas como um lembrete, mas ali você já parecia outra pessoa. Eu me desculpei inúmeras vezes por isso, mas você poderia ter tornado a situação mais leve apenas respondendo ou mandando uma mensagem no outro dia, em vez de acordar às 15h e nem ter a consideração de dar um \"boa tarde\". Reconheço que errei ao te mandar aquela mensagem cobrando e ter cutucado no dia seguinte, mas eu assumi a culpa pelo meu erro, pedi perdão e busquei corrigir as coisas. Mandei flores e não medi esforços. Uma coisa você nunca poderá negar: diante de qualquer episódio, e já na total ausência de reciprocidade, eu continuei demonstrando o quanto você era valiosa.",
  "No final de semana do dia 22/08, você disse que não nos veríamos porque sua família precisava de você. Sumiu o final de semana todo e depois surgiram fotos suas de biquíni na lancha de sabe-se lá quem, além de você seguir dezenas de pessoas e aparecer com novos amigos no perfil pessoal. E como eu reagi? Não abri a boca e continuei sendo o mesmo com você.",
  "No dia 27/08, a sua farra durou 5 dias entre Barretos, Franca e Rifaina. Foi foto em quarto de amigo, você no meio de outros caras, do sertanejo ao eletrônico passando pelo eletrofunk, vários DDDs em 2 estados diferentes e mais uma rodada de dezenas de pessoas seguidas. Enquanto você me respondia com frieza, a minha reação foi continuar fazendo convites, demonstrando carinho sem retribuição e sem reclamar.",
  "No feriado do dia 07/09, no rancho, mais uma vez você sumiu. Do nada mandou um áudio dizendo que se eu fosse você até animava vir para Ribeirão. Naquele momento senti um quentinho por dentro, mas depois você sumiu por 3 dias. Nisso apareceram fotos do lado de um cara na lancha, fotos abraçada com ele e, nos demais dias, você amanhecendo em apartamento e mais uma lista de novos amigos adicionados.",
  "A minha reação diante disso foi ficar digerindo em silêncio e mantendo a coerência de te tratar bem, inclusive te escrevendo uma carta para tentar explicar como me sentia.",
  "No dia 14/09, mais convites meus foram recusados, mais silêncio, e eu no completo vácuo. No domingo à noite veio mais uma foto de biquíni dentro de uma lancha após outro fim de semana de silêncio. E como eu agi? Da mesma forma, em silêncio, me preocupando se você estava bem e se tudo aquilo era algum tipo de sinal de fuga de alguém que poderia não estar bem.",
  "Para cada falha minha que você aponta, existem dezenas de atitudes suas que você jamais aceitaria. Você me julgou por suposições do que acha que eu poderia me tornar, me rotulou e me classificou como um cara sem caráter baseado em acusações sem fundamento, ignorando a postura e a consideração que eu realmente tive desde o primeiro momento.",
  "Fui ultrapassando meus limites e aceitando um tratamento que não merecia, até me dar conta do papel em que me coloquei por uma história de poucos dias.",
  "Hoje, você joga uma carga de raiva em cima de mim, diz que não sou o tipo de cara que você namoraria, me ofende e me bloqueia. A minha maior chateação é saber o quanto de desgaste eu poderia ter evitado se não tivesse permitido isso por tanto tempo.",
  "Não escrevo isso esperando desculpas, mudança ou resposta. Esse foi o meu limite.",
  "No balanço final do que cada um fez e representou, você está perdendo alguém que te tratou com um cuidado e um respeito que você não soube retribuir. Se isso não te incomoda, melhore.",
  "Não acredito nas suas desculpas, não espero que você mude!, mas confesso que eu torço pelo improvável, às vezes o palhaço se apega ao personagem!"
];

// Rota para gerar o link (Acesse https://anti-meme.onrender.com/api/create no seu navegador para gerar um link novo)
app.get('/api/create', (req, res) => {
  const token = crypto.randomBytes(12).toString('hex');
  messagesDB[token] = {
    paragraphs: messageParagraphs,
    registeredKey: null,
    status: 'pending'
  };
  
  const generatedLink = `https://anti-meme.onrender.com/read.html?token=${token}`;
  res.json({ 
    success: true, 
    link: generatedLink,
    message: "Link gerado com sucesso. Envie esta URL no Direct do Instagram." 
  });
});

// Middleware que checa se o acesso é exclusivamente por iPhone
function isiPhone(userAgent) {
  return /iPhone/i.test(userAgent);
}

// Rota para ler a mensagem
app.post('/api/read-message', (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const { token, publicKey } = req.body;

  if (!isiPhone(userAgent)) {
    return res.status(403).json({ error: "Acesso restrito: Esta mensagem só pode ser aberta em um dispositivo iPhone." });
  }

  const session = messagesDB[token];

  if (!session || session.status === 'destroyed') {
    return res.status(410).json({ error: "Esta mensagem já foi lida e destruída permanentemente." });
  }

  // Trava de Dispositivo Único (Device Pairing)
  if (!session.registeredKey) {
    session.registeredKey = publicKey;
    session.status = 'active';
  } else if (session.registeredKey !== publicKey) {
    return res.status(403).json({ error: "Acesso negado: Este link já foi vinculado a outro iPhone." });
  }

  res.json({ paragraphs: session.paragraphs });
});

// Rota para autodestruição ao finalizar a leitura
app.post('/api/destroy-message', (req, res) => {
  const { token } = req.body;
  if (messagesDB[token]) {
    delete messagesDB[token];
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
