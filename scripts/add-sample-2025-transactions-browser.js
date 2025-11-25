/**
 * Script para popular o banco de dados com transações de exemplo para 2025
 * Execute diretamente no navegador (Console do DevTools) enquanto estiver logado
 */

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
  'Alimentação': ['Supermercado Pão de Açúcar', 'Restaurante Japonês', 'Lanchonete', 'Padaria', 'Feira orgânica', 'iFood Delivery', 'Starbucks'],
  'Transporte': ['Uber', 'Combustível Shell', 'Passagem de ônibus', 'Metrô', 'Estacionamento shopping', 'Pedágio'],
  'Moradia': ['Aluguel', 'Condomínio', 'Conta de luz', 'Conta de água', 'Internet fibra', 'Gás'],
  'Saúde': ['Farmácia Drogasil', 'Consulta médica', 'Dentista', 'Exames laboratoriais', 'Academia SmartFit', 'Plano de saúde'],
  'Educação': ['Curso Udemy', 'Livro técnico', 'Material escolar', 'Mensalidade faculdade'],
  'Lazer': ['Cinema', 'Show', 'Viagem final de semana', 'Netflix', 'PlayStation Store', 'Restaurante'],
  'Vestuário': ['Roupas Zara', 'Tênis Nike', 'Acessórios'],
  'Tecnologia': ['iPhone', 'MacBook', 'Mouse sem fio', 'Adobe Creative Cloud', 'Fone Bluetooth'],
  'Serviços': ['Limpeza residencial', 'Manutenção carro', 'Spotify Premium', 'Amazon Prime'],
  'Outros': ['Presente aniversário', 'Diversos', 'Imprevisto'],
  'Salário': ['Salário mensal', 'Pagamento empresa'],
  'Freelance': ['Projeto desenvolvimento web', 'Consultoria TI', 'Design freelance'],
  'Investimentos': ['Rendimento CDB', 'Dividendos ações', 'Lucro investimento'],
  'Vendas': ['Venda notebook usado', 'Comissão venda'],
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

// Função para adicionar com delay (evitar sobrecarga)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal
async function addSample2025Transactions() {
  // Importar Firebase do contexto global (assumindo que está na página)
  const { getFirestore, collection, addDoc } = window.firebase || {};
  const { getAuth } = window.firebase || {};
  
  if (!window.firebase) {
    console.error('❌ Firebase não encontrado! Execute este script no dashboard da aplicação.');
    return;
  }

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  if (!user) {
    console.error('❌ Usuário não autenticado! Faça login primeiro.');
    return;
  }

  console.log('🚀 Iniciando população do banco de dados com transações de 2025...\n');
  console.log(`👤 Usuário: ${user.email}\n`);

  let totalAdded = 0;
  const currencies = ['BRL', 'EUR', 'USD'];

  try {
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const transactionsRef = collection(db, 'users', user.uid, 'transactions');
          await addDoc(transactionsRef, transaction);
          
          monthTransactions++;
          totalAdded++;

          // Pequeno delay a cada 10 transações
          if (totalAdded % 10 === 0) {
            await sleep(100);
          }
        }
      }

      console.log(`   ✅ ${monthTransactions} transações adicionadas\n`);
    }

    console.log(`\n🎉 Concluído! Total de ${totalAdded} transações adicionadas para 2025!`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Média de ${Math.round(totalAdded / 12)} transações por mês`);
    console.log(`   - ${Object.keys(categories).filter(c => categories[c].type === 'expense').length} categorias de despesas`);
    console.log(`   - ${Object.keys(categories).filter(c => categories[c].type === 'income').length} categorias de receitas`);
    
    console.log('\n✨ Recarregue a página para ver as novas transações!');
  } catch (error) {
    console.error('❌ Erro ao adicionar transações:', error);
  }
}

// Exportar para uso
window.addSample2025Transactions = addSample2025Transactions;

console.log('✅ Script carregado! Execute: addSample2025Transactions()');
