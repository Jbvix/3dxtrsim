# ASD TUG SIM v3.3 - Simulador de Manobra de Rebocador ASD

**Autor:** Charlie Bravo  
**Versão:** 1.0  
**Última atualização:** 01/04/2026 22:45

Bem-vindo ao **ASD TUG SIM**, um simulador dinâmico de hidrodinâmica digital construído para recriar as operações náuticas desafiadoras de um autêntico rebocador *Azimuth Stern Drive* (ASD). O software recria perfeitamente o ambiente seguro e controlado do passadiço virtual, permitindo o engajamento através de manetes e a interação física exata com intempéries (correnteza, vento).

## ⚓ Tecnologias Utilizadas

A aplicação foi criada sem o uso de game engines e construída 100% sobre linguagens da Web:
- **HTML5 & CSS3 Vanilla**
- **JavaScript Moderno (ESModules)**
- **Three.js** (Para rendering 3D estrito)
- **Tailwind CSS** (Exclusivo da Home Page para apresentação)

## 🏗️ Estrutura e Práticas do Código

O repositório é rigorosamente mantido sob o escopo do nosso [Guia Oficial de Boas Práticas](BOAS-PRATICAS.md), cujo objetivo é promover manutenibilidade:
1. **Escopo Semântico de HTML**: Interface isolada de blocos lógicos.
2. **Organização de Código em Agrupamentos Lógicos**: Uso exaustivo de divisores demarcados e comentários explanatórios para segmentar setups, event handlers, loops e imports.
3. **Padrão de Endentação**: Estritamente 2 espaços sem alocações `tab`.

## ⚙️ Como Executar o Simulador Localmente

Devido as políticas rígidas de CORS de navegadores modernos para ES Modules (usado no módulo do Three.js), este projeto deve ser executado primariamente atravé de um servidor local.

### Usando Python (Comum em vários SOs)
```bash
python -m http.server 8080
```

### Usando NPM/Node.js
```bash
npx serve .
```

E em seguida, navegue pelo seu navegador no endereço: `http://localhost:8080/index.html`

## 🕹️ Funcionalidades e Níveis de Treinamento

O painel de Passadiço Virtual lhe oferece:
- Controle Azimutal com resposta mecânica fiel de embreagem e atrito.
- Cabos de amarração mensurando ruptura elástica (em breaking loads/t).
- Ajustes finos de inércia do casco, e controle do clima.

Você possui **4 níveis de treinamento** para calibrar a sua intuição marítima:
1. Nível Básico (Sem clima)
2. Atracação entre Balizamento IALA de Bóias Verticais/Encarnadas
3. Navegação sob Vento denso Perpendicular
4. Atracação em forte Corrente Marítima

## 🤝 Dificuldades e Manutenção

Reporte problemas no repositório do Github ou contate [jossiancosta@gmail.com](mailto:jossiancosta@gmail.com). Todo código entregue segue o rigor e a disciplina da manutenção evolutiva descrita no **BOAS-PRATICAS.md**.  
*Qualquer sugestão de melhoria: abra uma Issue.*
