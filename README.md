# MAC0499 — Visualização de Dados Orientados ao Tempo para Políticas Públicas Educacionais

Sistema web desenvolvido como parte do Trabalho de Conclusão de Curso em Ciência da Computação para exploração, análise e visualização de dados educacionais do **Censo Escolar**, disponibilizados pelo **Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP)**.

A plataforma integra dados educacionais, informações geográficas e visualizações interativas para facilitar a exploração da realidade das escolas brasileiras e a análise de sua evolução ao longo do tempo.

## Sobre o projeto

O sistema foi desenvolvido para apoiar a exploração de dados do Censo Escolar por meio de uma interface web que combina diferentes formas de análise.

A aplicação integra:

* dados educacionais estruturados em um **Data Warehouse (DW)**;
* informações geográficas para representação espacial das escolas;
* visualizações interativas;
* mecanismos de comparação entre escolas e divisões administrativas;
* análise de indicadores orientados ao tempo.

A proposta é permitir que informações que normalmente são consultadas de forma isolada sejam exploradas conjuntamente por meio de mapas, fichas técnicas, indicadores históricos e comparações.

## Tecnologias utilizadas

### Backend

O backend foi desenvolvido em **Python**, utilizando:

* **Flask** para desenvolvimento da aplicação web e das APIs;
* **SQLAlchemy** para acesso ao banco de dados;
* **PostgreSQL** como sistema de gerenciamento do banco de dados;
* **GeoPandas** para manipulação de dados geográficos;
* **PyJWT** para geração dos tokens utilizados na incorporação das visualizações do Metabase;
* **python-dotenv** para gerenciamento das configurações por variáveis de ambiente.

### Frontend

A interface utiliza:

* **HTML5**;
* **CSS3**;
* **JavaScript**;
* **Bootstrap** para componentes e organização visual;
* **Leaflet** para visualização e interação com mapas.

### Visualização

Os gráficos utilizados na aplicação são produzidos com **Metabase** e incorporados à interface web.

## Funcionalidades

### Busca de escolas

A plataforma permite pesquisar escolas pelo nome e localizar seus registros no mapa.

A seleção de uma escola permite acessar sua ficha técnica e explorar diferentes aspectos de sua estrutura e funcionamento.

### Ficha técnica

Cada escola possui uma ficha técnica com informações organizadas em diferentes categorias, incluindo:

* identificação e localização;
* atendimentos;
* matrículas;
* docentes;
* turmas;
* infraestrutura;
* dependências;
* acessibilidade;
* comunidade;
* tecnologia;
* materiais;
* profissionais.

### Mapa

O mapa apresenta espacialmente as escolas e permite aplicar filtros relacionados a:

* modalidade de ensino;
* dependência administrativa;
* categoria da escola privada;
* localização urbana ou rural.

Também é possível selecionar escolas diretamente no mapa para consultar suas informações.

### Análise espacial

A plataforma oferece diferentes formas de análise espacial dos dados educacionais.

Entre os recursos disponíveis estão:

* mapas de calor para observar a distribuição das escolas;
* filtros por modalidade e dependência administrativa;
* símbolos proporcionais para representar indicadores de matrículas;
* análises relacionadas a gênero e raça/cor.

### Evolução

A plataforma permite observar a evolução de diferentes indicadores educacionais ao longo dos anos.

Entre as categorias disponíveis estão:

* matrículas;
* docentes;
* turmas;
* modalidades;
* gênero;
* raça/cor;
* dependências;
* acessibilidade.

As visualizações podem representar a evolução dos valores, sua participação relativa e seu crescimento ao longo do período analisado.

### Comparação

O sistema permite comparar diferentes entidades educacionais e administrativas.

É possível realizar comparações entre:

* duas escolas;
* duas divisões administrativas do mesmo tipo.

As comparações podem considerar diferentes categorias e indicadores, permitindo observar a evolução e as diferenças entre os elementos selecionados.

## Dados

A principal fonte de dados utilizada pela plataforma é o **Censo Escolar da Educação Básica**, produzido pelo INEP.

Os dados são organizados em um Data Warehouse PostgreSQL, estruturado principalmente por tabelas dimensionais e tabelas de fatos.

Entre as principais estruturas utilizadas estão:

```text
dim_escola
dim_pais
dim_regiao
dim_uf
dim_municipio

fato_matricula
fato_docente
fato_turma
fato_estrutura
fato_curso
```

Essa organização permite relacionar informações das escolas a diferentes dimensões administrativas, temporais e educacionais.

Além dos dados tabulares, o sistema utiliza dados geográficos para representar divisões administrativas e a localização das escolas.

## Visualização e análise orientada ao tempo

A aplicação utiliza o tempo como uma dimensão importante para a exploração dos dados.

Em vez de apresentar somente valores referentes a um único ano, diferentes indicadores podem ser observados ao longo dos anos, permitindo identificar variações, crescimento, quedas e mudanças na composição dos dados.

A análise orientada ao tempo é combinada com informações espaciais e categóricas, permitindo explorar os indicadores de diferentes perspectivas dentro da mesma aplicação.

## Arquitetura

O backend está organizado por responsabilidade, utilizando módulos separados para os diferentes domínios da aplicação:

```text
routes/
├── school.py
├── division.py
├── evolution.py
├── comparison.py
└── spatial.py
```

O arquivo `app.py` funciona como ponto de entrada da aplicação e é responsável pela configuração principal e pelo registro dos módulos de rotas.

No frontend, a lógica também é dividida de acordo com as responsabilidades da aplicação. A funcionalidade do mapa, por exemplo, é organizada em módulos específicos para busca, filtros, análise administrativa, análise espacial e comparação.

Essa organização permite manter as diferentes funcionalidades isoladas e facilita a manutenção e evolução do sistema.

## Estrutura geral do projeto

A estrutura principal do repositório é organizada aproximadamente da seguinte forma:

```text
.
├── app.py
├── routes/
│   ├── __init__.py
│   ├── school.py
│   ├── division.py
│   ├── evolution.py
│   ├── comparison.py
│   └── spatial.py
├── templates/
├── static/
│   ├── css/
│   └── js/
├── shapefiles/
├── requirements.txt
├── LICENSE
├── .gitignore
└── .gitattributes
```

## Contexto acadêmico

O sistema foi desenvolvido no contexto do Trabalho de Conclusão de Curso em **Ciência da Computação**, com foco em **Visualização de Dados Orientados ao Tempo para Políticas Públicas Educacionais**.

O projeto investiga o uso de visualizações interativas para facilitar a exploração de dados educacionais e apoiar a análise de informações relevantes para políticas públicas.

## Licença

Este projeto está distribuído sob a **MIT License**.

Consulte o arquivo [`LICENSE`](LICENSE) para os termos completos da licença.
