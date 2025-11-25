/**
 * Script para popular o banco de dados com transações de exemplo para 2025
 * Execute com: node scripts/add-sample-2025-transactions.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json'); // Você precisará baixar isso do Firebase Console

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'studio-8444859572-1c9a4'
  });
}

const db = admin.firestore();

// Categorias e suas características
const categories = {
  // Despesas
  'Alimentação': { type: 'expense', minAmount: 20, maxAmount: 150, frequency: 25 },
  'Transporte': { type: 'expense', minAmount: 10, maxAmount: 80, frequency: 20 },
  'Moradia': { type: 'expense', minAmount: 500, maxAmount: 1500, frequency: 1 },
  'Saúde': { type: 'expense', minAmount: 50, maxAmount: 300, frequency: 5 },
  'Educação': { type: 'expense', minAmount: 100, maxAmount: 500, frequency: 3 },
  'Lazer': { type: 'expense', minAmount: 30, maxAmount: 200, frequency: 10 },
  'Vestuário': { type: 'expense', minAmount: 50, maxAmount: 300, frequency: 5 },
  'Tecnologia': { type: 'expense', minAmount: 100, maxAmount: 1000, frequency: 2 },
  'Serviços': { type: 'expense', minAmount: 50, maxAmount: 200, frequency: 8 },
  'Outros': { type: 'expense', minAmount: 20, maxAmount: 150, frequency: 10 },
  
  // Receitas
  'Salário': { type: 'income', minAmount: 3000, maxAmount: 8000, frequency: 1 },
  'Freelance': { type: 'income', minAmount: 500, maxAmount: 2000, frequency: 3 },
  'Investimentos': { type: 'income', minAmount: 100, maxAmount: 1000, frequency: 1 },
  'Vendas': { type: 'income', minAmount: 50, maxAmount: 500, frequency: 5 },
};

// Descrições por categoria
const descriptions = {
  'Alimentação': ['Supermercado', 'Restaurante', 'Lanchonete', 'Padaria', 'Feira', 'Delivery', 'Café'],
  'Transporte': ['Uber', 'Combustível', 'Ônibus', 'Metrô', 'Estacionamento', 'Pedágio'],
  'Moradia': ['Aluguel', 'Condomínio', 'Luz', 'Água', 'Internet', 'Gás'],
  'Saúde': ['Farmácia', 'Consulta médica', 'Dentista', 'Exames', 'Academia', 'Plano de saúde'],
  'Educação': ['Curso online', 'Livros', 'Material escolar', 'Mensalidade'],
  'Lazer': ['Cinema', 'Show', 'Viagem', 'Streaming', 'Jogos', 'Restaurante'],
  'Vestuário': ['Roupas', 'Calçados', 'Acessórios'],
  'Tecnologia': ['Celular', 'Notebook', 'Acessórios tech', 'Software', 'Eletrônicos'],
  'Serviços': ['Limpeza', 'Manutenção', 'Assinatura', 'Delivery'],
  'Outros': ['Presente', 'Diversos', 'Imprevisto'],
  'Salário': ['Salário mensal', 'Pagamento'],
  'Freelance': ['Projeto freelance', 'Trabalho extra', 'Consultoria'],
  'Investimentos': ['Rendimento', 'Dividendos', 'Lucro'],
  'Vendas': ['Venda de item', 'Comissão'],
};

// Função para gerar valor aleatório
function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Função para gerar data aleatória em 2025
function randomDate(month) {
  const year = 2025;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  
  return new Date(year, month, day, hour, minute);
}

// Função principal
async function addSampleTransactions() {
  try {
    console.log('🚀 Iniciando população do banco de dados com transações de 2025...\n');

    // Pegar o primeiro usuário MASTER
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.error('❌ Nenhum usuário encontrado! Crie um usuário primeiro.');
      process.exit(1);
    }

    const userId = usersSnapshot.docs[0].id;
    const userName = usersSnapshot.docs[0].data().name;
    
    console.log(`👤 Adicionando transações para: ${userName} (${userId})\n`);

    let totalAdded = 0;
    const currencies = ['BRL', 'EUR', 'USD'];

    // Para cada mês de 2025
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(2025, month, 1).toLocaleString('pt-BR', { month: 'long' });
      console.log(`📅 Gerando transações para ${monthName}...`);

      let monthTransactions = 0;

      // Para cada categoria
      for (const [category, config] of Object.entries(categories)) {
        // Gerar transações baseado na frequência
        for (let i = 0; i < config.frequency; i++) {
          const date = randomDate(month);
          const amount = randomAmount(config.minAmount, config.maxAmount);
          const descOptions = descriptions[category];
          const description = descOptions[Math.floor(Math.random() * descOptions.length)];
          const currency = currencies[Math.floor(Math.random() * currencies.length)];

          const transaction = {
            amount,
            category,
            currency,
            date: date.toISOString(),
            description,
            type: config.type,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          await db.collection('users').doc(userId).collection('transactions').add(transaction);
          monthTransactions++;
          totalAdded++;
        }
      }

      console.log(`   ✅ ${monthTransactions} transações adicionadas\n`);
    }

    console.log(`\n🎉 Concluído! Total de ${totalAdded} transações adicionadas para 2025!`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Média de ${Math.round(totalAdded / 12)} transações por mês`);
    console.log(`   - ${Object.keys(categories).filter(c => categories[c].type === 'expense').length} categorias de despesas`);
    console.log(`   - ${Object.keys(categories).filter(c => categories[c].type === 'income').length} categorias de receitas`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar transações:', error);
    process.exit(1);
  }
}

// Executar
addSampleTransactions();
