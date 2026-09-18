import "./division/sheet.js";
import "./division/school.js";
import "./division/evolution.js";
import "./division/comparison.js";

function switchTab(tabName) {

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


    if (tabName === "sheet") {

        document.getElementById(
            "contentSheet"
        ).style.display = "block";

        document.getElementById(
            "btnSheet"
        ).classList.add("active");


    } else if (tabName === "evolution") {

        document.getElementById(
            "contentEvolution"
        ).style.display = "block";

        document.getElementById(
            "btnEvolution"
        ).classList.add("active");

        if (window.initializeEvolution) {
            window.initializeEvolution();
        }


    } else if (tabName === "comparison") {

        document.getElementById(
            "contentComparison"
        ).style.display = "block";

        document.getElementById(
            "btnComparison"
        ).classList.add("active");

        if (window.initializeComparison) {
            window.initializeComparison();
        }


    } else if (tabName === "schools") {

        document.getElementById(
            "contentSchools"
        ).style.display = "block";

        document.getElementById(
            "btnSchools"
        ).classList.add("active");

        if (window.initializeSchools) {
            window.initializeSchools();
        }
    }
}


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


window.switchTab = switchTab;