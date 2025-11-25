'use client';

import * as React from 'react';
import { Book } from 'lucide-react';

// Versículos de Provérbios - NTLH (Nova Tradução na Linguagem de Hoje)
const proverbs = [
  { text: "Confie no Senhor de todo o coração e não se apoie na sua própria inteligência. Lembre do Senhor em tudo o que fizer, e ele lhe mostrará o caminho certo.", ref: "Provérbios 3:5-6" },
  { text: "O temor do Senhor é o princípio da sabedoria; conhecer o Santo é ter entendimento.", ref: "Provérbios 9:10" },
  { text: "Quem é paciente mostra grande compreensão, mas quem se irrita facilmente mostra pouca inteligência.", ref: "Provérbios 14:29" },
  { text: "A resposta calma acaba com a ira, mas a palavra áspera aumenta a raiva.", ref: "Provérbios 15:1" },
  { text: "É melhor comer pouco com o temor do Senhor do que ter muita riqueza e viver angustiado.", ref: "Provérbios 15:16" },
  { text: "O orgulho vem antes da destruição, e a vaidade, antes da queda.", ref: "Provérbios 16:18" },
  { text: "Melhor é ter bom nome do que grandes riquezas; ser respeitado vale mais do que prata e ouro.", ref: "Provérbios 22:1" },
  { text: "Ensine a criança no caminho em que deve andar, e mesmo quando for idosa não se desviará dele.", ref: "Provérbios 22:6" },
  { text: "Não inveje os maus nem queira viver com eles, pois eles só pensam em violência, e só falam de maldades.", ref: "Provérbios 24:1-2" },
  { text: "Como a cidade que tem os muros derrubados, assim é quem não sabe controlar-se.", ref: "Provérbios 25:28" },
  { text: "Assim como o ferro afia o ferro, uma pessoa afia a outra.", ref: "Provérbios 27:17" },
  { text: "Aquele que confia em si mesmo é tolo, mas quem anda no caminho da sabedoria está seguro.", ref: "Provérbios 28:26" },
  { text: "Quando não há visão, o povo se perde; mas feliz é aquele que obedece à Lei de Deus.", ref: "Provérbios 29:18" },
  { text: "Não me dês nem pobreza nem riqueza; dá-me o alimento que eu preciso.", ref: "Provérbios 30:8" },
  { text: "A mulher de valor quem a pode achar? Ela vale mais do que rubis.", ref: "Provérbios 31:10" },
  { text: "O que procura a justiça e o amor acha a vida, a justiça e a honra.", ref: "Provérbios 21:21" },
  { text: "As riquezas de nada valem no dia da ira de Deus, mas a honestidade livra da morte.", ref: "Provérbios 11:4" },
  { text: "Quem anda com os sábios será sábio, mas quem se ajunta com os tolos acabará mal.", ref: "Provérbios 13:20" },
  { text: "Há mais esperança para o tolo do que para quem se acha esperto.", ref: "Provérbios 26:12" },
  { text: "Não se vanglorie do dia de amanhã, pois você não sabe o que acontecerá.", ref: "Provérbios 27:1" },
  { text: "O rico pensa que é sábio, mas o pobre inteligente logo percebe a realidade.", ref: "Provérbios 28:11" },
  { text: "Quem encobre as suas transgressões nunca prosperará, mas quem as confessa e deixa alcançará misericórdia.", ref: "Provérbios 28:13" },
  { text: "Melhor é ser pobre e viver com honestidade do que ser rico e viver sem honestidade.", ref: "Provérbios 28:6" },
  { text: "A avareza provoca brigas, mas quem confia no Senhor prosperará.", ref: "Provérbios 28:25" },
  { text: "Quem ajuda os pobres empresta ao Senhor, e Deus lhe pagará o bem que fez.", ref: "Provérbios 19:17" },
  { text: "Quem é generoso prosperará; quem dá alívio aos outros receberá alívio.", ref: "Provérbios 11:25" },
  { text: "O plano bem pensado leva ao lucro; mas a pressa leva à pobreza.", ref: "Provérbios 21:5" },
  { text: "Os planos se confirmam com conselhos; portanto, faça a guerra com bons conselheiros.", ref: "Provérbios 20:18" },
  { text: "O filho sábio alegra o pai, mas o filho tolo é a tristeza da mãe.", ref: "Provérbios 10:1" },
  { text: "A língua que traz cura é árvore de vida, mas a língua enganosa quebra o espírito.", ref: "Provérbios 15:4" },
  { text: "O coração alegre serve de bom remédio, mas o espírito abatido faz secar os ossos.", ref: "Provérbios 17:22" }
];

export default function DailyProverb() {
  const [currentProverb, setCurrentProverb] = React.useState({ text: '', ref: '' });

  React.useEffect(() => {
    // Usar o dia do ano para selecionar o versículo
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // Selecionar versículo baseado no dia do ano
    const index = dayOfYear % proverbs.length;
    setCurrentProverb(proverbs[index]);
  }, []);

  const [modalOpen, setModalOpen] = React.useState(false);
  const shortText = currentProverb.text.length > 50 ? currentProverb.text.slice(0, 50) + '...' : currentProverb.text;

  return (
    <>
      <div className="border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start gap-3">
            <Book className="size-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm italic text-muted-foreground leading-relaxed mb-2">
                "{shortText}"
              </p>
              {currentProverb.text.length > 50 && (
                <button
                  className="mb-2 px-3 py-1 rounded bg-zinc-800 text-white text-xs hover:bg-zinc-900 transition"
                  onClick={() => setModalOpen(true)}
                >
                  Ler toda dica
                </button>
              )}
              <p className="text-xs font-medium text-primary">
                {currentProverb.ref} - NTLH
              </p>
            </div>
          </div>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h2 className="text-lg font-bold mb-2">Dica completa</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">{currentProverb.text}</p>
            <p className="text-xs font-medium text-primary mb-4">{currentProverb.ref} - NTLH</p>
            <button
              className="px-3 py-1 rounded bg-zinc-800 text-white text-xs hover:bg-zinc-900 transition w-full"
              onClick={() => setModalOpen(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
