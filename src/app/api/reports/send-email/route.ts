import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    // Obter token do header para verificar autenticação
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verificar autenticação via REST API
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const verifyData = await verifyResponse.json();
    const userId = verifyData.users[0].localId;

    // Buscar dados do usuário
    const userUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}?key=${firebaseConfig.apiKey}`;
    const userResponse = await fetch(userUrl);
    const userDoc = await userResponse.json();
    const userData = userDoc.fields;
    
    const name = userData?.name?.stringValue || userData?.email?.stringValue || 'Usuário';
    const email = userData?.email?.stringValue || '';

    if (!email) {
      return NextResponse.json({ error: 'Email do usuário não encontrado' }, { status: 404 });
    }

    // Buscar transações do último período
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Buscar todas as transações do usuário (simplificado)
    const transactionsUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}/transactions?key=${firebaseConfig.apiKey}`;
    const transactionsResponse = await fetch(transactionsUrl);
    const transactionsData = await transactionsResponse.json();

    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    const categoryTotals: { [key: string]: number } = {};

    if (transactionsData.documents) {
      transactionsData.documents.forEach((doc: any) => {
        const fields = doc.fields;
        const amount = fields.amount?.doubleValue || fields.amount?.integerValue || 0;
        const type = fields.type?.stringValue;
        const category = fields.category?.stringValue || 'Sem categoria';

        transactionCount++;

        if (type === 'income') {
          totalIncome += amount;
        } else if (type === 'expense') {
          totalExpenses += amount;
          categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        }
      });
    }

    const balance = totalIncome - totalExpenses;

    // Preparar categorias para o gráfico (top 5)
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Buscar conversões de moeda
    const conversionsUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}/wiseTransactions?key=${firebaseConfig.apiKey}`;
    const conversionsResponse = await fetch(conversionsUrl);
    const conversionsData = await conversionsResponse.json();

    let totalConversions = 0;
    let totalConvertedValue = 0;
    let totalFees = 0;
    const conversionsByPair: { [key: string]: { count: number; value: number } } = {};

    if (conversionsData.documents) {
      conversionsData.documents.forEach((doc: any) => {
        const fields = doc.fields;
        const sourceAmount = fields.sourceAmount?.doubleValue || fields.sourceAmount?.integerValue || 0;
        const targetAmount = fields.targetAmount?.doubleValue || fields.targetAmount?.integerValue || 0;
        const fee = fields.fee?.doubleValue || fields.fee?.integerValue || 0;
        const sourceCurrency = fields.sourceCurrency?.stringValue || 'BRL';
        const targetCurrency = fields.targetCurrency?.stringValue || 'EUR';
        
        totalConversions++;
        totalConvertedValue += targetAmount;
        totalFees += fee;
        
        const pair = `${sourceCurrency} → ${targetCurrency}`;
        if (!conversionsByPair[pair]) {
          conversionsByPair[pair] = { count: 0, value: 0 };
        }
        conversionsByPair[pair].count++;
        conversionsByPair[pair].value += targetAmount;
      });
    }

    const averageConversionRate = totalConversions > 0 ? (totalFees / totalConversions) : 0;
    const topConversionPairs = Object.entries(conversionsByPair)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 5);

    // Buscar configurações de email
    let resendApiKey = process.env.RESEND_API_KEY || '';
    let resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Sistema Financeiro <onboarding@resend.dev>';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const masterSettingsUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${userId}?key=${firebaseConfig.apiKey}`;
    try {
      const masterResponse = await fetch(masterSettingsUrl);
      if (masterResponse.ok) {
        const masterDoc = await masterResponse.json();
        const fields = masterDoc.fields || {};
        if (fields.resendApiKey?.stringValue) resendApiKey = fields.resendApiKey.stringValue;
        if (fields.resendFromEmail?.stringValue) resendFromEmail = fields.resendFromEmail.stringValue;
      }
    } catch (err) {
      console.error('Erro ao buscar configurações do Resend:', err);
    }

    // Buscar template personalizado de relatório
    let reportTemplate: any = null;
    let reportOptions: any = null;
    try {
      const templateUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/emailTemplates/${userId}?key=${firebaseConfig.apiKey}`;
      const templateResponse = await fetch(templateUrl);
      if (templateResponse.ok) {
        const templateDoc = await templateResponse.json();
        const fields = templateDoc.fields || {};
        
        // Extrair template de relatório se existir
        if (fields.report?.mapValue?.fields) {
          const reportFields = fields.report.mapValue.fields;
          reportTemplate = {
            primaryColor: reportFields.primaryColor?.stringValue || '#667eea',
            secondaryColor: reportFields.secondaryColor?.stringValue || '#764ba2',
            backgroundColor: reportFields.backgroundColor?.stringValue || '#f4f4f4',
            textColor: reportFields.textColor?.stringValue || '#333333',
            fontFamily: reportFields.fontFamily?.stringValue || 'Arial, sans-serif',
            headerTitle: reportFields.headerTitle?.stringValue || '📊 Relatório de Transações',
            bodyText: reportFields.bodyText?.stringValue || '',
            footerText: reportFields.footerText?.stringValue || 'Este é um email automático de relatório.',
            companyName: reportFields.companyName?.stringValue || 'Sistema Financeiro',
          };
        }
        
        // Extrair opções de relatório se existirem
        if (fields.reportOptions?.mapValue?.fields) {
          const optFields = fields.reportOptions.mapValue.fields;
          reportOptions = {
            showIncomeExpenseChart: optFields.showIncomeExpenseChart?.booleanValue !== false,
            showCategoriesChart: optFields.showCategoriesChart?.booleanValue !== false,
            showTopCategories: optFields.showTopCategories?.booleanValue !== false,
            showMonthlyComparison: optFields.showMonthlyComparison?.booleanValue !== false,
            includePeriodSummary: optFields.includePeriodSummary?.booleanValue !== false,
            showConversionData: optFields.showConversionData?.booleanValue !== false,
            showConversionChart: optFields.showConversionChart?.booleanValue !== false,
          };
        }
      }
    } catch (err) {
      console.error('Erro ao buscar template de relatório:', err);
    }

    if (!resendApiKey) {
      return NextResponse.json({ 
        error: 'Serviço de email não configurado' 
      }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    // Usar template personalizado ou padrão
    const primaryColor = reportTemplate?.primaryColor || '#667eea';
    const secondaryColor = reportTemplate?.secondaryColor || '#764ba2';
    const backgroundColor = reportTemplate?.backgroundColor || '#f4f4f4';
    const textColor = reportTemplate?.textColor || '#333333';
    const fontFamily = reportTemplate?.fontFamily || 'Arial, sans-serif';
    const headerTitle = reportTemplate?.headerTitle || '📊 Relatório de Transações';
    const footerText = reportTemplate?.footerText || 'Este é um email automático de relatório.';
    const companyName = reportTemplate?.companyName || 'Sistema Financeiro';
    
    // Opções de relatório (padrão: mostrar tudo)
    const showPeriodSummary = reportOptions?.includePeriodSummary !== false;
    const showTopCats = reportOptions?.showTopCategories !== false;
    const showIncomeExpenseChart = reportOptions?.showIncomeExpenseChart !== false;
    const showCategoriesChart = reportOptions?.showCategoriesChart !== false;
    const showConversionData = reportOptions?.showConversionData !== false;
    const showConversionChart = reportOptions?.showConversionChart !== false;
    
    // Gerar URLs de gráficos usando QuickChart
    let incomeExpenseChartUrl = '';
    let categoriesChartUrl = '';
    let conversionChartUrl = '';

    if (showIncomeExpenseChart) {
      const chartConfig = {
        type: 'bar',
        data: {
          labels: ['Receitas', 'Despesas'],
          datasets: [{
            label: 'Valor (R$)',
            data: [totalIncome, totalExpenses],
            backgroundColor: ['rgba(46, 125, 50, 0.8)', 'rgba(198, 40, 40, 0.8)'],
            borderColor: ['rgb(46, 125, 50)', 'rgb(198, 40, 40)'],
            borderWidth: 2
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'R$ ' + value.toFixed(2);
                }
              }
            }
          },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Receitas vs Despesas',
              font: { size: 16 }
            }
          }
        }
      };
      incomeExpenseChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=500&height=300&backgroundColor=white`;
    }

    if (showCategoriesChart && topCategories.length > 0) {
      const chartConfig = {
        type: 'doughnut',
        data: {
          labels: topCategories.map(([cat]) => cat),
          datasets: [{
            data: topCategories.map(([, amt]) => amt),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 12 } }
            },
            title: {
              display: true,
              text: 'Distribuição por Categorias',
              font: { size: 16 }
            }
          }
        }
      };
      categoriesChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=500&height=350&backgroundColor=white`;
    }

    // Gráfico de conversões (horizontal bar chart)
    if (showConversionChart && topConversionPairs.length > 0) {
      const chartConfig = {
        type: 'bar',
        data: {
          labels: topConversionPairs.map(([pair]) => pair),
          datasets: [{
            label: 'Valor Convertido',
            data: topConversionPairs.map(([, data]) => data.value),
            backgroundColor: 'rgba(33, 150, 243, 0.8)',
            borderColor: 'rgb(33, 150, 243)',
            borderWidth: 2
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Top 5 Conversões de Moeda',
              font: { size: 16 }
            }
          },
          scales: {
            x: {
              beginAtZero: true
            }
          }
        }
      };
      conversionChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=500&height=300&backgroundColor=white`;
    }
    
    // Gerar texto customizado do body se houver template
    let customBodyText = '';
    if (reportTemplate?.bodyText) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const periodo = `${startDate.toLocaleDateString('pt-BR')} a ${new Date().toLocaleDateString('pt-BR')}`;
      
      const topCategoriesText = showTopCats ? topCategories.map(([cat, amt], idx) => 
        `${idx + 1}. ${cat} - R$ ${amt.toFixed(2)}`
      ).join('<br>') : '';

      const topConversionsText = showConversionData ? topConversionPairs.map(([pair, data], idx) => 
        `${idx + 1}. ${pair}: ${data.value.toFixed(2)}`
      ).join('<br>') : '';
      
      customBodyText = reportTemplate.bodyText
        .replace(/{nome}/g, name)
        .replace(/{periodo}/g, periodo)
        .replace(/{totalReceitas}/g, `R$ ${totalIncome.toFixed(2)}`)
        .replace(/{totalDespesas}/g, `R$ ${totalExpenses.toFixed(2)}`)
        .replace(/{saldo}/g, `R$ ${balance.toFixed(2)}`)
        .replace(/{totalTransacoes}/g, transactionCount.toString())
        .replace(/{totalConversoes}/g, totalConversions.toString())
        .replace(/{valorTotalConvertido}/g, `${totalConvertedValue.toFixed(2)}`)
        .replace(/{taxaMediaConversao}/g, averageConversionRate.toFixed(2))
        .replace(/{topMoedasConversao}/g, topConversionsText)
        .replace(/{topCategorias}/g, topCategoriesText)
        .replace(/\n/g, '<br>');
    }
    
    const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Relatório Financeiro</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${backgroundColor};">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${backgroundColor}; min-width: 100%;">
      <tr>
        <td align="center" style="padding: 20px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; max-width: 600px; border-radius: 8px; overflow: hidden;">
            <!-- Header -->
            <tr>
              <td align="center" bgcolor="${primaryColor}" style="padding: 30px 20px; background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);">
                <h1 style="margin: 0; font-family: ${fontFamily}; font-size: 26px; font-weight: bold; color: #ffffff;">
                  ${headerTitle}
                </h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 30px 20px; font-family: ${fontFamily}; font-size: 15px; line-height: 1.6; color: ${textColor};">
                ${customBodyText || `<p>Olá <strong>${name}</strong>,</p>
                <p>Aqui está o resumo das suas transações dos últimos 30 dias:</p>`}
                
                ${showPeriodSummary ? `
                <!-- Stats -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                  <tr>
                    <td style="padding: 15px; background-color: #e8f5e9; border-radius: 6px; text-align: center;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Receitas</p>
                      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2e7d32;">
                        R$ ${totalIncome.toFixed(2)}
                      </p>
                    </td>
                    <td style="width: 10px;"></td>
                    <td style="padding: 15px; background-color: #ffebee; border-radius: 6px; text-align: center;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Despesas</p>
                      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #c62828;">
                        R$ ${totalExpenses.toFixed(2)}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="3" style="height: 10px;"></td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 15px; background-color: ${balance >= 0 ? '#e3f2fd' : '#fff3e0'}; border-radius: 6px; text-align: center;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Saldo</p>
                      <p style="margin: 0; font-size: 28px; font-weight: bold; color: ${balance >= 0 ? '#1565c0' : '#ef6c00'};">
                        R$ ${balance.toFixed(2)}
                      </p>
                    </td>
                  </tr>
                </table>` : ''}

                ${showTopCats && topCategories.length > 0 ? `
                <p style="margin: 20px 0 10px 0; font-size: 16px; font-weight: bold;">Top Categorias de Despesas:</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  ${topCategories.map(([category, amount]) => `
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-size: 14px;">${category}</span>
                      </td>
                      <td align="right" style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-size: 14px; font-weight: bold;">R$ ${amount.toFixed(2)}</span>
                      </td>
                    </tr>
                  `).join('')}
                </table>` : ''}

                <p style="margin: 20px 0 10px 0;">
                  <strong>Total de transações:</strong> ${transactionCount}
                </p>

                ${showIncomeExpenseChart && incomeExpenseChartUrl ? `
                <!-- Gráfico de Receitas vs Despesas -->
                <div style="margin: 30px 0; text-align: center;">
                  <img src="${incomeExpenseChartUrl}" alt="Gráfico de Receitas vs Despesas" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                </div>
                ` : ''}

                ${showCategoriesChart && categoriesChartUrl ? `
                <!-- Gráfico de Distribuição por Categorias -->
                <div style="margin: 30px 0; text-align: center;">
                  <img src="${categoriesChartUrl}" alt="Gráfico de Distribuição por Categorias" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                </div>
                ` : ''}

                ${showConversionData && totalConversions > 0 ? `
                <!-- Dados de Conversão -->
                <p style="margin: 30px 0 10px 0; font-size: 18px; font-weight: bold; color: ${primaryColor};">💱 Conversões de Moeda</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 10px 0;">
                  <tr>
                    <td style="padding: 12px; background-color: #e3f2fd; border-radius: 6px; text-align: center; width: 50%;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Total de Conversões</p>
                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1565c0;">
                        ${totalConversions}
                      </p>
                    </td>
                    <td style="width: 10px;"></td>
                    <td style="padding: 12px; background-color: #f3e5f5; border-radius: 6px; text-align: center; width: 50%;">
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Valor Total Convertido</p>
                      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #7b1fa2;">
                        ${totalConvertedValue.toFixed(2)}
                      </p>
                    </td>
                  </tr>
                </table>
                ${topConversionPairs.length > 0 ? `
                <p style="margin: 15px 0 10px 0; font-size: 14px; font-weight: bold;">Top Conversões:</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  ${topConversionPairs.map(([pair, data]) => `
                    <tr>
                      <td style="padding: 6px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-size: 13px;">${pair}</span>
                      </td>
                      <td align="right" style="padding: 6px 0; border-bottom: 1px solid #e0e0e0;">
                        <span style="font-size: 13px; font-weight: bold;">${data.value.toFixed(2)}</span>
                      </td>
                    </tr>
                  `).join('')}
                </table>` : ''}
                ` : ''}

                ${showConversionChart && conversionChartUrl ? `
                <!-- Gráfico de Conversões -->
                <div style="margin: 30px 0; text-align: center;">
                  <img src="${conversionChartUrl}" alt="Gráfico de Conversões" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                </div>
                ` : ''}

                <!-- Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                  <tr>
                    <td align="center">
                      <a href="${appUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 30px; font-family: ${fontFamily}; font-size: 16px; font-weight: bold; color: #ffffff !important; text-decoration: none; border-radius: 6px; background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);">Ver Detalhes</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td bgcolor="#f8f9fa" style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center; font-family: ${fontFamily}; font-size: 12px; color: #666666;">
                <p style="margin: 0 0 8px 0;">${footerText}</p>
                <p style="margin: 0;">© ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [email],
      subject: `📊 Relatório Financeiro - ${new Date().toLocaleDateString('pt-BR')}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        transactionCount
      }
    });

  } catch (error: any) {
    console.error('Erro ao enviar relatório:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao enviar relatório' 
    }, { status: 500 });
  }
}
