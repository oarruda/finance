const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample transactions data
const sampleTransactions = [
  // Novembro 2024
  { type: 'expense', description: 'Supermercado Pão de Açúcar', amount: 450.00, currency: 'BRL', date: '2024-11-01', category: 'Alimentação' },
  { type: 'expense', description: 'Conta de Luz CEMIG', amount: 280.50, currency: 'BRL', date: '2024-11-05', category: 'Moradia' },
  { type: 'income', description: 'Salário Mensal', amount: 8500.00, currency: 'BRL', date: '2024-11-05', category: 'Salário' },
  { type: 'expense', description: 'Netflix Assinatura', amount: 44.90, currency: 'BRL', date: '2024-11-08', category: 'Entretenimento' },
  { type: 'expense', description: 'Gasolina Posto Shell', amount: 320.00, currency: 'BRL', date: '2024-11-10', category: 'Transporte' },
  { type: 'expense', description: 'Farmácia Drogasil', amount: 156.70, currency: 'BRL', date: '2024-11-12', category: 'Saúde' },
  { type: 'expense', description: 'Restaurante Outback', amount: 285.00, currency: 'BRL', date: '2024-11-14', category: 'Alimentação' },
  { type: 'expense', description: 'Conta de Água COPASA', amount: 95.30, currency: 'BRL', date: '2024-11-15', category: 'Moradia' },
  { type: 'expense', description: 'Cinema Cinemark', amount: 78.00, currency: 'BRL', date: '2024-11-16', category: 'Entretenimento' },
  { type: 'expense', description: 'Uber Viagens', amount: 124.50, currency: 'BRL', date: '2024-11-18', category: 'Transporte' },
  { type: 'expense', description: 'Supermercado Extra', amount: 380.20, currency: 'BRL', date: '2024-11-19', category: 'Alimentação' },
  { type: 'expense', description: 'Spotify Premium', amount: 21.90, currency: 'BRL', date: '2024-11-20', category: 'Entretenimento' },
  
  // Outubro 2024
  { type: 'income', description: 'Salário Mensal', amount: 8500.00, currency: 'BRL', date: '2024-10-05', category: 'Salário' },
  { type: 'expense', description: 'Supermercado Carrefour', amount: 520.00, currency: 'BRL', date: '2024-10-08', category: 'Alimentação' },
  { type: 'expense', description: 'Conta de Luz CEMIG', amount: 265.80, currency: 'BRL', date: '2024-10-10', category: 'Moradia' },
  { type: 'expense', description: 'Gasolina Posto Ipiranga', amount: 300.00, currency: 'BRL', date: '2024-10-12', category: 'Transporte' },
  { type: 'expense', description: 'Academia Smart Fit', amount: 89.90, currency: 'BRL', date: '2024-10-15', category: 'Saúde' },
  { type: 'expense', description: 'Restaurante Japonês', amount: 195.00, currency: 'BRL', date: '2024-10-18', category: 'Alimentação' },
  { type: 'expense', description: 'Conta de Água COPASA', amount: 88.20, currency: 'BRL', date: '2024-10-20', category: 'Moradia' },
  { type: 'expense', description: 'Uber Viagens', amount: 98.40, currency: 'BRL', date: '2024-10-22', category: 'Transporte' },
  
  // Setembro 2024
  { type: 'income', description: 'Salário Mensal', amount: 8500.00, currency: 'BRL', date: '2024-09-05', category: 'Salário' },
  { type: 'expense', description: 'Supermercado Atacadão', amount: 485.00, currency: 'BRL', date: '2024-09-07', category: 'Alimentação' },
  { type: 'expense', description: 'Conta de Luz CEMIG', amount: 298.60, currency: 'BRL', date: '2024-09-10', category: 'Moradia' },
  { type: 'expense', description: 'Gasolina Posto BR', amount: 310.00, currency: 'BRL', date: '2024-09-12', category: 'Transporte' },
  { type: 'expense', description: 'Plano de Saúde Unimed', amount: 620.00, currency: 'BRL', date: '2024-09-15', category: 'Saúde' },
  { type: 'expense', description: 'Shopping Roupas', amount: 450.00, currency: 'BRL', date: '2024-09-18', category: 'Vestuário' },
  { type: 'expense', description: 'Conta de Água COPASA', amount: 92.50, currency: 'BRL', date: '2024-09-20', category: 'Moradia' },
  { type: 'expense', description: 'Cinema + Pipoca', amount: 95.00, currency: 'BRL', date: '2024-09-22', category: 'Entretenimento' },
];

async function addSampleTransactions() {
  const userId = 'wU4jJII35pZx8a6uiMinNsprT0u2'; // rafael@rafaelarruda.com
  
  console.log('Adding sample transactions...');
  
  for (const transaction of sampleTransactions) {
    try {
      const docRef = await db.collection('users').doc(userId).collection('transactions').add({
        ...transaction,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✓ Added transaction: ${transaction.description} - ${docRef.id}`);
    } catch (error) {
      console.error(`✗ Error adding ${transaction.description}:`, error);
    }
  }
  
  console.log('\nDone! Added', sampleTransactions.length, 'sample transactions.');
  process.exit(0);
}

addSampleTransactions();
