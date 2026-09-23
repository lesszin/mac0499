import "./details/evolution.js";
import "./details/comparison.js";
import "./details/sheet.js";


function switchTab(
    tabName,
    initialize = true
) {
    /**
     * Alterna entre as abas disponíveis na ficha técnica da escola.
     *
     * Oculta todos os conteúdos e remove o estado ativo dos botões
     * antes de exibir a aba solicitada.
     *
     * Quando solicitado, também inicializa o módulo correspondente
     * à aba de evolução ou comparação.
     *
     * @param {string} tabName Nome da aba que deve ser exibida.
     * @param {boolean} initialize Indica se o módulo da aba deve
     * ser inicializado ao realizar a troca.
     */

    // Oculta todos os conteúdos das abas.
    document
        .getElementById(
            "contentSheet"
        )
        .style.display = "none";

    document
        .getElementById(
            "contentEvolution"
        )
        .style.display = "none";

    document
        .getElementById(
            "contentComparison"
        )
        .style.display = "none";


    // Remove o estado ativo dos botões das abas.
    document
        .getElementById(
            "btnSheet"
        )
        .classList.remove("active");

    document
        .getElementById(
            "btnEvolution"
        )
        .classList.remove("active");

    document
        .getElementById(
            "btnComparison"
        )
        .classList.remove("active");


    // Exibe a aba da ficha técnica.
    if (tabName === "sheet") {

        document
            .getElementById(
                "contentSheet"
            )
            .style.display = "block";

        document
            .getElementById(
                "btnSheet"
            )
            .classList.add("active");


    // Exibe a aba de evolução e inicializa seu módulo
    // quando a inicialização foi solicitada.
    } else if (tabName === "evolution") {

        document
            .getElementById(
                "contentEvolution"
            )
            .style.display = "block";

        document
            .getElementById(
                "btnEvolution"
            )
            .classList.add("active");

        if (initialize) {
            window.initializeEvolution();
        }


    // Exibe a aba de comparação e inicializa seu módulo
    // quando a inicialização foi solicitada.
    } else if (tabName === "comparison") {

        document
            .getElementById(
                "contentComparison"
            )
            .style.display = "block";

        document
            .getElementById(
                "btnComparison"
            )
            .classList.add("active");

        if (
            initialize &&
            window.initializeComparison
        ) {
            window.initializeComparison();
        }
    }
}


// Disponibiliza a função para os elementos da interface
// e para os demais módulos da página.
window.switchTab = switchTab;