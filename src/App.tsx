import DebugView from './ui/DebugView'

export default function App() {
  return (
    <main className="home">
      <h1>rehand-play</h1>
      <p>Reabilitação motora das mãos, de forma lúdica, direto no navegador.</p>
      <p className="notice">
        Ferramenta lúdica e de apoio. Não é um dispositivo médico e não
        substitui o acompanhamento profissional.
      </p>
      <DebugView />
    </main>
  )
}
