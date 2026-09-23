import "./division/sheet.js";
import "./division/school.js";
import "./division/evolution.js";
import "./division/comparison.js";


function switchTab(tabName) {
    /**
     * Alterna entre as abas disponíveis na ficha da divisão administrativa.
     *
     * Oculta todos os conteúdos e remove o estado ativo dos botões antes
     * de exibir a aba solicitada. Algumas abas também inicializam seus
     * respectivos módulos quando são selecionadas.
     *
     * @param {string} tabName Nome da aba que deve ser exibida.
     */

    // Oculta todos os conteúdos das abas.
    document.getElementById(
        "contentSheet"
    ).style.display = "none";

    document.getElementById(
        "contentEvolution"
    ).style.display = "none";

    document.getElementById(
        "contentComparison"
    ).style.display = "none";

    document.getElementById(
        "contentSchools"
    ).style.display = "none";


    // Remove o estado ativo de todos os botões.
    document.getElementById(
        "btnSheet"
    ).classList.remove("active");

    document.getElementById(
        "btnEvolution"
    ).classList.remove("active");

    document.getElementById(
        "btnComparison"
    ).classList.remove("active");

    document.getElementById(
        "btnSchools"
    ).classList.remove("active");


    // Exibe a aba da ficha técnica.
    if (tabName === "sheet") {

        document.getElementById(
            "contentSheet"
        ).style.display = "block";

        document.getElementById(
            "btnSheet"
        ).classList.add("active");


    // Exibe e inicializa a aba de evolução.
    } else if (tabName === "evolution") {

        document.getElementById(
            "contentEvolution"
        ).style.display = "block";

        document.getElementById(
            "btnEvolution"
        ).classList.add("active");


        // Inicializa o módulo de evolução quando disponível.
        if (window.initializeEvolution) {
            window.initializeEvolution();
        }


    // Exibe e inicializa a aba de comparação.
    } else if (tabName === "comparison") {

        document.getElementById(
            "contentComparison"
        ).style.display = "block";

        document.getElementById(
            "btnComparison"
        ).classList.add("active");


        // Inicializa o módulo de comparação quando disponível.
        if (window.initializeComparison) {
            window.initializeComparison();
        }


    // Exibe e inicializa a aba de escolas.
    } else if (tabName === "schools") {

        document.getElementById(
            "contentSchools"
        ).style.display = "block";

        document.getElementById(
            "btnSchools"
        ).classList.add("active");


        // Inicializa o módulo de escolas quando disponível.
        if (window.initializeSchools) {
            window.initializeSchools();
        }
    }
}


// Para a ficha do país, a aba de comparação não é disponibilizada.
if (window.DIVISION_TYPE === "pais") {

    const comparisonTab =
        document.getElementById(
            "comparisonTab"
        );

    if (comparisonTab) {
        comparisonTab.classList.add(
            "d-none"
        );
    }
}


// Disponibiliza a função para ser utilizada pelos elementos da interface.
window.switchTab = switchTab;